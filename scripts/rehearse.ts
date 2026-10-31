// Failure rehearsal for the backend. Run after `bun scripts/smoke.ts --keep` (needs a seeded, ingested company).
//   bun scripts/rehearse.ts actors     actor runtime restarts: state must survive, calls must fail fast while it's down
//   bun scripts/rehearse.ts agents     OpenAI calls time out: intake must fail cleanly, briefing must still arrive
//   bun scripts/rehearse.ts            both
import { copyFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

import { ROOT, api, start, stop, waitForActors } from "./stack.js"

const COMPANY = "ironline"
const DATA = "http://127.0.0.1:4000"
const INF = "http://127.0.0.1:4100"
const which = process.argv[2] ?? "all"
const failures: string[] = []
const check = (ok: boolean, msg: string) => {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`)
    if (!ok) failures.push(msg)
}
const summary = (s: any) => ({
    loads: JSON.stringify(s.loads),
    findings: JSON.stringify((s.findings ?? []).map((f: any) => [f.id, f.amount])),
    tables: JSON.stringify(s.tables)
})

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value?: T; error?: string }> {
    const t = performance.now()
    try {
        const value = await fn()
        return { ms: Math.round(performance.now() - t), value }
    } catch (e) {
        return { ms: Math.round(performance.now() - t), error: String((e as Error).message ?? e) }
    }
}

async function rehearseActorRestart() {
    console.log("\n== actor runtime restart")
    const before = await api.get(`${DATA}/api/companies/${COMPANY}/snapshot`)
    check(before.loads.length > 0 && before.findings.length > 0, `baseline: ${before.loads.length} loads, ${before.findings.length} findings`)

    await stop("actors")
    console.log("  actor runtime stopped")
    const down = await timed(() => api.post(`${DATA}/api/companies/${COMPANY}/check`, { asOf: "2026-10-30" }, 30_000))
    const failedFast = down.ms < 20_000 && (down.error !== undefined || (down.value as any)?.status >= 500)
    check(failedFast, `while down, /check fails instead of hanging (${down.ms} ms: ${down.error ?? `HTTP ${(down.value as any)?.status} ${JSON.stringify((down.value as any)?.body).slice(0, 120)}`})`)

    const ms = await start("actors")
    const serving = await waitForActors(COMPANY)
    console.log(`  actor runtime back (${ms} ms to listen, +${serving} ms to serve)`)
    const after = await api.get(`${DATA}/api/companies/${COMPANY}/snapshot`)
    const [a, b] = [summary(before), summary(after)]
    check(a.loads === b.loads, `all ${after.loads.length} load records survived the restart`)
    check(a.findings === b.findings, `persisted findings survived (${after.findings.length})`)
    check(a.tables === b.tables, `company SQLite tables and row counts survived (${after.tables.length} tables)`)
    const again = await api.post(`${DATA}/api/companies/${COMPANY}/check`, { asOf: "2026-10-30" })
    check(
        again.status === 200 && JSON.stringify(again.body.findings.map((f: any) => [f.id, f.amount])) === b.findings,
        `re-running the check after restart gives identical findings ($${again.body.totalAtRisk} at risk)`
    )
}

async function rehearseAgentTimeout() {
    console.log("\n== agent timeout (OpenAI unreachable / slow)")
    await stop("inference")
    await start("inference", { EXTRACT_TIMEOUT_MS: "1", BRIEFER_TIMEOUT_MS: "1" })
    console.log("  inference restarted with 1 ms OpenAI timeouts")
    const before = await api.get(`${DATA}/api/companies/${COMPANY}/snapshot`)

    // A file the cache has never seen, so intake must call OpenAI.
    const dir = join(ROOT, "data/cache/rehearse")
    mkdirSync(dir, { recursive: true })
    const name = `rehearse_${Date.now()}.jpg`
    copyFileSync(join(ROOT, "data/fleet_demo/inbox/2026-10-26/IMG_20261026_113032.jpg"), join(dir, name))
    const form = new FormData()
    form.append("files", new Blob([await Bun.file(join(dir, name)).arrayBuffer()], { type: "image/jpeg" }), name)
    const t = performance.now()
    const r = await fetch(`${INF}/api/companies/${COMPANY}/ingest`, { method: "POST", body: form, signal: AbortSignal.timeout(60_000) })
    const body = await r.json()
    const ms = Math.round(performance.now() - t)
    check(r.ok && body[0]?.error !== undefined, `intake returns a per-file error instead of hanging (${ms} ms: ${String(body[0]?.error).slice(0, 90)})`)
    const mid = await api.get(`${DATA}/api/companies/${COMPANY}/snapshot`)
    check(JSON.stringify(mid.loads) === JSON.stringify(before.loads) && mid.unmatched.length === before.unmatched.length, "nothing half-written to the actors")

    const chk = await api.post(`${DATA}/api/companies/${COMPANY}/check`, { asOf: "2026-10-30" })
    const text: string = chk.body.briefing?.text ?? ""
    check(chk.status === 200 && text.startsWith("Ironline nightly check"), `briefing still delivered via template fallback (${chk.ms} ms)`)
    console.log(text.split("\n").map(l => `      | ${l}`).join("\n"))

    await stop("inference")
    await start("inference")
    console.log("  inference restored with normal timeouts")
}

if (which === "actors" || which === "all") await rehearseActorRestart()
if (which === "agents" || which === "all") await rehearseAgentTimeout()
console.log(`\n${failures.length ? `FAILED (${failures.length})` : "ALL PASS"}`)
process.exit(failures.length ? 1 : 0)

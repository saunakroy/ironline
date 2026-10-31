// Backend smoke test, graded by the answer key.
//   bun scripts/smoke.ts            reuse running services, or start missing ones
//   bun scripts/smoke.ts --cold     stop everything, start from scratch
//   --keep                          leave services running afterwards (default: stop what this run started)
//   --company <id>                  company actor id (default "ironline")
// Exits 1 unless: all 9 in-scope findings at exact amounts, on the right loads, nothing extra, zero unmatched
// paperwork (DVIR excepted: P9 is out of scope), and the Company WebSocket delivered the findings broadcast.
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { ROOT, SERVICES, api, isUp, start, stop, waitForActors, type Service } from "./stack.js"

const args = process.argv.slice(2)
const flag = (f: string) => args.includes(f)
const COMPANY = args[args.indexOf("--company") + 1] && args.includes("--company") ? args[args.indexOf("--company") + 1]! : "ironline"
const DATA = "http://127.0.0.1:4000"
const INF = "http://127.0.0.1:4100"
const DAYS = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]
const IN_SCOPE = ["UNBILLED_DETENTION", "RATE_MISMATCH", "MISSING_POD", "UNINVOICED_LUMPER", "FUEL_CARD_MISMATCH", "DUPLICATE_RECEIPT", "AR_PAST_DUE", "MEDICAL_CARD_EXPIRING", "READY_TO_INVOICE"]

const truth = JSON.parse(readFileSync(join(ROOT, "data/fleet_demo/answer_key/ground_truth.json"), "utf8"))
const truthRef = new Map<string, string>(truth.loads.map((l: any) => [l.load_id, l.customer_reference]))
const failures: string[] = []
const check = (ok: boolean, msg: string) => {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`)
    if (!ok) failures.push(msg)
}
const step = (s: string) => console.log(`\n== ${s}`)

const started: Service[] = []
try {
    step(flag("--cold") ? "cold start" : "services")
    for (const s of ["actors", "data", "inference"] as Service[]) {
        if (flag("--cold")) await stop(s)
        if (await isUp(s)) console.log(`  reuse  ${s} :${SERVICES[s].port}`)
        else {
            const ms = await start(s)
            started.push(s)
            console.log(`  start  ${s} :${SERVICES[s].port} (${ms} ms)`)
        }
    }
    const health = await api.get(`${INF}/health`)
    check(health.openai === true, "inference server has an OpenAI key")

    step("seed (onboard company DB from history CSVs)")
    await waitForActors(COMPANY)
    const seed = await api.post(`${DATA}/api/companies/${COMPANY}/seed`, {})
    check(seed.status === 200, `seeded ${Object.values(seed.body.imported ?? {}).reduce((a: number, b: any) => a + b, 0)} rows into ${Object.keys(seed.body.imported ?? {}).length} tables (${seed.ms} ms)`)

    // Boundary 5: subscribe to the Company actor before anything happens.
    const grant = await api.post(`${DATA}/api/companies/${COMPANY}/socket`, {})
    const wsMessages: any[] = []
    const ws = new WebSocket(grant.body.websocketUrl)
    ws.onmessage = e => wsMessages.push(JSON.parse(String(e.data)))
    await new Promise<void>((res, rej) => ((ws.onopen = () => res()), (ws.onerror = () => rej(new Error("websocket failed")))))

    step("ingest 5 days through intake agent -> relay -> router -> actors")
    const ingested: any[] = []
    for (const day of DAYS) {
        const r = await api.post(`${INF}/api/companies/${COMPANY}/ingest-day`, { day, cache: true })
        const rows = Array.isArray(r.body) ? r.body : []
        ingested.push(...rows)
        const errs = rows.filter((x: any) => x.error)
        console.log(`  ${day}: ${rows.length} files, ${rows.filter((x: any) => x.cached).length} cached, ${errs.length} errors (${(r.ms / 1000).toFixed(1)} s)`)
        for (const e of errs) console.log(`         ! ${e.file}: ${e.error}`)
    }
    check(ingested.length === 47 && ingested.every(x => !x.error), `all 47 inbox files extracted and routed`)

    step("nightly check")
    const res = await api.post(`${DATA}/api/companies/${COMPANY}/check`, { asOf: truth.as_of })
    const snap = await api.get(`${DATA}/api/companies/${COMPANY}/snapshot`)
    const ourRef = new Map<string, string>(snap.loads.map((l: any) => [l.loadId, l.customerReference]))
    const refsOf = (ids: string[], m: Map<string, string>) => ids.map(i => (m.get(i) ?? i).replace(/\s+/g, "").toUpperCase()).sort()

    step("grade against answer key")
    const findings: any[] = res.body.findings ?? []
    const planted = truth.planted_issues.filter((p: any) => IN_SCOPE.includes(p.type))
    for (const p of planted) {
        const hits = findings.filter(f => f.type === p.type)
        const f = hits[0]
        const amountOk = p.amount == null || (f && Math.abs((f.amount ?? 0) - p.amount) < 0.01)
        const loadOk = !p.load || (f && refsOf(f.loadIds, ourRef).includes(refsOf([p.load], truthRef)[0]!))
        check(hits.length === 1 && !!amountOk && !!loadOk, `${p.id} ${p.type}${p.amount != null ? ` $${p.amount}` : ""}${f ? ` -> got ${hits.length}x, $${f.amount}${loadOk ? "" : ` on ${f.loadIds}`}` : " -> missing"}`)
    }
    const p12 = findings.find(f => f.type === "READY_TO_INVOICE")
    check(!!p12 && JSON.stringify(refsOf(p12.loadIds, ourRef)) === JSON.stringify(refsOf(["IRN-1853", "IRN-1855", "IRN-1857", "IRN-1858"], truthRef)), "P12 is exactly the 4 right loads")
    const extra = findings.filter(f => !planted.some((p: any) => p.type === f.type))
    check(extra.length === 0, `no findings outside the answer key${extra.length ? `: ${extra.map(f => f.title).join(" | ")}` : ""}`)
    const unmatched = (snap.unmatched as any[]).filter(u => u.kind !== "dvir")
    check(unmatched.length === 0, `zero unmatched paperwork${unmatched.length ? `: ${unmatched.map(u => `${u.file} (${u.kind})`).join(", ")}` : ""}`)
    check(!!res.body.briefing?.text, `briefing delivered over relay (${res.ms} ms for check + briefing)`)

    step("boundary: Company WebSocket")
    await new Promise(r => setTimeout(r, 1500))
    check(wsMessages.some(m => m.type === "state"), "received initial state on connect")
    check(wsMessages.some(m => m.type === "findings" && m.findings?.length === findings.length), "received findings broadcast after check")
    check(wsMessages.some(m => m.type === "load"), `received live load updates during ingest (${wsMessages.filter(m => m.type === "load").length})`)
    ws.close()

    step("trace one file end to end")
    const sample = ingested.find(x => String(x.file).endsWith("IMG_20261026_113032.jpg")) ?? ingested.find(x => x.kind === "bol")
    if (sample?.traceId) {
        const lines = readFileSync(join(ROOT, "data/cache/traffic.jsonl"), "utf8").trim().split("\n").map(l => JSON.parse(l)).filter(l => l.traceId === sample.traceId)
        for (const l of lines) console.log(`  ${l.service.padEnd(9)} ${l.method} ${l.path} -> ${l.status} (${l.ms} ms)`)
        const inFinding = findings.filter(f => f.evidence.some((e: string) => e.endsWith(String(sample.file).split("/").pop()!)))
        console.log(`  ${sample.file} [${sample.kind}] trace ${sample.traceId} -> load ${sample.routed?.[0]?.loadIds?.join(",") || "-"} -> ${inFinding.length ? inFinding.map(f => f.type).join(", ") : "(no finding cites it)"}`)
        check(lines.some(l => l.service === "data"), "trace id reached the data server")
    }

    console.log(`\n${failures.length ? `FAILED (${failures.length})` : "ALL PASS"}  total at risk $${res.body.totalAtRisk}`)
} catch (e) {
    failures.push(String(e))
    console.error("\nERROR", e)
} finally {
    if (!flag("--keep")) for (const s of started.reverse()) await stop(s)
}
process.exit(failures.length ? 1 : 0)

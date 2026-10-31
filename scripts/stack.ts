// Process control for the backend stack: Terse runtime (:7100), data server (:4000), inference server (:4100).
// Used by smoke.ts and rehearse.ts. Processes run detached, logging to data/cache/logs/<name>.log.
import { spawnSync } from "node:child_process"
import { closeSync, mkdirSync, openSync } from "node:fs"
import { join } from "node:path"

export const ROOT = join(import.meta.dir, "..")
const LOGS = join(ROOT, "data/cache/logs")

export const SERVICES = {
    actors: { port: 7100, cwd: "apps/data", cmd: ["bunx", "durable-actors", "dev"], ready: "http://127.0.0.1:7100/" },
    data: { port: 4000, cwd: "apps/data", cmd: ["bun", "src/server.ts"], ready: "http://127.0.0.1:4000/health" },
    inference: { port: 4100, cwd: "apps/inference", cmd: ["bun", "src/server.ts"], ready: "http://127.0.0.1:4100/health" }
} as const
export type Service = keyof typeof SERVICES

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function isUp(s: Service): Promise<boolean> {
    try {
        await fetch(SERVICES[s].ready, { signal: AbortSignal.timeout(1000) })
        return true // any HTTP answer means the port is serving
    } catch {
        return false
    }
}

export async function stop(s: Service): Promise<void> {
    spawnSync("fuser", ["-k", "-TERM", `${SERVICES[s].port}/tcp`], { stdio: "ignore" })
    for (let i = 0; i < 40 && (await isUp(s)); i++) await sleep(250)
    if (await isUp(s)) spawnSync("fuser", ["-k", "-KILL", `${SERVICES[s].port}/tcp`], { stdio: "ignore" })
}

export async function start(s: Service, env: Record<string, string> = {}, timeoutMs = 120_000): Promise<number> {
    if (await isUp(s)) throw new Error(`${s} already running on :${SERVICES[s].port}`)
    mkdirSync(LOGS, { recursive: true })
    const log = openSync(join(LOGS, `${s}.log`), "a")
    const p = Bun.spawn([...SERVICES[s].cmd], {
        cwd: join(ROOT, SERVICES[s].cwd),
        env: { ...process.env, ...env },
        stdout: log,
        stderr: log,
        stdin: "ignore"
    })
    p.unref()
    closeSync(log)
    const t = Date.now()
    while (Date.now() - t < timeoutMs) {
        if (await isUp(s)) return Date.now() - t
        if (p.exitCode !== null) throw new Error(`${s} exited (${p.exitCode}); see data/cache/logs/${s}.log`)
        await sleep(300)
    }
    throw new Error(`${s} not ready after ${timeoutMs}ms; see data/cache/logs/${s}.log`)
}

/** The data server answers /health before the actor runtime is serving actors; wait for a real actor call. */
export async function waitForActors(companyId: string, timeoutMs = 60_000) {
    const t = Date.now()
    while (Date.now() - t < timeoutMs) {
        const r = await fetch(`http://127.0.0.1:4000/api/companies/${companyId}/snapshot`).catch(() => null)
        if (r?.ok) return Date.now() - t
        await sleep(500)
    }
    throw new Error("actors not serving via data server")
}

export const api = {
    async post<T = any>(url: string, body: unknown = {}, timeoutMs = 600_000): Promise<{ status: number; body: T; ms: number }> {
        const t = performance.now()
        const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) })
        return { status: r.status, body: (await r.json()) as T, ms: Math.round(performance.now() - t) }
    },
    async get<T = any>(url: string): Promise<T> {
        return (await (await fetch(url, { signal: AbortSignal.timeout(30_000) })).json()) as T
    }
}

// Data server: HTTP front for the Terse actors. Owns state and deterministic checks; no LLM calls here.
import express from "express"
import { join } from "node:path"

import type { ExtractedDoc, RelayMessage } from "./shared/index.js"

import { Company, Load } from "./actors.js"
import { loadActorId, routeDoc } from "./router.js"
import { seedCompany } from "./seed.js"
import { BriefingSchema, ExtractedDocSchema, trafficLog, violation } from "./contracts.js"
import { actors } from "../generated/index.js"

const app = express()
app.use(express.json({ limit: "20mb" }))
app.use(trafficLog("data"))
app.use((_req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*").set("Access-Control-Allow-Headers", "content-type")
    next()
})
app.options(/.*/, (_req, res) => void res.sendStatus(204))

const PORT = Number(process.env.DATA_PORT ?? 4000)
const HUB = process.env.RELAY_HUB_URL ?? "http://127.0.0.1:4100"
const DATASET = process.env.DATASET_DIR ?? join(import.meta.dir, "../../../data/fleet_demo")

const wrap = (fn: (req: express.Request, res: express.Response) => Promise<unknown>) => (req: express.Request, res: express.Response) =>
    fn(req, res).catch(err => {
        console.error(err)
        res.status(500).json({ error: String(err?.message ?? err) })
    })

async function publish(topic: RelayMessage["topic"], to: string, payload: unknown, traceId?: string) {
    try {
        const r = await fetch(`${HUB}/relay/publish`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ topic, from: "data-server", to, payload, traceId }),
            // Briefer (20s) + EIA (5s) + margin. If the hub is down or slow, /check still returns findings.
            signal: AbortSignal.timeout(Number(process.env.HUB_TIMEOUT_MS ?? 40_000))
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

app.get("/health", (_req, res) => void res.json({ ok: true, service: "data" }))

app.post("/api/companies/:c/seed", wrap(async (req, res) => {
    const dir = req.body?.historyDir ?? join(DATASET, "history")
    res.json(await seedCompany(String(req.params.c), dir, req.body?.name ?? "Ironline Freight LLC"))
}))

app.get("/api/companies/:c/snapshot", wrap(async (req, res) => void res.json(await Company.get(String(req.params.c)).snapshot())))

app.get("/api/companies/:c/open-loads", wrap(async (req, res) => void res.json(await Company.get(String(req.params.c)).listOpenLoads())))

app.get("/api/companies/:c/loads/:id", wrap(async (req, res) => void res.json(await Load.get(loadActorId(String(req.params.c), String(req.params.id))).get())))

/** Relay delivery endpoint: the Intake agent posts `doc.extracted` here. */
app.post("/api/companies/:c/docs", wrap(async (req, res) => {
    const docs: ExtractedDoc[] = Array.isArray(req.body) ? req.body : [req.body]
    for (const d of docs) {
        const bad = violation(ExtractedDocSchema, d)
        if (bad) return void res.status(400).json({ error: `doc.extracted contract: ${(d as { file?: string })?.file ?? "?"}: ${bad}` })
    }
    const results = []
    for (const d of docs) {
        const r = await routeDoc(String(req.params.c), d)
        results.push(r)
        void publish("load.updated", "ui", r, req.get("x-trace-id"))
    }
    res.json(results)
}))

/** "Run tonight's check" — runs the audit now, then asks the Briefer (via relay) for the owner's text. */
app.post("/api/companies/:c/check", wrap(async (req, res) => {
    const companyId = String(req.params.c)
    const asOf: string = req.body?.asOf ?? new Date().toISOString().slice(0, 10)
    const company = Company.get(companyId)
    const result = await company.runCheck(asOf)
    const snap = await company.snapshot()
    const reply = await publish("findings.ready", "briefer", { companyId, asOf, ...result, unmatched: snap.unmatched })
    let briefing = reply?.delivery?.briefing ?? null
    const bad = briefing && violation(BriefingSchema, briefing)
    if (bad) {
        console.warn(`briefing.ready contract violated, ignoring: ${bad}`)
        briefing = null
    }
    if (briefing) await company.setBriefing(briefing)
    res.json({ ...result, briefing: briefing ?? null })
}))

app.post("/api/companies/:c/schedule", wrap(async (req, res) => {
    const at = await Company.get(String(req.params.c)).scheduleCheck(req.body?.atMs)
    res.json({ nextCheckAt: new Date(at).toISOString() })
}))

app.post("/api/companies/:c/reset", wrap(async (req, res) => {
    await Company.get(String(req.params.c)).resetLive()
    res.json({ ok: true })
}))

/** WebSocket grants for the UI: live company feed and per-load timelines. */
app.post("/api/companies/:c/socket", wrap(async (req, res) => {
    res.set("Cache-Control", "no-store").json(await actors.Company.prepareWebsocket({ actorId: String(req.params.c), metadata: null }))
}))
app.post("/api/companies/:c/loads/:id/socket", wrap(async (req, res) => {
    res.set("Cache-Control", "no-store").json(
        await actors.Load.prepareWebsocket({ actorId: loadActorId(String(req.params.c), String(req.params.id)), metadata: null })
    )
}))

app.listen(PORT, "127.0.0.1", () => console.log(`data server: http://127.0.0.1:${PORT}`))

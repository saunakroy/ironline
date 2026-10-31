// Inference server: the agents (Intake, Enrichment, Briefer) + the relay hub they talk over.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { basename, join, relative } from "node:path"

import express from "express"
import multer from "multer"

import { trafficLog } from "@fleet/data/contracts"
import type { ExtractedDoc } from "@fleet/data/shared"

import { impliedFscPerMile, weeklyDiesel } from "./eia.js"
import { extractFile, type OpenLoadHint } from "./extract.js"
import { RelayHub } from "./relay.js"
import { AgentRelayTransport } from "./agent-relay-transport.js"
import { registerAgents } from "./agents.js"
import { envelopeSchema, validateSender } from "./relay-protocol.js"

const PORT = Number(process.env.INFERENCE_PORT ?? 4100)
const DATA = process.env.DATA_URL ?? "http://127.0.0.1:4000"
const ROOT = join(import.meta.dir, "../../..")
const DATASET = process.env.DATASET_DIR ?? join(ROOT, "data/fleet_demo")
const CACHE_DIR = join(ROOT, "data/cache/extractions")

const mode = process.env.RELAY_TRANSPORT ?? "local"
if (!["local", "agent-relay"].includes(mode)) throw new Error("RELAY_TRANSPORT must be local or agent-relay")
const hub = new RelayHub(mode === "agent-relay" ? new AgentRelayTransport() : undefined)

// ---------- agents subscribed on the relay ----------

registerAgents(hub, DATA)
await hub.start()

// ---------- intake ----------

/** Rate cons and tenders first (they create loads), then paperwork, then texts/notes (need loads to attach to). */
function phase(file: string) {
    const f = basename(file).toLowerCase()
    if (f.startsWith("ratecon") || f.startsWith("email_tender") || f.endsWith(".eml")) return 0
    if (f.endsWith(".txt")) return 2
    return 1
}

async function openLoads(companyId: string): Promise<OpenLoadHint[]> {
    try {
        return await (await fetch(`${DATA}/api/companies/${companyId}/open-loads`)).json()
    } catch {
        return []
    }
}

async function intakeOne(companyId: string, path: string, displayName: string, useCache: boolean, asOf?: string) {
    const traceId = randomUUID()
    const cacheFile = join(CACHE_DIR, displayName.replace(/[\/\\]/g, "__") + ".json")
    let doc: ExtractedDoc | null = null
    if (useCache) doc = await readFile(cacheFile, "utf8").then(JSON.parse).catch(() => null)
    const cached = !!doc
    if (!doc) {
        await hub.log("intake-agent", "openai", { reading: displayName }, traceId)
        doc = await extractFile(path, { displayName, openLoads: phase(displayName) > 0 ? await openLoads(companyId) : [], asOf })
        await mkdir(CACHE_DIR, { recursive: true })
        await writeFile(cacheFile, JSON.stringify(doc, null, 1))
    }
    const { delivery } = await hub.publish({ topic: "doc.extracted", from: "intake-agent", to: `company:${companyId}`, traceId, payload: { companyId, doc, cached } })
    return { file: displayName, kind: doc.kind, cached, traceId, routed: delivery }
}

async function intakeMany(companyId: string, files: { path: string; name: string }[], useCache: boolean, asOf?: string) {
    const results: unknown[] = []
    for (const p of [0, 1, 2]) {
        const batch = files.filter(f => phase(f.name) === p)
        // Small concurrency inside a phase; phases stay ordered.
        for (let i = 0; i < batch.length; i += 4) {
            const chunk = await Promise.all(
                batch.slice(i, i + 4).map(f =>
                    intakeOne(companyId, f.path, f.name, useCache, asOf).catch(e => ({ file: f.name, error: String(e?.message ?? e) }))
                )
            )
            results.push(...chunk)
            // A failed prerequisite must not let later phases run against an incomplete load set.
            if (chunk.some(result => "error" in result)) return results
        }
    }
    return results
}

// ---------- http ----------

const app = express()
app.use(express.json({ limit: "20mb" }))
app.use(trafficLog("inference"))
app.use((_req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*").set("Access-Control-Allow-Headers", "content-type")
    next()
})
app.options(/.*/, (_req, res) => void res.sendStatus(204))
const upload = multer({ dest: join(tmpdir(), "fleet-uploads"), limits: { fileSize: 25 * 1024 * 1024 } })

const wrap = (fn: (req: express.Request, res: express.Response) => Promise<unknown>) => (req: express.Request, res: express.Response) =>
    fn(req, res).catch(err => {
        console.error(err)
        res.status(500).json({ error: String(err?.message ?? err) })
    })

app.get("/health", (_req, res) => void res.json({ ok: true, service: "inference", openai: !!process.env.OPENAI_API_KEY, relay: mode }))

/** Drop zone: multipart field "files". ?cache=1 reuses earlier extractions of the same file name. */
app.post("/api/companies/:c/ingest", upload.array("files", 100), wrap(async (req, res) => {
    const files = ((req.files as Express.Multer.File[]) ?? []).map(f => ({ path: f.path, name: f.originalname }))
    res.json(await intakeMany(String(req.params.c), files, req.query.cache === "1", req.body?.asOf))
}))

/** Pre-run / replay a day folder from the dataset: { day: "2026-10-26", cache: true }. */
app.post("/api/companies/:c/ingest-day", wrap(async (req, res) => {
    const dir = join(DATASET, "inbox", String(req.body.day))
    const files = (await readdir(dir)).map(f => ({ path: join(dir, f), name: relative(DATASET, join(dir, f)) }))
    res.json(await intakeMany(String(req.params.c), files, req.body.cache !== false, req.body.day))
}))

/** Relay hub: other servers publish here (data server -> findings.ready). */
app.post("/relay/publish", wrap(async (req, res) => {
    const parsed = envelopeSchema.omit({ id: true, at: true }).extend({ id: envelopeSchema.shape.id.optional() }).parse(req.body)
    validateSender({ ...parsed, id: parsed.id ?? "pending", at: "" })
    const published = hub.publish(parsed)
    if (req.body.wait === false) {
        // Actor alarms must return before the data-side briefing callback can enter the Company actor.
        void published.catch(() => console.warn("Background relay delivery failed; check transport journal."))
        res.status(202).json({ accepted: true })
    } else res.json(await published)
}))
/** Live tracker page for the relay feed: incoming files, which agent is doing what, raw messages. */
app.get("/tracker", (_req, res) => void res.sendFile(join(import.meta.dir, "tracker.html")))
app.get("/relay/recent", (_req, res) => void res.json(hub.recent()))
/** Live agent-message feed for the UI (Server-Sent Events). */
app.get("/relay/feed", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" }).flushHeaders()
    for (const m of hub.recent(50)) res.write(`data: ${JSON.stringify(m)}\n\n`)
    const off = hub.subscribe(m => res.write(`data: ${JSON.stringify(m)}\n\n`))
    req.on("close", off)
})

app.get("/api/enrich/diesel", wrap(async (_req, res) => {
    const diesel = await weeklyDiesel()
    res.json({ diesel, impliedFscPerMile: impliedFscPerMile(diesel.pricePerGallon) })
}))

const server = app.listen(PORT, "127.0.0.1", () => console.log(`inference server: http://127.0.0.1:${PORT} (${mode})`))
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, async () => {
    server.close()
    await hub.close()
    process.exit(0)
})

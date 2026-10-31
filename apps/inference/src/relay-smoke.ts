// Uses a NEW fictional company. Never resets the user's existing Ironline data.
import { truthDocs } from "../../data/test/replay-truth.js"
import { loadGroundTruth } from "../../data/test/fixture.js"

const data = process.env.DATA_URL ?? "http://127.0.0.1:4000"
const inference = process.env.RELAY_HUB_URL ?? "http://127.0.0.1:4100"
const companyId = `relay-smoke-${crypto.randomUUID().slice(0, 8)}`
async function post(base: string, path: string, payload: unknown) {
    const r = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`)
    return r.json()
}
const health = await (await fetch(`${inference}/health`)).json() as { relay: string }
if (health.relay !== "agent-relay") throw new Error("Smoke test requires RELAY_TRANSPORT=agent-relay")
await post(data, `/api/companies/${companyId}/seed`, { name: "Relay integration test" })
let count = 0
for (const doc of truthDocs()) {
    const r = await post(inference, "/relay/publish", { topic: "doc.extracted", from: "intake-agent", to: `company:${companyId}`,
        payload: { companyId, doc, cached: true } }) as { delivery: { matchedBy: string }[] }
    if (!Array.isArray(r.delivery) || r.delivery.some(row => row.matchedBy === "unmatched")) throw new Error(`Document not routed: ${doc.file}`)
    if (++count % 10 === 0) console.log(`Routed ${count} documents through Relay`)
}
const result = await post(data, `/api/companies/${companyId}/check`, { asOf: loadGroundTruth().as_of }) as { briefing: unknown; findings: unknown[] }
if (!result.briefing) throw new Error("Check returned no briefing")
const snapshot = await (await fetch(`${data}/api/companies/${companyId}/snapshot`)).json() as { briefing: unknown }
if (!snapshot.briefing) throw new Error("Briefing was not persisted")
console.log(`PASS: ${count} documents, ${result.findings.length} findings, persisted briefing. Company: ${companyId}`)

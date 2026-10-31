import type { Briefing, ExtractedDoc, Finding } from "@fleet/data/shared"
import { z } from "zod"
import { writeBriefing } from "./briefer.js"
import { weeklyDiesel, impliedFscPerMile } from "./eia.js"
import type { RelayHub } from "./relay.js"

const companyIdSchema = z.string().regex(/^[a-zA-Z0-9._-]+$/)
export const findingsSchema = z.object({ companyId: companyIdSchema, asOf: z.string(),
    findings: z.array(z.object({ id: z.string(), type: z.string(), severity: z.string(), loadIds: z.array(z.string()),
        title: z.string(), detail: z.string(), amount: z.number().nullable(), evidence: z.array(z.string()) })),
    totalAtRisk: z.number(), unmatched: z.array(z.object({ file: z.string() })).optional() })

export function registerAgents(hub: RelayHub, dataUrl: string, services = { weeklyDiesel, writeBriefing }) {
    async function post(path: string, body: unknown) {
        const response = await fetch(`${dataUrl}${path}`, { method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) })
        if (!response.ok) throw new Error(`Data server returned ${response.status}`)
        return response.json()
    }
    hub.on("doc.extracted", async msg => {
        const p = msg.payload as { companyId: string; doc: ExtractedDoc }
        const companyId = companyIdSchema.parse(p.companyId)
        if (!p.doc?.file || !p.doc.kind) throw new Error("Missing extracted document")
        return post(`/api/companies/${companyId}/docs`, p.doc)
    })
    hub.on("enrichment.requested", async msg => {
        const prior = hub.message(`${msg.id}:enrichment`)
        const diesel = prior ? (prior.payload as { diesel: Awaited<ReturnType<typeof weeklyDiesel>> }).diesel : await services.weeklyDiesel()
        const payload = { diesel, impliedFscPerMile: impliedFscPerMile(diesel.pricePerGallon) }
        await hub.publish({ id: `${msg.id}:enrichment`, topic: "enrichment", from: "enrichment-agent", to: "briefer", payload })
        return payload
    })
    hub.on("findings.ready", async msg => {
        const p = findingsSchema.parse(msg.payload) as { companyId: string; asOf: string; findings: Finding[]; totalAtRisk: number; unmatched?: { file: string }[] }
        const { delivery } = await hub.publish({ id: `${msg.id}:enrich`, topic: "enrichment.requested", from: "briefer", to: "enrichment-agent",
            payload: { companyId: p.companyId, asOf: p.asOf } })
        const { diesel } = delivery as { diesel: Awaited<ReturnType<typeof weeklyDiesel>> }
        const prior = hub.message(`${msg.id}:briefing`)
        const briefing = prior ? prior.payload as Briefing : await services.writeBriefing({ ...p, diesel })
        await hub.publish({ id: `${msg.id}:briefing`, topic: "briefing.ready", from: "briefer", to: `owner:${p.companyId}`,
            payload: briefing, inReplyTo: msg.id })
        return { briefing }
    })
    hub.on("briefing.ready", async msg => {
        const companyId = companyIdSchema.parse(msg.to.replace(/^owner:/, ""))
        return post(`/api/companies/${companyId}/briefing`, msg.payload as Briefing)
    })
}

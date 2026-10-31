import { z } from "zod"
import type { RelayMessage } from "@fleet/data/shared"
import type { Role } from "./relay-config.js"

export const CHANNEL: Record<RelayMessage["topic"], string> = {
    "doc.extracted": "fleet-intake", "findings.ready": "fleet-findings", "briefing.ready": "fleet-findings",
    "enrichment.requested": "fleet-enrichment", enrichment: "fleet-enrichment", "load.updated": "fleet-activity", log: "fleet-activity"
}
export const envelopeSchema = z.object({
    id: z.string().min(1), at: z.string(),
    topic: z.enum(["doc.extracted", "load.updated", "findings.ready", "briefing.ready", "enrichment.requested", "enrichment", "log"]),
    from: z.string(), to: z.string(), payload: z.unknown(), inReplyTo: z.string().optional()
})

export function senderRole(from: string): Role {
    if (from.startsWith("company:")) return "data-server"
    if (["intake-agent", "data-server", "enrichment-agent", "briefer"].includes(from)) return from as Role
    throw new Error("Unknown Relay sender")
}
export function receiverRole(message: RelayMessage): Role {
    switch (message.topic) {
        case "doc.extracted": case "briefing.ready": case "load.updated": case "log": return "data-server"
        case "findings.ready": case "enrichment": return "briefer"
        case "enrichment.requested": return "enrichment-agent"
    }
}
export function validateSender(message: RelayMessage) {
    const expected: Partial<Record<RelayMessage["topic"], Role>> = {
        "doc.extracted": "intake-agent", "load.updated": "data-server", "findings.ready": "data-server",
        "enrichment.requested": "briefer", enrichment: "enrichment-agent", "briefing.ready": "briefer"
    }
    if (expected[message.topic] && senderRole(message.from) !== expected[message.topic]) throw new Error("Sender cannot publish this topic")
}
export function summarize(message: RelayMessage): string {
    const p = message.payload as Record<string, any>
    if (message.topic === "doc.extracted") return `${p.doc.kind}: ${p.doc.file}`
    if (message.topic === "findings.ready") return `${p.findings.length} findings, $${p.totalAtRisk} at risk (${p.asOf})`
    if (message.topic === "briefing.ready") return String(p.text)
    if (message.topic === "enrichment") return `EIA diesel: $${p.diesel.pricePerGallon}/gal (${p.diesel.period})`
    return `${message.topic} from ${message.from}`
}

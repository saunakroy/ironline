// Runtime contracts for every backend boundary. Each receiving side validates what it gets, so a bad payload
// fails loudly at the boundary instead of becoming a wrong finding. Not imported by actors (keeps the actor bundle small).
import { appendFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"

import { z } from "zod"

const ts = z.string().nullable().optional()
const stop = z.object({ name: ts, cityStateZip: ts, appointment: ts, checkIn: ts, checkOut: ts }).nullable()

export const ExtractedDocSchema = z.object({
    file: z.string().min(1),
    kind: z.enum(["rate_confirmation", "load_tender", "bol", "pod", "fuel_receipt", "lumper_receipt", "dvir", "invoice_draft", "driver_texts", "owner_notes", "unknown"]),
    reference: z.string().nullable(),
    bolNumber: z.string().nullable(),
    billToName: z.string().nullable(),
    rate: z.object({
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        detentionFreeMinutes: z.number().nullable(),
        detentionRatePerHour: z.number().nullable(),
        lumperReimbursable: z.boolean()
    }).nullable(),
    loadedMiles: z.number().nullable(),
    pickup: stop,
    delivery: stop,
    pallets: z.number().nullable(),
    seal: z.string().nullable(),
    podException: z.string().nullable(),
    fuel: z.object({
        receiptNo: z.string(), card: z.string(), unitEntered: z.string(), datetime: z.string(), city: z.string(),
        state: z.string(), station: z.string(), gallons: z.number(), total: z.number(), odometer: z.number().nullable()
    }).nullable(),
    lumperAmount: z.number().nullable(),
    invoice: z.object({
        invoiceNo: z.string(), billToName: z.string().nullable(), linehaul: z.number(), fuelSurcharge: z.number(),
        accessorials: z.array(z.object({ type: z.string(), amount: z.number() })), total: z.number()
    }).nullable(),
    events: z.array(z.object({
        type: z.enum(["delivered", "assignment", "lumper_paid", "fuel", "issue", "other"]),
        at: z.string(), driverName: z.string().nullable(), loadReference: z.string().nullable(), detail: z.string()
    }))
})

const FindingSchema = z.object({
    id: z.string(), type: z.string(), severity: z.string(), loadIds: z.array(z.string()), title: z.string(),
    detail: z.string(), amount: z.number().nullable(), evidence: z.array(z.string())
})

export const FindingsReadySchema = z.object({
    companyId: z.string(), asOf: z.string(), findings: z.array(FindingSchema), totalAtRisk: z.number(),
    unmatched: z.array(z.object({ file: z.string() }).passthrough()).optional()
})

export const BriefingSchema = z.object({
    asOf: z.string(), text: z.string().min(1), totalAtRisk: z.number(), findings: z.array(FindingSchema), generatedAt: z.string()
})

/** Returns a 400-ready error string, or null when valid. */
export function violation(schema: z.ZodTypeAny, value: unknown): string | null {
    const r = schema.safeParse(value)
    return r.success ? null : r.error.issues.slice(0, 5).map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")
}

// ---------- traffic log: the raw record of every hop, one JSON line per request ----------
const TRAFFIC = process.env.TRAFFIC_LOG ?? join(import.meta.dir, "../../../data/cache/traffic.jsonl")
mkdirSync(dirname(TRAFFIC), { recursive: true })

type Req = { method: string; originalUrl: string; get(h: string): string | undefined; body?: unknown }
type Res = { statusCode: number; on(e: "finish", f: () => void): void }

export function trafficLog(service: string) {
    return (req: Req, res: Res, next: () => void) => {
        const t = performance.now()
        res.on("finish", () => {
            if (req.originalUrl.startsWith("/relay/feed") || req.originalUrl === "/health") return
            const body = req.body as Record<string, unknown> | undefined
            appendFileSync(
                TRAFFIC,
                JSON.stringify({
                    at: new Date().toISOString(),
                    service,
                    method: req.method,
                    path: req.originalUrl,
                    status: res.statusCode,
                    ms: Math.round(performance.now() - t),
                    traceId: req.get("x-trace-id") ?? (body && typeof body === "object" ? body.traceId : undefined) ?? null,
                    topic: body && typeof body === "object" ? body.topic ?? body.kind ?? null : null
                }) + "\n"
            )
        })
        next()
    }
}

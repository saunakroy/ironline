// Intake agent: one file in -> one ExtractedDoc out. The LLM reads; it never decides money.
import { readFile } from "node:fs/promises"
import { basename, extname } from "node:path"

import { openai } from "@ai-sdk/openai"
import { generateObject, type UserContent } from "ai"
import mammoth from "mammoth"
import { z } from "zod"

import type { ExtractedDoc } from "@fleet/data/shared"

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini"
const TIMEOUT_MS = Number(process.env.EXTRACT_TIMEOUT_MS ?? 90_000)

const n = <T extends z.ZodTypeAny>(t: T) => t.nullable()
const ts = n(z.string()).describe('Local time "YYYY-MM-DD HH:MM", or null')
const stop = n(z.object({ name: n(z.string()), cityStateZip: n(z.string()), appointment: ts, checkIn: ts, checkOut: ts }))

const Schema = z.object({
    kind: z.enum(["rate_confirmation", "load_tender", "bol", "pod", "fuel_receipt", "lumper_receipt", "dvir", "invoice_draft", "driver_texts", "owner_notes", "unknown"]),
    reference: n(z.string()).describe("Broker/shipper load reference: rate con #, PO, order #. Not the BOL number."),
    bolNumber: n(z.string()),
    billToName: n(z.string()).describe("Exactly as written on the document"),
    rate: n(z.object({
        linehaul: z.number(),
        fuelSurcharge: z.number().describe("Total FSC dollars for the load (per-mile x miles if only a per-mile rate is given)"),
        detentionFreeMinutes: n(z.number()),
        detentionRatePerHour: n(z.number()),
        lumperReimbursable: z.boolean()
    })),
    loadedMiles: n(z.number()),
    pickup: stop.describe("Shipper stop. For a BOL: the handwritten/stamped in and out times."),
    delivery: stop.describe("Receiver stop. For a POD: receiver in/out times."),
    pallets: n(z.number()).describe("For a POD: pallets actually received"),
    seal: n(z.string()),
    podException: n(z.string()).describe("Any OS&D note on the POD (short, damaged, refused), verbatim"),
    fuel: n(z.object({
        receiptNo: z.string(), card: z.string().describe("Fleet card id as printed, e.g. FC-7742"), unitEntered: z.string().describe("Unit/truck # keyed at the pump"),
        datetime: z.string(), city: z.string(), state: z.string(), station: z.string(), gallons: z.number(), total: z.number(), odometer: n(z.number())
    })),
    lumperAmount: n(z.number()),
    invoice: n(z.object({
        invoiceNo: z.string(), billToName: n(z.string()), linehaul: z.number(), fuelSurcharge: z.number(),
        accessorials: z.array(z.object({ type: z.string(), amount: z.number() })), total: z.number()
    })),
    events: z.array(z.object({
        type: z.enum(["delivered", "assignment", "lumper_paid", "fuel", "issue", "other"]),
        at: z.string(), driverName: n(z.string()),
        loadReference: n(z.string()).describe("Reference of the open load this message is about, chosen from OPEN LOADS; null if unsure"),
        detail: z.string()
    })).describe("Only for driver texts / owner notes; otherwise empty")
})

export type OpenLoadHint = { loadId: string; customerReference: string; billToName: string | null; lane: string; driverId: string | null }

const SYSTEM = `You are the intake clerk for a small trucking carrier. Read one document and fill the schema.
- Copy numbers exactly as printed; never compute, round or "fix" amounts. If a field is not on the document, use null.
- Phone photos may be skewed or handwritten; read handwritten in/out times carefully.
- A POD is a delivered BOL with receiver signature/stamp. Classify it as "pod", not "bol".
- For texts/notes, emit one event per relevant message. Tie each to an OPEN LOAD reference only when the lane, customer, driver or facility makes it clear.`

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf" }

export async function extractFile(path: string, opts: { displayName?: string; openLoads?: OpenLoadHint[]; drivers?: string[]; asOf?: string } = {}): Promise<ExtractedDoc> {
    const file = opts.displayName ?? basename(path)
    const ext = extname(path).toLowerCase()
    const context = [
        `FILE NAME: ${file}`,
        opts.asOf ? `TODAY: ${opts.asOf}` : "",
        opts.openLoads?.length ? `OPEN LOADS:\n${opts.openLoads.map(l => `- ref ${l.customerReference} | ${l.billToName ?? "?"} | ${l.lane} | driver ${l.driverId ?? "?"}`).join("\n")}` : "OPEN LOADS: none",
        opts.drivers?.length ? `DRIVERS: ${opts.drivers.join(", ")}` : ""
    ].filter(Boolean).join("\n")

    const content: UserContent = [{ type: "text", text: context }]
    const bytes = await readFile(path)
    if (ext === ".docx") content.push({ type: "text", text: (await mammoth.extractRawText({ buffer: bytes })).value })
    else if (MIME[ext]?.startsWith("image/")) content.push({ type: "image", image: bytes, mediaType: MIME[ext] })
    else if (ext === ".pdf") content.push({ type: "file", data: bytes, mediaType: "application/pdf", filename: file })
    else content.push({ type: "text", text: bytes.toString("utf8") })

    const { object } = await generateObject({
        model: openai(MODEL),
        schema: Schema,
        system: SYSTEM,
        messages: [{ role: "user", content }],
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS)
    })
    return { ...object, file } as ExtractedDoc
}

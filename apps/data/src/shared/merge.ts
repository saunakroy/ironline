// Pure merge of one extracted document into a load's record. Runs inside the Load actor.
import type { ExtractedDoc, LoadRecord, MessageEvent, Stop } from "./types.js"

export function emptyLoad(loadId: string, customerReference: string): LoadRecord {
    return { loadId, customerReference, lumperReceipts: [], invoiceDrafts: [], documents: [] }
}

const mergeStop = (a: Stop | null | undefined, b: Stop | null | undefined): Stop | null =>
    a || b ? { ...(a ?? {}), ...Object.fromEntries(Object.entries(b ?? {}).filter(([, v]) => v != null && v !== "")) } : null

/** Normalize a customer/broker reference so "PO 4410-88213", "po4410-88213" and "4410-88213" match. */
export function normRef(ref: string | null | undefined): string {
    return (ref ?? "").toUpperCase().replace(/^(PO|ORDER|REF|LOAD)\s*#?\s*/, "").replace(/[^A-Z0-9]/g, "")
}

export function mergeDoc(rec: LoadRecord, doc: ExtractedDoc, now: string): LoadRecord {
    const next: LoadRecord = {
        ...rec,
        documents: rec.documents.some(d => d.file === doc.file)
            ? rec.documents
            : [...rec.documents, { file: doc.file, kind: doc.kind, addedAt: now }]
    }
    if (doc.billToName && !next.billToName) next.billToName = doc.billToName
    if (doc.loadedMiles) next.loadedMiles = doc.loadedMiles

    switch (doc.kind) {
        case "rate_confirmation":
        case "load_tender":
            if (doc.rate) next.rate = { ...doc.rate, sourceFile: doc.file }
            next.pickup = mergeStop(next.pickup, doc.pickup)
            next.delivery = mergeStop(next.delivery, doc.delivery)
            break
        case "bol":
            next.bol = { bolNumber: doc.bolNumber, pallets: doc.pallets, seal: doc.seal }
            next.pickup = mergeStop(next.pickup, doc.pickup)
            break
        case "pod":
            next.pod = { received: true, pallets: doc.pallets, exception: doc.podException }
            next.delivery = mergeStop(next.delivery, doc.delivery)
            break
        case "lumper_receipt":
            if (doc.lumperAmount && !next.lumperReceipts.some(r => r.sourceFile === doc.file))
                next.lumperReceipts = [...next.lumperReceipts, { amount: doc.lumperAmount, at: doc.delivery?.checkOut ?? null, sourceFile: doc.file }]
            break
        case "invoice_draft":
            if (doc.invoice)
                next.invoiceDrafts = [
                    ...next.invoiceDrafts.filter(i => i.invoiceNo !== doc.invoice!.invoiceNo),
                    { ...doc.invoice, sourceFile: doc.file }
                ]
            break
    }
    return next
}

/** Apply message events (driver texts / owner notes) that the Intake agent attributed to this load. */
export function mergeEvents(rec: LoadRecord, events: MessageEvent[], file: string, driverId: string | null): LoadRecord {
    let next = rec
    for (const e of events) {
        if (e.type === "delivered" && !next.deliveryReported) next = { ...next, deliveryReported: { at: e.at, source: file } }
        if (e.type === "assignment" && driverId) next = { ...next, driverId }
    }
    if (!next.documents.some(d => d.file === file))
        next = { ...next, documents: [...next.documents, { file, kind: file.includes("notes") ? "owner_notes" : "driver_texts", addedAt: events[0]?.at ?? "" }] }
    return next
}

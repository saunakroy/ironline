// Replays ground-truth extractions through the real data server (actors + router + rules).
// Use: bun test/replay-truth.ts [companyId]   — also the on-stage fallback if live extraction fails.
import type { ExtractedDoc } from "../src/shared/index.js"

import { buildFixture, loadGroundTruth } from "./fixture.js"

const BASE = process.env.DATA_URL ?? "http://127.0.0.1:4000"
const company = process.argv[2] ?? "ironline"

const blank = (file: string, kind: ExtractedDoc["kind"]): ExtractedDoc => ({
    file, kind, reference: null, bolNumber: null, billToName: null, rate: null, loadedMiles: null, pickup: null,
    delivery: null, pallets: null, seal: null, podException: null, fuel: null, lumperAmount: null, invoice: null, events: []
})

export function truthDocs(): ExtractedDoc[] {
    const state = buildFixture()
    const gt = loadGroundTruth()
    const docs: ExtractedDoc[] = []
    const fileFor = (load: string, kind: string) => gt.documents.find(d => d.load === load && d.kind === kind)?.file ?? `${kind}:${load}`
    for (const l of state.loads) {
        const rateKind = l.billToId?.startsWith("BRK") ? "rate_confirmation" : "load_tender"
        docs.push({
            ...blank(fileFor(l.loadId, rateKind), rateKind),
            reference: l.customerReference,
            billToName: l.billToName ?? null,
            rate: { ...l.rate!, sourceFile: undefined } as ExtractedDoc["rate"],
            loadedMiles: l.loadedMiles ?? null,
            pickup: { appointment: l.pickup?.appointment },
            delivery: { appointment: l.delivery?.appointment }
        })
        docs.push({
            ...blank(fileFor(l.loadId, "bol"), "bol"),
            reference: l.customerReference,
            bolNumber: l.bol?.bolNumber ?? null,
            pallets: l.bol?.pallets ?? null,
            seal: l.bol?.seal ?? null,
            pickup: { checkIn: l.pickup?.checkIn, checkOut: l.pickup?.checkOut }
        })
        if (l.pod?.received)
            docs.push({
                ...blank(fileFor(l.loadId, "pod"), "pod"),
                bolNumber: l.bol?.bolNumber ?? null, // PODs are usually the signed BOL: match by BOL number
                podException: l.pod.exception ?? null,
                delivery: { checkIn: l.delivery?.checkIn, checkOut: l.delivery?.checkOut }
            })
        for (const r of l.lumperReceipts)
            docs.push({ ...blank(fileFor(l.loadId, "lumper_receipt"), "lumper_receipt"), reference: l.customerReference, lumperAmount: r.amount })
        for (const inv of l.invoiceDrafts)
            docs.push({ ...blank(inv.sourceFile!, "invoice_draft"), reference: l.customerReference, invoice: { ...inv, sourceFile: undefined } as ExtractedDoc["invoice"] })
        if (l.deliveryReported)
            docs.push({
                ...blank("inbox/2026-10-27/texts_2026-10-27.txt", "driver_texts"),
                events: [{ type: "delivered", at: l.deliveryReported.at, driverName: "Charles Miller", loadReference: l.customerReference, detail: "delivered blue valley KC. receiver signed" }]
            })
    }
    for (const r of state.fuelReceipts) {
        const { sourceFile, ...fuel } = r
        docs.push({ ...blank(sourceFile, "fuel_receipt"), fuel })
    }
    return docs
}

if (import.meta.main) {
    const post = (path: string, body: unknown) =>
        fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json())
    await post(`/api/companies/${company}/reset`, {})
    const routed = await post(`/api/companies/${company}/docs`, truthDocs())
    console.log(`routed ${routed.length} docs; unmatched: ${routed.filter((r: { loadIds: string[]; kind: string }) => !r.loadIds.length && r.kind !== "fuel_receipt").length}`)
    const result = await post(`/api/companies/${company}/check`, { asOf: loadGroundTruth().as_of })
    for (const f of result.findings) console.log(`${f.type.padEnd(22)} ${String(f.amount ?? "").padStart(10)}  ${f.title}`)
    console.log(`total at risk: ${result.totalAtRisk}`)
}

// Routes one extracted document to the right actors. Deterministic: no LLM here.
import type { ExtractedDoc, LoadRecord, MessageEvent } from "./shared/index.js"

import { Company, Load } from "./actors.js"

export const loadActorId = (companyId: string, loadId: string) => `${companyId}.${loadId}`

export type RouteResult = { file: string; kind: string; loadIds: string[]; matchedBy: string; note?: string }

export async function routeDoc(companyId: string, doc: ExtractedDoc): Promise<RouteResult> {
    const company = Company.get(companyId)

    if (doc.kind === "fuel_receipt" && doc.fuel) {
        await company.addFuelReceipt({ ...doc.fuel, sourceFile: doc.file })
        await company.recordDocument(doc.file, doc.kind, null, "fleet")
        return { file: doc.file, kind: doc.kind, loadIds: [], matchedBy: "fleet (fuel ledger)" }
    }

    if (doc.kind === "driver_texts" || doc.kind === "owner_notes") return routeMessages(companyId, doc)

    let loadId: string | null = null
    let created = false
    let matchedBy = "unmatched"
    if ((doc.kind === "rate_confirmation" || doc.kind === "load_tender") && doc.reference) {
        ;({ loadId, created } = await company.registerLoad(doc.reference, doc.pickup?.appointment ?? null))
        matchedBy = created ? "new load from " + doc.kind : "existing load (" + doc.kind + ")"
    } else {
        loadId = await company.matchLoad({ reference: doc.reference, bolNumber: doc.bolNumber })
        if (loadId) matchedBy = doc.reference ? "reference" : "bol number"
    }

    if (!loadId) {
        await company.recordDocument(doc.file, doc.kind, null, "unmatched")
        return { file: doc.file, kind: doc.kind, loadIds: [], matchedBy, note: "No load matched; listed in the briefing as unmatched." }
    }

    const ref = doc.reference ?? loadId
    const load = Load.get(loadActorId(companyId, loadId))
    if (created) await load.start(loadId, ref)
    else await load.init(loadId, ref)
    const record = await load.applyDoc(doc)
    await company.upsertLoad(record)
    await company.recordDocument(doc.file, doc.kind, loadId, matchedBy)
    return { file: doc.file, kind: doc.kind, loadIds: [loadId], matchedBy }
}

/** Texts/notes carry events for several loads; the Intake agent tagged each with a loadReference. */
async function routeMessages(companyId: string, doc: ExtractedDoc): Promise<RouteResult> {
    const company = Company.get(companyId)
    const byLoad = new Map<string, MessageEvent[]>()
    for (const e of doc.events) {
        if (!e.loadReference) continue
        const loadId = await company.matchLoad({ reference: e.loadReference })
        if (!loadId) continue
        byLoad.set(loadId, [...(byLoad.get(loadId) ?? []), e])
    }
    const touched: LoadRecord[] = []
    for (const [loadId, events] of byLoad) {
        const driver = await company.resolveDriver(events.find(e => e.driverName)?.driverName ?? null)
        const rec = await Load.get(loadActorId(companyId, loadId)).applyEvents(events, doc.file, driver)
        await company.upsertLoad(rec)
        touched.push(rec)
    }
    await company.recordDocument(doc.file, doc.kind, touched[0]?.loadId ?? null, touched.length ? "message events" : "unmatched")
    return {
        file: doc.file,
        kind: doc.kind,
        loadIds: touched.map(t => t.loadId),
        matchedBy: "message events",
        note: `${doc.events.length} events, ${doc.events.filter(e => !e.loadReference).length} not tied to a load`
    }
}

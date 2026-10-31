// Builds a FleetState from the dataset's ground truth (what a perfect Intake agent would extract)
// plus history/*.csv. Lets the rules be tested without any LLM in the loop.
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseCsv, type FleetState, type FuelReceipt, type LoadRecord } from "../src/shared/index.js"

export const DATASET = join(import.meta.dir, "../../../data/fleet_demo")
const csv = (name: string) => parseCsv(readFileSync(join(DATASET, "history", name), "utf8"))

type GTLoad = {
    load_id: string
    truck_id: string
    driver_id: string
    bill_to_id: string
    bill_to_name: string
    customer_reference: string
    bol_number: string
    seal: string
    origin: { appointment: string; check_in: string; check_out: string }
    destination: { appointment: string; check_in: string; check_out: string }
    pallets: number
    loaded_miles: number
    linehaul: number
    fuel_surcharge: number
    accessorials: { type: string; amount: number }[]
    pod_received: boolean
    pod_exception: string | null
}

export function loadGroundTruth() {
    return JSON.parse(readFileSync(join(DATASET, "answer_key/ground_truth.json"), "utf8")) as {
        as_of: string
        loads: GTLoad[]
        fuel_receipts: Record<string, string | number>[]
        documents: { day: string; file: string; kind: string; load: string | null; [k: string]: unknown }[]
        planted_issues: { id: string; type: string; load?: string; amount?: number }[]
    }
}

// Invoice drafts as written by the owner (from the two .docx files).
const DRAFTS: Record<string, { invoiceNo: string; billToName: string; linehaul: number; total: number; file: string }> = {
    "IRN-1856": { invoiceNo: "INV-3252", billToName: "Ridgeline Freight Logistics LLC", linehaul: 1380, total: 2015.25, file: "inbox/2026-10-27/INV-3252_Ridgeline_MPLS.docx" },
    "IRN-1852": { invoiceNo: "INV-3253", billToName: "Ridgeline Freight", linehaul: 1150, total: 1571.75, file: "inbox/2026-10-28/INV-3253_ridgeline.docx" }
}
// Driver texts that report a delivery without a POD photo.
const DELIVERY_TEXTS: Record<string, string> = { "IRN-1854": "2026-10-27 14:10" }

export function buildFixture(): FleetState {
    const gt = loadGroundTruth()
    const docsByLoad = new Map<string, LoadRecord["documents"]>()
    for (const d of gt.documents) {
        if (!d.load) continue
        const list = docsByLoad.get(d.load) ?? []
        list.push({ file: d.file, kind: d.kind as LoadRecord["documents"][number]["kind"], addedAt: d.day })
        docsByLoad.set(d.load, list)
    }

    const loads: LoadRecord[] = gt.loads.map(l => {
        const broker = l.bill_to_id.startsWith("BRK")
        const lumper = l.accessorials.find(a => a.type === "lumper")
        const draft = DRAFTS[l.load_id]
        return {
            loadId: l.load_id,
            customerReference: l.customer_reference,
            billToId: l.bill_to_id,
            billToName: l.bill_to_name,
            truckId: l.truck_id,
            driverId: l.driver_id,
            loadedMiles: l.loaded_miles,
            rate: {
                linehaul: l.linehaul,
                fuelSurcharge: l.fuel_surcharge,
                detentionFreeMinutes: 120,
                detentionRatePerHour: broker ? 65 : 60,
                lumperReimbursable: broker
            },
            pickup: { appointment: l.origin.appointment, checkIn: l.origin.check_in, checkOut: l.origin.check_out },
            delivery: { appointment: l.destination.appointment, checkIn: l.destination.check_in, checkOut: l.destination.check_out },
            bol: { bolNumber: l.bol_number, pallets: l.pallets, seal: l.seal },
            pod: l.pod_received ? { received: true, exception: l.pod_exception } : null,
            deliveryReported: DELIVERY_TEXTS[l.load_id] ? { at: DELIVERY_TEXTS[l.load_id]!, source: "driver texts" } : null,
            lumperReceipts: lumper ? [{ amount: lumper.amount, sourceFile: "lumper receipt" }] : [],
            invoiceDrafts: draft
                ? [{ invoiceNo: draft.invoiceNo, billToName: draft.billToName, linehaul: draft.linehaul, fuelSurcharge: l.fuel_surcharge, accessorials: [], total: draft.total, sourceFile: draft.file }]
                : [],
            documents: docsByLoad.get(l.load_id) ?? []
        }
    })

    const fuelReceipts: FuelReceipt[] = gt.fuel_receipts.map(r => ({
        receiptNo: String(r.receipt_no),
        card: String(r.card),
        unitEntered: String(r.unit_entered),
        datetime: String(r.datetime),
        city: String(r.city),
        state: String(r.state),
        station: String(r.station),
        gallons: Number(r.gallons),
        total: Number(r.total),
        odometer: Number(r.odometer),
        sourceFile: String(r.file)
    }))
    // The duplicate upload: same receipt photographed again the next day.
    for (const d of gt.documents) {
        if (d.kind === "fuel_receipt" && d.duplicate_of) {
            const orig = fuelReceipts.find(r => r.receiptNo === String(d.receipt_no))
            if (orig && orig.sourceFile !== d.file) fuelReceipts.push({ ...orig, sourceFile: d.file })
        }
    }

    const customers = new Map(csv("customers.csv").map(c => [c.customer_id!, c.customer_name!]))
    const invoices = csv("invoices.csv")
    return {
        asOf: gt.as_of,
        loads,
        fuelReceipts,
        openInvoices: invoices
            .filter(i => i.status === "Open")
            .map(i => ({
                invoiceId: i.invoice_id!,
                loadId: i.load_id!,
                customerId: i.customer_id!,
                customerName: customers.get(i.customer_id!) ?? i.customer_id!,
                invoiceDate: i.invoice_date!,
                dueDate: i.due_date!,
                amount: Number(i.amount)
            })),
        drivers: csv("drivers.csv").map(d => ({
            driverId: d.driver_id!,
            name: `${d.first_name} ${d.last_name}`,
            medicalCardExpiration: d.medical_card_expiration!,
            cdlExpiration: d.cdl_expiration!
        })),
        trucks: csv("trucks.csv").map(t => ({ truckId: t.truck_id!, fleetUnit: t.fleet_unit!, fuelCard: t.fuel_card! })),
        invoicedLoadIds: invoices.map(i => i.load_id!)
    }
}

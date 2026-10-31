// Deterministic audit rules. The LLM never does money math: it extracts fields, these rules decide.
import type { Finding, FleetState, FuelReceipt, LoadRecord } from "./types.js"

const round2 = (n: number) => Math.round(n * 100) / 100
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Parse "YYYY-MM-DD HH:MM" (or "YYYY-MM-DD") as a naive local timestamp, in minutes. */
export function toMinutes(ts: string): number {
    const [d, t = "00:00"] = ts.trim().split(/[ T]/)
    const [y, m, day] = d!.split("-").map(Number)
    const [hh, mm] = t.split(":").map(Number)
    return Date.UTC(y!, m! - 1, day!, hh!, mm!) / 60000
}
const daysBetween = (from: string, to: string) => Math.round((toMinutes(to) - toMinutes(from)) / 1440)

export function detentionOwed(load: LoadRecord): { amount: number; minutes: number; stop: string }[] {
    const free = load.rate?.detentionFreeMinutes
    const rate = load.rate?.detentionRatePerHour
    if (free == null || rate == null) return []
    const out: { amount: number; minutes: number; stop: string }[] = []
    for (const [name, stop] of [["pickup", load.pickup], ["delivery", load.delivery]] as const) {
        if (!stop?.checkIn || !stop.checkOut) continue
        // Clock starts at the later of check-in and appointment (arriving early doesn't earn detention).
        const start = Math.max(toMinutes(stop.checkIn), stop.appointment ? toMinutes(stop.appointment) : -Infinity)
        const billable = toMinutes(stop.checkOut) - start - free
        if (billable > 0) out.push({ stop: name, minutes: billable, amount: round2((billable / 60) * rate) })
    }
    return out
}

const draftHas = (load: LoadRecord, type: string) =>
    load.invoiceDrafts.some(d => d.accessorials.some(a => a.type.toLowerCase().includes(type)))

export function amountToInvoice(load: LoadRecord): number {
    if (!load.rate) return 0
    const detention = detentionOwed(load).reduce((s, d) => s + d.amount, 0)
    const lumper = load.rate.lumperReimbursable ? load.lumperReceipts.reduce((s, r) => s + r.amount, 0) : 0
    return round2(load.rate.linehaul + load.rate.fuelSurcharge + detention + lumper)
}

function loadRules(load: LoadRecord, state: FleetState): Finding[] {
    const f: Finding[] = []
    const ref = `${load.loadId} (${load.customerReference})`

    for (const d of detentionOwed(load)) {
        if (draftHas(load, "detention")) continue
        f.push({
            id: `UNBILLED_DETENTION:${load.loadId}:${d.stop}`,
            type: "UNBILLED_DETENTION",
            severity: "money",
            loadIds: [load.loadId],
            title: `Unbilled detention on ${ref}`,
            detail: `${d.minutes} billable min at ${d.stop} (${load.rate!.detentionFreeMinutes} min free, ${usd(load.rate!.detentionRatePerHour!)}/hr). ${load.invoiceDrafts.length ? `Invoice ${load.invoiceDrafts.map(i => i.invoiceNo).join(", ")} omits it.` : "Add it to the invoice."}`,
            amount: d.amount,
            evidence: docFiles(load, ["bol", "rate_confirmation", "load_tender", "invoice_draft"])
        })
    }

    if (load.rate) {
        for (const inv of load.invoiceDrafts) {
            const diff = round2(load.rate.linehaul + load.rate.fuelSurcharge - (inv.linehaul + inv.fuelSurcharge))
            if (Math.abs(diff) < 0.01) continue
            f.push({
                id: `RATE_MISMATCH:${inv.invoiceNo}`,
                type: "RATE_MISMATCH",
                severity: "money",
                loadIds: [load.loadId],
                title: `${inv.invoiceNo} ${diff > 0 ? "under" : "over"}-bills ${ref} by ${usd(Math.abs(diff))}`,
                detail: `Invoice line haul ${usd(inv.linehaul)} + FSC ${usd(inv.fuelSurcharge)} vs signed rate con ${usd(load.rate.linehaul)} + ${usd(load.rate.fuelSurcharge)}.`,
                amount: Math.abs(diff),
                evidence: [inv.sourceFile, load.rate.sourceFile].filter((x): x is string => !!x)
            })
        }
    }

    if (load.deliveryReported && !load.pod?.received) {
        f.push({
            id: `MISSING_POD:${load.loadId}`,
            type: "MISSING_POD",
            severity: "cash",
            loadIds: [load.loadId],
            title: `No POD for ${ref} — can't invoice`,
            detail: `Reported delivered ${load.deliveryReported.at} (${load.deliveryReported.source}) but no POD uploaded. ${usd(amountToInvoice(load))} is blocked.`,
            amount: amountToInvoice(load),
            evidence: [load.deliveryReported.source]
        })
    }

    const lumper = round2(load.lumperReceipts.reduce((s, r) => s + r.amount, 0))
    if (lumper > 0 && load.rate?.lumperReimbursable && !draftHas(load, "lumper")) {
        f.push({
            id: `UNINVOICED_LUMPER:${load.loadId}`,
            type: "UNINVOICED_LUMPER",
            severity: "money",
            loadIds: [load.loadId],
            title: `${usd(lumper)} lumper on ${ref} not billed`,
            detail: `Rate con reimburses lumper at cost with receipt. Invoice should total ${usd(amountToInvoice(load))}.`,
            amount: lumper,
            evidence: load.lumperReceipts.map(r => r.sourceFile).filter((x): x is string => !!x)
        })
    }
    void state
    return f
}

function docFiles(load: LoadRecord, kinds: string[]) {
    return load.documents.filter(d => kinds.includes(d.kind)).map(d => d.file)
}

function readyToInvoice(state: FleetState): Finding[] {
    const ready = state.loads.filter(
        l => l.pod?.received && l.rate && l.invoiceDrafts.length === 0 && !state.invoicedLoadIds.includes(l.loadId)
    )
    if (!ready.length) return []
    const total = round2(ready.reduce((s, l) => s + amountToInvoice(l), 0))
    return [
        {
            id: "READY_TO_INVOICE",
            type: "READY_TO_INVOICE",
            severity: "cash",
            loadIds: ready.map(l => l.loadId),
            title: `${ready.length} delivered loads with POD not invoiced (${usd(total)})`,
            detail: ready.map(l => `${l.loadId} ${l.customerReference} ${usd(amountToInvoice(l))}${l.pod?.exception ? ` — POD exception: ${l.pod.exception}` : ""}`).join("; "),
            amount: total,
            evidence: []
        }
    ]
}

function receiptKey(r: FuelReceipt) {
    return r.receiptNo ? `no:${r.receiptNo}` : `x:${r.station}|${r.datetime}|${r.total}`
}

function fuelRules(state: FleetState): Finding[] {
    const f: Finding[] = []
    const seen = new Map<string, FuelReceipt>()
    const unique: FuelReceipt[] = []
    for (const r of state.fuelReceipts) {
        const k = receiptKey(r)
        const first = seen.get(k)
        if (first) {
            f.push({
                id: `DUPLICATE_RECEIPT:${k}`,
                type: "DUPLICATE_RECEIPT",
                severity: "data",
                loadIds: [],
                title: `Fuel receipt #${r.receiptNo} uploaded twice (${usd(r.total)})`,
                detail: `${r.station}, ${r.city} ${r.state}, ${r.datetime}. Count it once for cost and IFTA.`,
                amount: r.total,
                evidence: [first.sourceFile, r.sourceFile]
            })
        } else {
            seen.set(k, r)
            unique.push(r)
        }
    }

    const truckByCard = new Map(state.trucks.map(t => [t.fuelCard, t]))
    for (const r of unique) {
        const owner = truckByCard.get(r.card)
        if (!owner || owner.fleetUnit === r.unitEntered) continue
        const priorByOwner = unique
            .filter(o => o !== r && o.card === r.card && o.unitEntered === owner.fleetUnit)
            .map(o => ({ o, gap: toMinutes(r.datetime) - toMinutes(o.datetime) }))
            .filter(x => x.gap > 0 && x.gap < 12 * 60)
            .sort((a, b) => a.gap - b.gap)[0]
        f.push({
            id: `FUEL_CARD_MISMATCH:${r.receiptNo}`,
            type: "FUEL_CARD_MISMATCH",
            severity: "fraud_or_error",
            loadIds: [],
            title: `${owner.truckId}'s card ${r.card} used with unit #${r.unitEntered} (${usd(r.total)})`,
            detail:
                `${r.station}, ${r.city} ${r.state} at ${r.datetime}.` +
                (priorByOwner
                    ? ` Same card was used by ${owner.truckId} in ${priorByOwner.o.city} ${priorByOwner.o.state} ${Math.round(priorByOwner.gap / 60)}h earlier.`
                    : "") +
                ` Reassign cost/IFTA to unit ${r.unitEntered} and check card custody.`,
            amount: r.total,
            evidence: [r.sourceFile, ...(priorByOwner ? [priorByOwner.o.sourceFile] : [])]
        })
    }
    return f
}

function arRules(state: FleetState): Finding[] {
    const pastDue = state.openInvoices
        .filter(i => i.dueDate < state.asOf)
        .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate))
    if (!pastDue.length) return []
    const oldest = [...pastDue].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]!
    const total = round2(pastDue.reduce((s, i) => s + i.amount, 0))
    return [
        {
            id: "AR_PAST_DUE",
            type: "AR_PAST_DUE",
            severity: "cash",
            loadIds: pastDue.map(i => i.loadId),
            title: `${pastDue.length} invoices past due (${usd(total)})`,
            detail:
                `Worst: ${oldest.invoiceId} ${oldest.customerName} ${usd(oldest.amount)}, invoiced ${oldest.invoiceDate}, ${daysBetween(oldest.dueDate, state.asOf)} days past due (${daysBetween(oldest.invoiceDate, state.asOf)} days since invoice). ` +
                pastDue.map(i => `${i.invoiceId} ${i.customerName} ${usd(i.amount)} (${daysBetween(i.dueDate, state.asOf)}d)`).join("; "),
            amount: total,
            evidence: pastDue.map(i => i.invoiceId)
        }
    ]
}

function complianceRules(state: FleetState, warningDays: number): Finding[] {
    return state.drivers
        .filter(d => d.medicalCardExpiration && daysBetween(state.asOf, d.medicalCardExpiration) <= warningDays)
        .map(d => ({
            id: `MEDICAL_CARD_EXPIRING:${d.driverId}`,
            type: "MEDICAL_CARD_EXPIRING" as const,
            severity: "compliance" as const,
            loadIds: [],
            title: `${d.name}'s DOT medical card expires ${d.medicalCardExpiration} (${daysBetween(state.asOf, d.medicalCardExpiration)} days)`,
            detail: "Schedule the physical before the card lapses — an expired card means the driver can't legally drive.",
            amount: null,
            evidence: [`drivers/${d.driverId}`]
        }))
}

const SEVERITY_ORDER = { money: 0, fraud_or_error: 1, cash: 2, data: 3, compliance: 4 } as const

export function runRules(state: FleetState, opts: { complianceWarningDays?: number } = {}): Finding[] {
    const findings = [
        ...state.loads.flatMap(l => loadRules(l, state)),
        ...fuelRules(state),
        ...readyToInvoice(state),
        ...arRules(state),
        ...complianceRules(state, opts.complianceWarningDays ?? 30)
    ]
    return findings.sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (b.amount ?? 0) - (a.amount ?? 0)
    )
}

/** Money the owner can still recover or unblock (excludes data-only and compliance findings). */
export function totalAtRisk(findings: Finding[]): number {
    return round2(
        findings
            .filter(f => f.severity === "money" || f.severity === "fraud_or_error" || f.type === "MISSING_POD")
            .reduce((s, f) => s + (f.amount ?? 0), 0)
    )
}

export { usd, round2 }

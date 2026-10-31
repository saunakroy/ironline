// Domain types shared by the data server (Terse actors) and the inference server (agents).
// Timestamps are local fleet time, "YYYY-MM-DD HH:MM". Dates are "YYYY-MM-DD".

export type Stop = {
    name?: string | null
    cityStateZip?: string | null
    appointment?: string | null
    checkIn?: string | null
    checkOut?: string | null
}

export type RateTerms = {
    linehaul: number
    fuelSurcharge: number
    detentionFreeMinutes: number | null
    detentionRatePerHour: number | null
    lumperReimbursable: boolean
    sourceFile?: string
}

export type InvoiceLine = { type: string; amount: number }

export type InvoiceDraft = {
    invoiceNo: string
    billToName: string | null
    linehaul: number
    fuelSurcharge: number
    accessorials: InvoiceLine[]
    total: number
    sourceFile?: string
}

export type LoadDocument = { file: string; kind: DocKind; addedAt: string }

export type LoadRecord = {
    loadId: string
    customerReference: string
    billToId?: string | null
    billToName?: string | null
    truckId?: string | null
    driverId?: string | null
    loadedMiles?: number | null
    rate?: RateTerms | null
    pickup?: Stop | null
    delivery?: Stop | null
    bol?: { bolNumber?: string | null; pallets?: number | null; seal?: string | null } | null
    pod?: { received: boolean; pallets?: number | null; exception?: string | null } | null
    deliveryReported?: { at: string; source: string } | null
    lumperReceipts: { amount: number; at?: string | null; sourceFile?: string }[]
    invoiceDrafts: InvoiceDraft[]
    documents: LoadDocument[]
}

export type FuelReceipt = {
    receiptNo: string
    card: string
    unitEntered: string
    datetime: string
    city: string
    state: string
    station: string
    gallons: number
    total: number
    odometer: number | null
    sourceFile: string
}

export type OpenInvoice = {
    invoiceId: string
    loadId: string
    customerId: string
    customerName: string
    invoiceDate: string
    dueDate: string
    amount: number
}

export type Driver = {
    driverId: string
    name: string
    medicalCardExpiration: string
    cdlExpiration: string
}

export type Truck = { truckId: string; fleetUnit: string; fuelCard: string }

export type FleetState = {
    asOf: string
    loads: LoadRecord[]
    fuelReceipts: FuelReceipt[]
    openInvoices: OpenInvoice[]
    drivers: Driver[]
    trucks: Truck[]
    /** Loads that already have an invoice in the books (history). */
    invoicedLoadIds: string[]
}

export type FindingType =
    | "UNBILLED_DETENTION"
    | "RATE_MISMATCH"
    | "MISSING_POD"
    | "UNINVOICED_LUMPER"
    | "FUEL_CARD_MISMATCH"
    | "DUPLICATE_RECEIPT"
    | "AR_PAST_DUE"
    | "MEDICAL_CARD_EXPIRING"
    | "READY_TO_INVOICE"

export type Severity = "money" | "cash" | "fraud_or_error" | "data" | "compliance"

export type Finding = {
    id: string
    type: FindingType
    severity: Severity
    loadIds: string[]
    title: string
    detail: string
    amount: number | null
    evidence: string[]
}

/** Per-company configuration, derived from that company's own paperwork at onboarding. */
export type CompanyProfile = {
    companyId: string
    name: string
    defaultDetentionFreeMinutes: number
    defaultDetentionRatePerHour: number
    complianceWarningDays: number
    /** Free-form fields a specific fleet tracks that the core schema doesn't. */
    customFields: Record<string, string>
}

export type DocKind =
    | "rate_confirmation"
    | "load_tender"
    | "bol"
    | "pod"
    | "fuel_receipt"
    | "lumper_receipt"
    | "dvir"
    | "invoice_draft"
    | "driver_texts"
    | "owner_notes"
    | "unknown"

/** Message events pulled out of driver texts / owner notes. */
export type MessageEvent = {
    type: "delivered" | "assignment" | "lumper_paid" | "fuel" | "issue" | "other"
    at: string
    driverName: string | null
    loadReference: string | null
    detail: string
}

/** What the Intake agent hands the data server for one file. Every field except kind/file is optional. */
export type ExtractedDoc = {
    file: string
    kind: DocKind
    reference: string | null
    bolNumber: string | null
    billToName: string | null
    rate: Omit<RateTerms, "sourceFile"> | null
    loadedMiles: number | null
    pickup: Stop | null
    delivery: Stop | null
    pallets: number | null
    seal: string | null
    podException: string | null
    fuel: Omit<FuelReceipt, "sourceFile"> | null
    lumperAmount: number | null
    invoice: Omit<InvoiceDraft, "sourceFile"> | null
    events: MessageEvent[]
}

export type Briefing = { asOf: string; text: string; totalAtRisk: number; findings: Finding[]; generatedAt: string }

/** Relay envelope used between the two servers (swap transport for Agent Relay). */
export type RelayMessage<T = unknown> = {
    id: string
    topic: "doc.extracted" | "load.updated" | "findings.ready" | "briefing.ready" | "enrichment" | "log"
    from: string
    to: string
    at: string
    /** Follows one uploaded file through intake -> routing -> findings. */
    traceId?: string
    payload: T
}

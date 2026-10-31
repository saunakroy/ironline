// Terse Durable Actors: the data server's source of truth.
//  - Company: one per fleet. Owns that fleet's SQLite (history + live loads + fuel), its profile,
//    and the nightly audit (alarm). Tables are created from the company's own CSV headers.
//  - Load: one per load, rate con -> payment. Holds the merged record and its documents; UI subscribes live.
import { Actor, Emittable, Persisted, type ActorContext, type ActorDatabase } from "durable-actors"

import {
    emptyLoad,
    mergeDoc,
    mergeEvents,
    normRef,
    runRules,
    totalAtRisk,
    type Briefing,
    type CompanyProfile,
    type ExtractedDoc,
    type Finding,
    type FleetState,
    type FuelReceipt,
    type LoadRecord,
    type MessageEvent
} from "./shared/index.js"

type Row = Record<string, string | number | null>
const IDENT = /^[a-z][a-z0-9_]{0,62}$/

const LIVE_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS live_loads (
        load_id TEXT PRIMARY KEY, ref_norm TEXT UNIQUE, customer_reference TEXT, bol_number TEXT,
        driver_id TEXT, truck_id TEXT, pickup_at TEXT, record TEXT NOT NULL, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS live_fuel_receipts (
        seq INTEGER PRIMARY KEY AUTOINCREMENT, receipt_no TEXT, card TEXT, unit_entered TEXT,
        datetime TEXT, source_file TEXT UNIQUE, record TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS live_documents (
        file TEXT PRIMARY KEY, kind TEXT, load_id TEXT, matched_by TEXT, added_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS findings_log (
        run_at TEXT, as_of TEXT, finding_id TEXT, type TEXT, amount REAL, record TEXT)`
]

export type OpenLoad = {
    loadId: string
    customerReference: string
    billToName: string | null
    lane: string
    driverId: string | null
    truckId: string | null
    pickupAppointment: string | null
}

export type CompanySnapshot = {
    profile: CompanyProfile | null
    tables: { name: string; rows: number }[]
    loads: LoadRecord[]
    unmatched: { file: string; kind: string; addedAt: string }[]
    findings: Finding[]
    briefing: Briefing | null
    lastCheckAt: string | null
    nextCheckAt: string | null
}

type CompanyOutgoing =
    | { type: "findings"; findings: Finding[]; totalAtRisk: number }
    | { type: "load"; load: LoadRecord }
    | { type: "briefing"; briefing: Briefing }

export class Company extends Actor<null, null, CompanyOutgoing> {
    @Persisted @Emittable profile: CompanyProfile | null = null
    @Persisted @Emittable findings: Finding[] = []
    @Persisted @Emittable briefing: Briefing | null = null
    @Persisted @Emittable lastCheckAt: string | null = null
    @Persisted private nextLoadSeq = 0
    @Persisted private pendingCheck: { id: string; payload: unknown } | null = null

    constructor(context: ActorContext) {
        super(context)
        for (const sql of LIVE_SCHEMA) this.db.exec(sql)
    }

    // ---------- onboarding: build this company's database from its own files ----------

    /** Create (if needed) and fill a table whose columns come from the company's own CSV header. */
    async importTable(table: string, rows: Row[], replace: boolean): Promise<number> {
        if (!IDENT.test(table) || table.startsWith("live_")) throw new Error(`bad table name ${table}`)
        if (!rows.length) return 0
        const cols = Object.keys(rows[0]!)
        for (const c of cols) if (!IDENT.test(c)) throw new Error(`bad column ${c}`)
        const name = `h_${table}`
        if (replace) this.db.exec(`DROP TABLE IF EXISTS ${name}`)
        this.db.exec(`CREATE TABLE IF NOT EXISTS ${name} (${cols.map(c => `${c}`).join(", ")})`)
        const sql = `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`
        await this.db.transaction(async () => {
            for (const r of rows) this.db.exec(sql, ...cols.map(c => coerce(r[c])))
        })
        return rows.length
    }

    async setProfile(profile: CompanyProfile): Promise<CompanyProfile> {
        this.profile = profile
        return profile
    }

    async listTables(): Promise<{ name: string; rows: number }[]> {
        const t = this.db.exec(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND substr(name, 1, 1) != '_' ORDER BY name"
        ) as { name: string }[]
        return t.map(({ name }) => ({ name, rows: Number((this.db.exec(`SELECT COUNT(*) AS n FROM ${name}`)[0] as { n: number }).n) }))
    }

    // ---------- live loads ----------

    /** Find or create the load for a rate con / tender reference. `created` means the load number is new (or reused after a reset). */
    async registerLoad(customerReference: string, pickupAppointment: string | null): Promise<{ loadId: string; created: boolean }> {
        const existing = this.db.exec("SELECT load_id FROM live_loads WHERE ref_norm = ?", normRef(customerReference))[0] as
            | { load_id: string }
            | undefined
        if (existing) return { loadId: existing.load_id, created: false }
        if (this.nextLoadSeq === 0) this.nextLoadSeq = maxHistoryLoadSeq(this.db) + 1
        const loadId = `IRN-${this.nextLoadSeq}`
        this.nextLoadSeq = this.nextLoadSeq + 1
        const rec = emptyLoad(loadId, customerReference)
        this.db.exec(
            "INSERT INTO live_loads (load_id, ref_norm, customer_reference, pickup_at, record, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            loadId,
            normRef(customerReference),
            customerReference,
            pickupAppointment,
            JSON.stringify(rec),
            new Date().toISOString()
        )
        return { loadId, created: true }
    }

    /** Deterministic matching: reference, then BOL number. Returns null when ambiguous (goes to "unmatched"). */
    async matchLoad(q: { reference?: string | null; bolNumber?: string | null }): Promise<string | null> {
        if (q.reference) {
            const r = this.db.exec("SELECT load_id FROM live_loads WHERE ref_norm = ?", normRef(q.reference))[0] as { load_id: string } | undefined
            if (r) return r.load_id
            const id = this.db.exec("SELECT load_id FROM live_loads WHERE load_id = ?", q.reference.trim().toUpperCase())[0] as { load_id: string } | undefined
            if (id) return id.load_id
        }
        if (q.bolNumber) {
            const r = this.db.exec("SELECT load_id FROM live_loads WHERE bol_number = ?", q.bolNumber.trim())[0] as { load_id: string } | undefined
            if (r) return r.load_id
        }
        return null
    }

    async listOpenLoads(): Promise<OpenLoad[]> {
        return liveLoads(this.db).map(l => ({
            loadId: l.loadId,
            customerReference: l.customerReference,
            billToName: l.billToName ?? null,
            lane: `${l.pickup?.cityStateZip ?? "?"} -> ${l.delivery?.cityStateZip ?? "?"}`,
            driverId: l.driverId ?? null,
            truckId: l.truckId ?? null,
            pickupAppointment: l.pickup?.appointment ?? null
        }))
    }

    async upsertLoad(record: LoadRecord): Promise<void> {
        this.db.exec(
            `UPDATE live_loads SET record = ?, bol_number = ?, driver_id = ?, truck_id = ?, pickup_at = COALESCE(?, pickup_at), updated_at = ? WHERE load_id = ?`,
            JSON.stringify(record),
            record.bol?.bolNumber ?? null,
            record.driverId ?? null,
            record.truckId ?? null,
            record.pickup?.appointment ?? null,
            new Date().toISOString(),
            record.loadId
        )
        this.broadcast({ type: "load", load: record })
    }

    async recordDocument(file: string, kind: string, loadId: string | null, matchedBy: string): Promise<void> {
        this.db.exec(
            "INSERT OR REPLACE INTO live_documents (file, kind, load_id, matched_by, added_at) VALUES (?, ?, ?, ?, ?)",
            file,
            kind,
            loadId,
            matchedBy,
            new Date().toISOString()
        )
    }

    async addFuelReceipt(r: FuelReceipt): Promise<void> {
        this.db.exec(
            "INSERT OR REPLACE INTO live_fuel_receipts (receipt_no, card, unit_entered, datetime, source_file, record) VALUES (?, ?, ?, ?, ?, ?)",
            r.receiptNo,
            r.card,
            r.unitEntered,
            r.datetime,
            r.sourceFile,
            JSON.stringify(r)
        )
    }

    /** Resolve a driver's first/last name (as written in texts) to driver id and assigned truck. */
    async resolveDriver(name: string | null): Promise<{ driverId: string; truckId: string | null } | null> {
        if (!name) return null
        try {
            const rows = this.db.exec("SELECT driver_id, first_name, last_name, assigned_truck FROM h_drivers") as Row[]
            const n = name.toLowerCase()
            const hit = rows.find(r => n.includes(String(r.first_name).toLowerCase()) && n.includes(String(r.last_name).toLowerCase()))
                ?? rows.find(r => n.split(/\s+/)[0] === String(r.first_name).toLowerCase())
            return hit ? { driverId: String(hit.driver_id), truckId: hit.assigned_truck ? String(hit.assigned_truck) : null } : null
        } catch {
            return null
        }
    }

    // ---------- the nightly audit ----------

    async runCheck(asOf: string): Promise<{ findings: Finding[]; totalAtRisk: number }> {
        const findings = runRules(fleetState(this.db, asOf), { complianceWarningDays: this.profile?.complianceWarningDays ?? 30 })
        const runAt = new Date().toISOString()
        for (const f of findings)
            this.db.exec(
                "INSERT INTO findings_log (run_at, as_of, finding_id, type, amount, record) VALUES (?, ?, ?, ?, ?, ?)",
                runAt,
                asOf,
                f.id,
                f.type,
                f.amount,
                JSON.stringify(f)
            )
        this.findings = findings
        this.lastCheckAt = runAt
        const total = totalAtRisk(findings)
        this.broadcast({ type: "findings", findings, totalAtRisk: total })
        return { findings, totalAtRisk: total }
    }

    async setBriefing(briefing: Briefing): Promise<void> {
        if (this.briefing && this.briefing.generatedAt >= briefing.generatedAt) return
        this.briefing = briefing
        this.broadcast({ type: "briefing", briefing })
    }

    /** Schedule the nightly check. `atMs` defaults to the next 02:00 server time; pass Date.now() to run now. */
    async scheduleCheck(atMs?: number): Promise<number> {
        const when = atMs ?? nextLocalHour(2)
        this.alarm.set(when)
        return when
    }

    async onAlarm(): Promise<void> {
        if (!this.pendingCheck) {
            const asOf = new Date().toISOString().slice(0, 10)
            const result = await this.runCheck(asOf)
            this.pendingCheck = { id: `check:${this.id}:${crypto.randomUUID()}`, payload: { companyId: this.id, asOf, ...result } }
        }
        const hub = process.env.RELAY_HUB_URL ?? "http://127.0.0.1:4100"
        try {
            const response = await fetch(`${hub}/relay/publish`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                signal: AbortSignal.timeout(10_000),
                body: JSON.stringify({
                    id: this.pendingCheck.id,
                    wait: false,
                    topic: "findings.ready",
                    from: `company:${this.id}`,
                    to: "briefer",
                    payload: this.pendingCheck.payload
                })
            })
            if (!response.ok) throw new Error("Relay unavailable")
            this.pendingCheck = null
            this.alarm.set(nextLocalHour(2))
        } catch {
            // Keep the same message ID and findings until the hub accepts them.
            this.alarm.set(Date.now() + 60_000)
        }
    }

    async snapshot(): Promise<CompanySnapshot> {
        const unmatched = this.db.exec("SELECT file, kind, added_at FROM live_documents WHERE load_id IS NULL ORDER BY added_at") as Row[]
        return {
            profile: this.profile,
            tables: await this.listTables(),
            loads: liveLoads(this.db),
            unmatched: unmatched.map(r => ({ file: String(r.file), kind: String(r.kind), addedAt: String(r.added_at) })),
            findings: this.findings,
            briefing: this.briefing,
            lastCheckAt: this.lastCheckAt,
            nextCheckAt: this.alarm.get() ? new Date(this.alarm.get()!).toISOString() : null
        }
    }

    /** Wipe live data (keeps history + profile) so the demo can be replayed. */
    async resetLive(): Promise<void> {
        for (const t of ["live_loads", "live_fuel_receipts", "live_documents", "findings_log"]) this.db.exec(`DELETE FROM ${t}`)
        this.findings = []
        this.briefing = null
        this.lastCheckAt = null
        this.nextLoadSeq = 0
        this.pendingCheck = null
    }

}

export class Load extends Actor<null, null, LoadRecord> {
    @Persisted @Emittable record: LoadRecord | null = null

    async init(loadId: string, customerReference: string): Promise<LoadRecord> {
        if (!this.record) this.record = emptyLoad(loadId, customerReference)
        return this.record
    }

    /** Start a brand-new load here, discarding anything left from a previous use of this load number. */
    async start(loadId: string, customerReference: string): Promise<LoadRecord> {
        this.record = emptyLoad(loadId, customerReference)
        return this.record
    }

    async applyDoc(doc: ExtractedDoc): Promise<LoadRecord> {
        if (!this.record) throw new Error(`load ${this.id} not initialized`)
        this.record = mergeDoc(this.record, doc, new Date().toISOString())
        this.broadcast(this.record)
        return this.record
    }

    async applyEvents(events: MessageEvent[], file: string, driver: { driverId: string; truckId: string | null } | null): Promise<LoadRecord> {
        if (!this.record) throw new Error(`load ${this.id} not initialized`)
        let next = mergeEvents(this.record, events, file, driver?.driverId ?? null)
        if (driver && events.some(e => e.type === "assignment" || e.type === "delivered") && !next.truckId)
            next = { ...next, driverId: next.driverId ?? driver.driverId, truckId: driver.truckId }
        this.record = next
        this.broadcast(this.record)
        return this.record
    }

    async get(): Promise<LoadRecord | null> {
        return this.record
    }
}

function maxHistoryLoadSeq(db: ActorDatabase): number {
        try {
            const r = db.exec("SELECT MAX(CAST(SUBSTR(load_id, 5) AS INTEGER)) AS n FROM h_loads")[0] as { n: number | null }
            return r?.n ?? 1000
        } catch {
            return 1000
        }
    }


function liveLoads(db: ActorDatabase): LoadRecord[] {
        return (db.exec("SELECT record FROM live_loads ORDER BY load_id") as { record: string }[]).map(r => JSON.parse(r.record))
    }

function fleetState(db: ActorDatabase, asOf: string): FleetState {
        const q = (sql: string) => {
            try {
                return db.exec(sql) as Row[]
            } catch {
                return [] // table not imported for this company
            }
        }
        const customers = new Map(q("SELECT customer_id, customer_name FROM h_customers").map(c => [String(c.customer_id), String(c.customer_name)]))
        return {
            asOf,
            loads: liveLoads(db),
            fuelReceipts: (db.exec("SELECT record FROM live_fuel_receipts ORDER BY seq") as { record: string }[]).map(r => JSON.parse(r.record)),
            openInvoices: q("SELECT * FROM h_invoices WHERE status = 'Open'").map(i => ({
                invoiceId: String(i.invoice_id),
                loadId: String(i.load_id),
                customerId: String(i.customer_id),
                customerName: customers.get(String(i.customer_id)) ?? String(i.customer_id),
                invoiceDate: String(i.invoice_date),
                dueDate: String(i.due_date),
                amount: Number(i.amount)
            })),
            drivers: q("SELECT * FROM h_drivers").map(d => ({
                driverId: String(d.driver_id),
                name: `${d.first_name} ${d.last_name}`,
                medicalCardExpiration: String(d.medical_card_expiration ?? ""),
                cdlExpiration: String(d.cdl_expiration ?? "")
            })),
            trucks: q("SELECT truck_id, fleet_unit, fuel_card FROM h_trucks").map(t => ({
                truckId: String(t.truck_id),
                fleetUnit: String(t.fleet_unit),
                fuelCard: String(t.fuel_card)
            })),
            invoicedLoadIds: q("SELECT load_id FROM h_invoices").map(i => String(i.load_id))
        }
    }

function coerce(v: string | number | null | undefined): string | number | null {
    if (v == null || v === "") return null
    if (typeof v === "number") return v
    return /^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v) ? Number(v) : v
}

function nextLocalHour(hour: number): number {
    const d = new Date()
    d.setHours(hour, 0, 0, 0)
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
    return d.getTime()
}

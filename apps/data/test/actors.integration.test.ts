// Integration: backend code -> Terse actor runtime (:7100). Exercises the same calls the data server makes.
// Skips when the runtime isn't running (start it with `bun run dev:actors`).
import { beforeAll, describe, expect, test } from "bun:test"

import { Company, Load } from "../src/actors.js"
import { loadActorId, routeDoc } from "../src/router.js"
import type { ExtractedDoc } from "../src/shared/index.js"

const RUNTIME = process.env.DURABLE_ACTORS_CONTROL_PLANE_URL ?? "http://127.0.0.1:7100"
const up = await fetch(RUNTIME, { signal: AbortSignal.timeout(1000) }).then(() => true, () => false)

// Fresh company per run so tests never see state from earlier runs.
const C = `it${Date.now().toString(36)}`

const doc = (file: string, kind: ExtractedDoc["kind"], extra: Partial<ExtractedDoc> = {}): ExtractedDoc => ({
    file, kind, reference: null, bolNumber: null, billToName: null, rate: null, loadedMiles: null, pickup: null,
    delivery: null, pallets: null, seal: null, podException: null, fuel: null, lumperAmount: null, invoice: null,
    events: [], ...extra
})

const rateCon = (ref: string, file = `RateCon_${ref}.pdf`) =>
    doc(file, "rate_confirmation", {
        reference: ref,
        billToName: "Ridgeline Freight Logistics LLC",
        rate: { linehaul: 1150, fuelSurcharge: 421.75, detentionFreeMinutes: 120, detentionRatePerHour: 65, lumperReimbursable: true },
        pickup: { appointment: "2026-10-26 07:30" }
    })

describe.skipIf(!up)("backend <-> Terse actors", () => {
    beforeAll(async () => {
        await Company.get(C).importTable("loads", [{ load_id: "IRN-1851", customer_reference: "X" }], true)
        await Company.get(C).importTable(
            "drivers",
            [{ driver_id: "D01", first_name: "William", last_name: "Martin", assigned_truck: "T101", medical_card_expiration: "2027-05-20", cdl_expiration: "2028-11-03" }],
            true
        )
    })

    test("importTable builds the company's table from its own headers", async () => {
        const tables = await Company.get(C).listTables()
        expect(tables).toContainEqual({ name: "h_drivers", rows: 1 })
        expect(tables).toContainEqual({ name: "h_loads", rows: 1 })
    })

    test("registerLoad numbers after history and is idempotent across reference formats", async () => {
        const a = await Company.get(C).registerLoad("PO 4410-88213", null)
        const b = await Company.get(C).registerLoad("4410-88213", null)
        expect(a).toEqual({ loadId: "IRN-1852", created: true })
        expect(b).toEqual({ loadId: "IRN-1852", created: false })
    })

    test("rate con -> BOL (by ref) -> POD (by BOL #) all land on one Load actor", async () => {
        const [r1] = [await routeDoc(C, rateCon("RFL-482317"))]
        const loadId = r1!.loadIds[0]!
        const bol = await routeDoc(C, doc("bol.jpg", "bol", { reference: "RFL-482317", bolNumber: "GLH-7718204", pickup: { checkIn: "2026-10-26 07:40", checkOut: "2026-10-26 12:10" } }))
        const pod = await routeDoc(C, doc("pod.jpg", "pod", { bolNumber: "GLH-7718204", delivery: { checkIn: "2026-10-27 05:35", checkOut: "2026-10-27 07:10" } }))
        expect(bol.loadIds).toEqual([loadId])
        expect(pod.loadIds).toEqual([loadId])

        const rec = await Load.get(loadActorId(C, loadId)).get()
        expect(rec?.customerReference).toBe("RFL-482317")
        expect(rec?.pod?.received).toBe(true)
        expect(rec?.pickup).toMatchObject({ appointment: "2026-10-26 07:30", checkIn: "2026-10-26 07:40", checkOut: "2026-10-26 12:10" })
        expect(rec?.documents.map(d => d.file).sort()).toEqual(["RateCon_RFL-482317.pdf", "bol.jpg", "pod.jpg"])

        // The Company's copy is kept in sync for audits and the snapshot.
        const snap = await Company.get(C).snapshot()
        expect(snap.loads.find(l => l.loadId === loadId)?.pod?.received).toBe(true)
    })

    test("unknown paperwork is recorded as unmatched, not guessed", async () => {
        const r = await routeDoc(C, doc("mystery.jpg", "bol", { reference: "NOPE-1" }))
        expect(r.loadIds).toEqual([])
        expect((await Company.get(C).snapshot()).unmatched.map(u => u.file)).toContain("mystery.jpg")
    })

    test("runCheck audits state that lives in the actors", async () => {
        const { findings } = await Company.get(C).runCheck("2026-10-30")
        const det = findings.find(f => f.type === "UNBILLED_DETENTION")
        expect(det?.amount).toBeCloseTo(162.5, 2)
        expect(findings.some(f => f.type === "READY_TO_INVOICE")).toBe(true)
    })

    test("after resetLive, a reused load number starts from a clean Load actor", async () => {
        // The RFL load from the earlier test has a POD and 3 documents in its Load actor.
        const stale = await Company.get(C).matchLoad({ reference: "RFL-482317" })
        expect(stale).not.toBeNull()

        await Company.get(C).resetLive()
        // Register loads until the stale load number is handed out again.
        let reused: string | undefined
        for (const ref of ["NEW-A", "NEW-B", "NEW-C"]) {
            const r = await routeDoc(C, rateCon(ref))
            if (r.loadIds[0] === stale) reused = ref
        }
        expect(reused).toBeDefined()

        const rec = await Load.get(loadActorId(C, stale!)).get()
        expect(rec?.customerReference).toBe(reused!)
        expect(rec?.pod ?? null).toBeNull()
        expect(rec?.documents.map(d => d.file)).toEqual([`RateCon_${reused}.pdf`])
    })
})

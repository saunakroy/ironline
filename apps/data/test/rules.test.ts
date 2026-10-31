// The answer key is the spec: given perfect extraction, the rules must find exactly the planted issues we demo.
import { describe, expect, test } from "bun:test"

import { runRules, type FindingType } from "../src/shared/index.js"

import { buildFixture, loadGroundTruth } from "./fixture.js"

const IN_SCOPE: FindingType[] = [
    "UNBILLED_DETENTION",
    "RATE_MISMATCH",
    "MISSING_POD",
    "UNINVOICED_LUMPER",
    "FUEL_CARD_MISMATCH",
    "DUPLICATE_RECEIPT",
    "AR_PAST_DUE",
    "MEDICAL_CARD_EXPIRING",
    "READY_TO_INVOICE"
]

const findings = runRules(buildFixture())
const planted = loadGroundTruth().planted_issues.filter(p => IN_SCOPE.includes(p.type as FindingType))

describe("answer key", () => {
    test("no findings outside the planted issues", () => {
        expect(findings.map(f => f.type).sort()).toEqual(planted.map(p => p.type as FindingType).sort())
    })

    for (const p of planted) {
        test(`${p.id} ${p.type}`, () => {
            const hit = findings.filter(f => f.type === p.type)
            expect(hit.length).toBe(1)
            const f = hit[0]!
            if (p.load) expect(f.loadIds).toContain(p.load)
            if (p.amount != null) expect(f.amount).toBeCloseTo(p.amount, 2)
        })
    }

    test("P10 lists the 8 past-due invoices, Summit Lane worst", () => {
        const ar = findings.find(f => f.type === "AR_PAST_DUE")!
        expect(ar.evidence.length).toBe(8)
        expect(ar.detail).toContain("INV-3214 Summit Lane")
        expect(ar.detail).toContain("41 days since invoice")
    })

    test("P12 ready-to-invoice loads and total", () => {
        const r = findings.find(f => f.type === "READY_TO_INVOICE")!
        expect(r.loadIds.sort()).toEqual(["IRN-1853", "IRN-1855", "IRN-1857", "IRN-1858"])
        expect(r.amount).toBeCloseTo(14192.68, 2)
    })

    test("P7 explains the impossible travel", () => {
        const f = findings.find(f => f.type === "FUEL_CARD_MISMATCH")!
        expect(f.detail).toContain("Amarillo")
        expect(f.detail).toContain("Kansas City")
    })
})

describe("live-extraction shapes", () => {
    test("fuel card printed masked on the receipt (****7742) still matches the truck's card FC-7742", () => {
        const state = buildFixture()
        state.fuelReceipts = state.fuelReceipts.map(r => ({ ...r, card: `*************${r.card.slice(-4)}` }))
        const f = runRules(state).filter(f => f.type === "FUEL_CARD_MISMATCH")
        expect(f.length).toBe(1)
        expect(f[0]!.amount).toBeCloseTo(800.73, 2)
    })
})

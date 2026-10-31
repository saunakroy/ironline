// Tenders quote $/mi; rate cons quote totals. The LLM copies what's printed; code does the multiplication.
import { describe, expect, test } from "bun:test"

import { rateTotals } from "../src/shared/index.js"

describe("rateTotals", () => {
    test("per-mile tender: $2.30/mi x 718 mi + $0.875/mi FSC", () => {
        expect(rateTotals({ linehaul: null, linehaulPerMile: 2.3, fuelSurcharge: null, fuelSurchargePerMile: 0.875 }, 718)).toEqual({ linehaul: 1651.4, fuelSurcharge: 628.25 })
    })
    test("flat rate con totals pass through unchanged", () => {
        expect(rateTotals({ linehaul: 1150, linehaulPerMile: null, fuelSurcharge: 421.75, fuelSurchargePerMile: null }, 482)).toEqual({ linehaul: 1150, fuelSurcharge: 421.75 })
    })
    test("per-mile with no miles cannot be priced", () => {
        expect(rateTotals({ linehaul: null, linehaulPerMile: 2.3, fuelSurcharge: null, fuelSurchargePerMile: 0.875 }, null)).toBeNull()
    })
})

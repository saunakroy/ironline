// Tenders quote $/mi; rate cons quote totals. The Intake agent copies whichever is printed; this does the math.
export type ExtractedRate = {
    linehaul: number | null
    linehaulPerMile: number | null
    fuelSurcharge: number | null
    fuelSurchargePerMile: number | null
}

const cents = (n: number) => Math.round(n * 100) / 100

/** Dollar totals for a load, or null when a per-mile rate can't be priced (no miles). */
export function rateTotals(r: ExtractedRate, miles: number | null): { linehaul: number; fuelSurcharge: number } | null {
    const pick = (total: number | null, perMile: number | null) =>
        total != null ? total : perMile != null && miles != null ? cents(perMile * miles) : null
    const linehaul = pick(r.linehaul, r.linehaulPerMile)
    const fuelSurcharge = pick(r.fuelSurcharge, r.fuelSurchargePerMile)
    return linehaul == null || fuelSurcharge == null ? null : { linehaul, fuelSurcharge }
}

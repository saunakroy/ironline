// Enrichment from the outside world: DOE/EIA weekly on-highway diesel, used to sanity-check fuel surcharges.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

const CACHE = join(import.meta.dir, "../../../data/cache/eia_diesel.json")
const SERIES = "EMD_EPD2D_PTE_NUS_DPG" // U.S. No 2 diesel retail, $/gal, weekly

export type DieselPrice = { period: string; pricePerGallon: number; source: "eia-live" | "eia-cache" | "fallback" }

export async function weeklyDiesel(): Promise<DieselPrice> {
    const key = process.env.EIA_API_KEY
    if (key) {
        try {
            const url =
                `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${encodeURIComponent(key)}` +
                `&frequency=weekly&data[0]=value&facets[series][]=${SERIES}&sort[0][column]=period&sort[0][direction]=desc&length=1`
            const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
            const row = (await r.json())?.response?.data?.[0]
            if (row) {
                const p: DieselPrice = { period: row.period, pricePerGallon: Number(row.value), source: "eia-live" }
                await mkdir(dirname(CACHE), { recursive: true })
                await writeFile(CACHE, JSON.stringify(p))
                return p
            }
        } catch {
            /* fall through to cache */
        }
    }
    try {
        return { ...(JSON.parse(await readFile(CACHE, "utf8")) as DieselPrice), source: "eia-cache" }
    } catch {
        return { period: "2026-10-26", pricePerGallon: 6.5, source: "fallback" }
    }
}

/** Typical DOE fuel-surcharge table: (diesel - base) / mpg. Base $1.25, 6 mpg -> $0.875/mi at $6.50. */
export function impliedFscPerMile(price: number, base = 1.25, mpg = 6) {
    return Math.max(0, Math.round(((price - base) / mpg) * 1000) / 1000)
}

// Onboarding: build a company's database from its own history CSVs and derive its profile.
import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"

import { parseCsv, type CompanyProfile } from "./shared/index.js"

import { Company } from "./actors.js"

const CHUNK = 1000

export async function seedCompany(companyId: string, historyDir: string, name: string) {
    const company = Company.get(companyId)
    const imported: Record<string, number> = {}
    for (const file of readdirSync(historyDir).filter(f => f.endsWith(".csv") && !f.startsWith("_"))) {
        const table = basename(file, ".csv").toLowerCase().replace(/[^a-z0-9_]/g, "_")
        const rows = parseCsv(readFileSync(join(historyDir, file), "utf8"))
        let n = 0
        for (let i = 0; i < rows.length; i += CHUNK) n += await company.importTable(table, rows.slice(i, i + CHUNK), i === 0)
        imported[table] = n
    }
    const profile: CompanyProfile = {
        companyId,
        name,
        // Fleet defaults; each rate con's own terms override these.
        defaultDetentionFreeMinutes: 120,
        defaultDetentionRatePerHour: 65,
        complianceWarningDays: 30,
        customFields: { tables: Object.keys(imported).join(",") }
    }
    await company.setProfile(profile)
    await company.resetLive()
    return { profile, imported }
}

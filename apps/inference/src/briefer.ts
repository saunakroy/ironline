// Briefer agent: turns deterministic findings into the owner's short morning text.
// The LLM writes prose only from the numbers it's given; the template fallback keeps the demo safe.
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

import { usd, type Briefing, type Finding } from "@fleet/data/shared"

import type { DieselPrice } from "./eia.js"

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini"

export function templateBriefing(findings: Finding[], totalAtRisk: number, diesel?: DieselPrice | null): string {
    const lines = findings.slice(0, 9).map(f => `• ${f.title}${f.amount != null && !f.title.includes("$") ? ` — ${usd(f.amount)}` : ""}`)
    const head = `Ironline nightly check: ${usd(totalAtRisk)} at risk.`
    const fuel = diesel ? `\nDiesel (DOE wk of ${diesel.period}): $${diesel.pricePerGallon.toFixed(3)}/gal.` : ""
    return [head, ...lines].join("\n") + fuel
}

export async function writeBriefing(input: {
    asOf: string
    findings: Finding[]
    totalAtRisk: number
    unmatched?: { file: string }[]
    diesel?: DieselPrice | null
}): Promise<Briefing> {
    const fallback = templateBriefing(input.findings, input.totalAtRisk, input.diesel)
    let text = fallback
    if (process.env.OPENAI_API_KEY && input.findings.length) {
        try {
            const r = await generateText({
                model: openai(MODEL),
                system:
                    "You write a nightly text message to the owner of a 4-truck fleet. Plain, direct, no fluff. " +
                    "Lead with total dollars at risk. Then one line per issue, biggest money first, each with the load # and the action to take today. " +
                    "Use ONLY numbers present in the findings JSON; never compute new amounts. Max ~900 characters.",
                prompt: JSON.stringify({ asOf: input.asOf, totalAtRisk: input.totalAtRisk, findings: input.findings, unmatchedDocs: input.unmatched ?? [], diesel: input.diesel ?? null }),
                abortSignal: AbortSignal.timeout(Number(process.env.BRIEFER_TIMEOUT_MS ?? 20_000))
            })
            if (r.text.trim()) text = r.text.trim()
        } catch (e) {
            console.warn("briefer LLM failed, using template:", (e as Error).message)
        }
    }
    return { asOf: input.asOf, text, totalAtRisk: input.totalAtRisk, findings: input.findings, generatedAt: new Date().toISOString() }
}

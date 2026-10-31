import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"

export const ROLES = ["intake-agent", "data-server", "enrichment-agent", "briefer"] as const
export type Role = typeof ROLES[number]
export const CHANNELS = ["fleet-intake", "fleet-findings", "fleet-enrichment", "fleet-activity"] as const
export const RELAY_DIR = join(import.meta.dir, "../../../data/cache/relay")
export const credentialPath = () => process.env.RELAY_CREDENTIALS_FILE ?? join(RELAY_DIR, "credentials.json")

export const credentialsSchema = z.object({
    workspaceKey: z.string().min(1),
    workspaceName: z.string(),
    baseUrl: z.string().url().optional(),
    tokens: z.record(z.enum(ROLES), z.string().min(1))
})
export type Credentials = z.infer<typeof credentialsSchema>

export async function readCredentials(): Promise<Credentials> {
    try { return credentialsSchema.parse(JSON.parse(await readFile(credentialPath(), "utf8"))) }
    catch { throw new Error("Relay credentials missing or incomplete. Run bun run --cwd apps/inference relay:setup first.") }
}

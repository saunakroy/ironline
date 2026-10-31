import { AgentRelay } from "@agent-relay/sdk"
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { CHANNELS, ROLES, credentialPath, type Role } from "./relay-config.js"

// Save incrementally: rerunning after a partial failure reconnects, never rotates existing tokens.
type Setup = { workspaceKey: string; workspaceName: string; baseUrl?: string; tokens: Partial<Record<Role, string>> }
const path = credentialPath()
await mkdir(dirname(path), { recursive: true })
async function save(config: Setup) {
    await writeFile(`${path}.tmp`, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 })
    await chmod(`${path}.tmp`, 0o600)
    await rename(`${path}.tmp`, path)
}

try {
    let config: Setup
    try { config = JSON.parse(await readFile(path, "utf8")) }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Existing Relay credential file cannot be read; refusing to overwrite it")
        const workspaceName = process.env.RELAY_WORKSPACE_NAME ?? `ironline-${crypto.randomUUID().slice(0, 8)}`
        const baseUrl = process.env.RELAY_BASE_URL
        const relay = await AgentRelay.createWorkspace({ name: workspaceName, baseUrl })
        config = { workspaceName, baseUrl, workspaceKey: relay.workspaceKey!, tokens: {} }
        await save(config)
    }
    const relay = new AgentRelay({ workspaceKey: config.workspaceKey, baseUrl: config.baseUrl })
    console.log(`Configuring workspace ${config.workspaceName}`)
    for (const name of ROLES) {
        if (!config.tokens[name]) {
            const client = await relay.workspace.register({ name, type: "agent" })
            config.tokens[name] = client.token!
            await save(config)
            console.log(`Registered ${name}`)
        }
    }
    // Participant reads use participant tokens, not the workspace administration credential.
    const workers = new AgentRelay({ agentToken: config.tokens["data-server"]!, baseUrl: config.baseUrl, retryPolicy: { maxRetries: 1 } })
    const admin = await workers.workspace.reconnect({ apiToken: config.tokens["data-server"]! })
    console.log("Checking channels")
    const existing = new Set((await admin.channels.list()).map(channel => channel.name))
    for (const name of CHANNELS) if (!existing.has(name)) {
        await admin.channels.create({ name, topic: `Ironline ${name.slice(6)}` })
        console.log(`Created ${name}`)
    }
    for (const name of ROLES) {
        const client = await workers.workspace.reconnect({ apiToken: config.tokens[name]! })
        if (client.name !== name) throw new Error("Stored token belongs to the wrong identity")
        for (const channel of CHANNELS) await client.channels.join(channel)
        console.log(`Connected ${name}`)
    }
    const envPath = join(import.meta.dir, "../.env")
    let env = await readFile(envPath, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error
        return ""
    })
    const settings: Record<string, string> = { RELAY_TRANSPORT: "agent-relay", RELAY_CREDENTIALS_FILE: path }
    for (const [name, value] of Object.entries(settings)) {
        const line = `${name}=${JSON.stringify(value)}`
        const pattern = new RegExp(`^${name}=.*$`, "m")
        env = pattern.test(env) ? env.replace(pattern, line) : `${env.trimEnd()}\n${line}\n`
    }
    await writeFile(envPath, env.trimStart(), { mode: 0o600 })
    await chmod(envPath, 0o600)
    console.log(`Relay ready: ${config.workspaceName}. Four identities and four channels configured.`)
    console.log("Credentials saved privately; inference .env now selects agent-relay.")
    await workers.events.disconnect()
} catch (error) {
    // Provider errors may contain credential-bearing URLs. Never dump the raw error.
    const details = error as { code?: string; statusCode?: number; message?: string }
    const safe = (details.message ?? "").replace(/https?:\/\/\S+/g, "[endpoint]").replace(/(?:rk|at|nt|ot)_live_[\w-]+/g, "[credential]")
    console.error(`Relay setup failed (${details.code ?? "request failed"}, HTTP ${details.statusCode ?? "unknown"}): ${safe}. Any completed setup is saved; rerun to resume.`)
    process.exitCode = 1
}

import { Database } from "bun:sqlite"
import { chmodSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import type { RelayMessage } from "@fleet/data/shared"

/** Transport journal only; business state remains in Terse. Keep this file across restarts. */
export class RelayStore {
    private db: Database
    constructor(path: string) {
        if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true })
        this.db = new Database(path)
        if (path !== ":memory:") chmodSync(path, 0o600)
        this.db.exec(`PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS outbound (id TEXT PRIMARY KEY, envelope TEXT NOT NULL, relay_id TEXT, completed INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS handled (id TEXT PRIMARY KEY, result TEXT NOT NULL);`)
    }
    enqueue(message: RelayMessage) {
        const old = this.db.query("SELECT envelope FROM outbound WHERE id = ?").get(message.id) as { envelope: string } | null
        if (old) {
            const previous = JSON.parse(old.envelope) as RelayMessage
            if (JSON.stringify({ ...previous, at: "" }) !== JSON.stringify({ ...message, at: "" }))
                throw new Error("Message ID reused for different content")
            return previous
        }
        this.db.query("INSERT INTO outbound (id, envelope) VALUES (?, ?)").run(message.id, JSON.stringify(message))
        return message
    }
    message(id: string): RelayMessage | undefined {
        const row = this.db.query("SELECT envelope FROM outbound WHERE id = ?").get(id) as { envelope: string } | null
        return row ? JSON.parse(row.envelope) : undefined
    }
    relayId(id: string): string | undefined {
        return (this.db.query("SELECT relay_id FROM outbound WHERE id = ?").get(id) as { relay_id: string | null } | null)?.relay_id ?? undefined
    }
    sent(id: string, relayId: string) { this.db.query("UPDATE outbound SET relay_id = ? WHERE id = ?").run(relayId, id) }
    complete(id: string) { this.db.query("UPDATE outbound SET completed = 1 WHERE id = ?").run(id) }
    completed(id: string): boolean {
        return (this.db.query("SELECT completed FROM outbound WHERE id = ?").get(id) as { completed: number } | null)?.completed === 1
    }
    result(id: string): { value: unknown } | undefined {
        const row = this.db.query("SELECT result FROM handled WHERE id = ?").get(id) as { result: string } | null
        return row ? { value: JSON.parse(row.result) } : undefined
    }
    handled(id: string, value: unknown) {
        this.db.query("INSERT OR REPLACE INTO handled (id, result) VALUES (?, ?)").run(id, JSON.stringify(value ?? null))
    }
    pending(): RelayMessage[] {
        return (this.db.query("SELECT envelope FROM outbound WHERE completed = 0 ORDER BY rowid").all() as { envelope: string }[])
            .map(row => JSON.parse(row.envelope))
    }
    close() { this.db.close() }
}

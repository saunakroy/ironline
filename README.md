# alpha — YC Haunted Hacks Fleet Agents

Back office for small trucking fleets. Drivers and the owner drop in whatever paperwork they have.
Agents turn it into structured records, check the documents against each other every night, and text
the owner about the money they're about to lose.

## Architecture: two servers

```
 UI ──upload──▶ INFERENCE SERVER :4100                      DATA SERVER :4000 ──▶ TERSE ACTORS :7100
               ├ Intake agent (OpenAI vision → ExtractedDoc)  ├ HTTP API              ├ Company (1 per fleet)
               ├ Enrichment agent (EIA weekly diesel)         ├ router: doc → actor   │   own SQLite: h_* history tables
               ├ Briefer agent (findings → owner text)        └ seed: CSVs → tables   │   built from the fleet's CSV headers,
               └ Relay hub ◀── every agent message ──▶                                │   live loads, fuel ledger, findings,
                     /relay/feed (SSE) for the UI                                      │   nightly alarm → runCheck
                                                                                       └ Load (1 per load, rate con → paid)
```

- **The LLM reads; code decides.** Extraction is the only LLM step that touches data. Every dollar amount
  comes from `apps/data/src/shared/rules.ts`, which is deterministic and tested against the answer key.
- **Relay topics:** `doc.extracted` (intake → company), `load.updated` (data → ui), `findings.ready`
  (company → briefer), `enrichment` (enrichment → briefer), `briefing.ready` (briefer → owner).
  The transport is local HTTP behind `Transport` in `apps/inference/src/relay.ts`. Swap in Agent Relay there.

## Run it

Needs Bun ≥ 1.4.2. Use three terminals:

```sh
bun install
bun run dev:actors          # Terse runtime on :7100 (wait for "Ready")
bun run dev:data            # data server on :4000
bun run dev:inference       # inference server on :4100 — put OPENAI_API_KEY in apps/inference/.env
```

Then:

```sh
curl -X POST localhost:4000/api/companies/ironline/seed -H 'content-type: application/json' -d '{}'   # ~15s, builds the DB
bun apps/data/test/replay-truth.ts   # FALLBACK: perfect extractions → actors → check → briefing (no LLM)
```

Live demo path:

```sh
# pre-run Mon–Thu (cached after first run, so re-running is instant)
for d in 2026-10-26 2026-10-27 2026-10-28 2026-10-29; do
  curl -X POST localhost:4100/api/companies/ironline/ingest-day -H 'content-type: application/json' -d "{\"day\":\"$d\"}"; done
# on stage: drop Friday's files in the UI (POST /ingest), then "Run tonight's check":
curl -X POST localhost:4000/api/companies/ironline/check -H 'content-type: application/json' -d '{"asOf":"2026-10-30"}'
```

`bun test` runs the rules against `data/fleet_demo/answer_key`. `bun run --cwd apps/inference extract <file>` prints a single extraction.

## API for the UI

| Method | URL | What |
|---|---|---|
| POST | `:4100/api/companies/:c/ingest` | multipart `files[]`, the drop zone. `?cache=1` reuses earlier extractions |
| POST | `:4100/api/companies/:c/ingest-day` | `{day, cache}` ingests one dataset inbox folder |
| GET | `:4100/relay/feed` | SSE stream of agent messages (the "agents talking" panel) |
| GET | `:4100/api/enrich/diesel` | EIA diesel price + implied FSC/mi |
| POST | `:4000/api/companies/:c/seed` | onboard: build the company DB from `history/*.csv` |
| GET | `:4000/api/companies/:c/snapshot` | profile, tables, loads, unmatched docs, findings, briefing |
| POST | `:4000/api/companies/:c/check` | `{asOf}` runs the nightly check now and returns findings + briefing |
| POST | `:4000/api/companies/:c/schedule` | `{atMs?}` sets the nightly alarm (default next 02:00) |
| POST | `:4000/api/companies/:c/reset` | clears live data, keeps history |
| POST | `:4000/api/companies/:c/socket` | Terse WebSocket grant: live `findings` / `load` / `briefing` messages |
| POST | `:4000/api/companies/:c/loads/:id/socket` | Terse WebSocket grant for one load's timeline |

Types for everything are in `apps/data/src/shared/types.ts`. The UI can import them from `@fleet/data/shared`.

## Agent communication network (Agent Relay)

Today every agent message goes through an in-process hub (`apps/inference/src/relay.ts`) with a local
transport. This section explains how to move that traffic onto **[Agent Relay](https://agentrelay.com/docs/typescript-sdk)**
(`@agent-relay/sdk`, v15), so every handoff becomes a durable, visible message between named agents.

> **Status:** not implemented yet. The code below is a guide written against the `@agent-relay/sdk@15.0.1`
> types, and it hasn't been run. The local transport keeps working until `RELAY_TRANSPORT=agent-relay` is set.

### 1. Participants

Each role registers as its own Agent Relay identity (`relay.workspace.register({ name, type: "agent" })`):

| Identity | Lives in | Role |
|---|---|---|
| `intake-agent` | inference server | Reads each uploaded file and posts `doc.extracted` |
| `data-server` | inference server (bridge) or data server | Receives `doc.extracted` and forwards it to `POST :4000/api/companies/:c/docs`. Posts `findings.ready` after a check. **Not inside Terse actors**: actors stay thin and talk HTTP |
| `enrichment-agent` | inference server | Pulls outside facts (EIA diesel today) and posts `enrichment` |
| `briefer` | inference server | Turns `findings.ready` into the owner's text and replies with `briefing.ready` |
| `owner-ui` *(optional)* | UI | Read-only observer of the channels, if the UI talks to Agent Relay directly instead of `/relay/feed` |

### 2. Channels: one per topic

| Channel | Topic(s) | Posted by | Joined by |
|---|---|---|---|
| `#fleet-intake` | `doc.extracted` | intake-agent | data-server |
| `#fleet-findings` | `findings.ready`, with `briefing.ready` as a **thread reply** | data-server, briefer | briefer, data-server |
| `#fleet-enrichment` | `enrichment` | enrichment-agent | briefer |
| `#fleet-activity` | `load.updated`, `log` | everyone | owner-ui |

Putting the briefing in the findings message's thread means judges can open one thread and watch:
findings → enrichment → briefing.

### 3. Message format

Keep the existing `RelayMessage` envelope (`apps/data/src/shared/types.ts`) so no payload changes:

- `text`: a one-line human summary (for example `INV-3252 under-bills IRN-1856 by $300.00 (+8 more)`), which is what people see in Agent Relay
- `metadata.fleet`: the full `RelayMessage` (`{id, topic, from, to, at, payload, inReplyTo?}`), which is what agents read
- `idempotencyKey`: `envelope.id`. For `doc.extracted`, use `doc:<companyId>:<file>` so retries never duplicate a doc

### 4. One-time setup

```sh
bun add --cwd apps/inference @agent-relay/sdk
```

```ts
// apps/inference/scripts/relay-setup.ts — run once, then copy the printed key into apps/inference/.env
import { AgentRelay } from "@agent-relay/sdk"

const relay = await AgentRelay.createWorkspace({ name: "fleet-agents" })
const admin = await relay.workspace.register({ name: "fleet-admin", type: "agent" })
for (const [name, topic] of [
    ["fleet-intake", "Extracted documents → data server"],
    ["fleet-findings", "Nightly findings; briefings reply in thread"],
    ["fleet-enrichment", "Outside data for the briefer"],
    ["fleet-activity", "Load updates and agent logs"]
]) await admin.channels.create({ name, topic })
console.log(`RELAY_WORKSPACE_KEY=${relay.workspaceKey}`)
```

Add the following to `apps/inference/.env`:

```
RELAY_TRANSPORT=agent-relay
RELAY_WORKSPACE_KEY=...
```

### 5. Implement the transport

`relay.ts` already isolates the transport behind `Transport.deliver(msg, handler)`. Two small changes make it fit a
real network:

1. Add `RelayHub.dispatch(msg)`. It runs the handler registered for `msg.topic` and records the message in the feed.
   Inbound Agent Relay messages call this, so `/relay/feed` keeps working for the UI.
2. Add `apps/inference/src/agent-relay-transport.ts`:

```ts
import { AgentRelay, type RelayAgentClient } from "@agent-relay/sdk"
import type { RelayMessage } from "@fleet/data/shared"
import type { RelayHub, Transport } from "./relay.js"

const CHANNEL: Record<RelayMessage["topic"], string> = {
    "doc.extracted": "fleet-intake", "findings.ready": "fleet-findings", "briefing.ready": "fleet-findings",
    enrichment: "fleet-enrichment", "load.updated": "fleet-activity", log: "fleet-activity"
}
const REQUEST_REPLY = new Set(["findings.ready"]) // /check waits for the briefing
type Envelope = RelayMessage & { inReplyTo?: string }

export class AgentRelayTransport implements Transport {
    private relay = new AgentRelay({ workspaceKey: process.env.RELAY_WORKSPACE_KEY! })
    private clients = new Map<string, RelayAgentClient>()
    private waiting = new Map<string, (v: unknown) => void>()
    private relayIds = new Map<string, string>() // envelope id -> Agent Relay messageId (for thread replies)

    async start(hub: RelayHub) {
        for (const name of ["intake-agent", "data-server", "enrichment-agent", "briefer"]) {
            const client = await this.relay.workspace.register({ name, type: "agent" })
            for (const ch of new Set(Object.values(CHANNEL))) await client.channels.join(ch)
            this.clients.set(name, client)
        }
        this.relay.addListener("message.created", async ({ message }) => this.inbound(hub, message))
        this.relay.addListener("thread.reply", async ({ message }) => this.inbound(hub, message))
    }

    private async inbound(hub: RelayHub, message: { messageId: string; metadata?: Record<string, unknown> }) {
        const env = message.metadata?.fleet as Envelope | undefined
        if (!env) return
        this.relayIds.set(env.id, message.messageId)
        if (env.inReplyTo && this.waiting.has(env.inReplyTo)) {   // a reply we are waiting for
            this.waiting.get(env.inReplyTo)!({ briefing: env.payload })
            this.waiting.delete(env.inReplyTo)
            return
        }
        const result = await hub.dispatch(env)                    // runs the hub.on(topic) handler
        if (REQUEST_REPLY.has(env.topic) && result) {             // briefer replies in-thread
            const briefing = (result as { briefing: unknown }).briefing
            await this.clients.get("briefer")!.reply({
                messageId: message.messageId,
                text: (briefing as { text: string }).text,
                metadata: { fleet: { ...env, id: crypto.randomUUID(), topic: "briefing.ready", from: "briefer", payload: briefing, inReplyTo: env.id } }
            })
        }
    }

    async deliver(msg: Envelope): Promise<unknown> {
        const sender = this.clients.get(msg.from) ?? this.clients.get("data-server")!
        const reply = REQUEST_REPLY.has(msg.topic)
            ? new Promise(resolve => {
                  this.waiting.set(msg.id, resolve)
                  setTimeout(() => this.waiting.delete(msg.id) && resolve(null), 30_000) // /check falls back to no briefing
              })
            : null
        await sender.sendMessage({
            to: `#${CHANNEL[msg.topic]}`,
            text: summarize(msg),
            idempotencyKey: msg.topic === "doc.extracted" ? `doc:${(msg.payload as any).companyId}:${(msg.payload as any).doc.file}` : msg.id,
            metadata: { fleet: msg }
        })
        return reply ?? { accepted: true }
    }
}

function summarize(m: RelayMessage): string {
    const p = m.payload as any
    if (m.topic === "doc.extracted") return `${p.doc.kind}: ${p.doc.file}${p.doc.reference ? ` (ref ${p.doc.reference})` : ""}`
    if (m.topic === "findings.ready") return `${p.findings.length} findings, $${p.totalAtRisk} at risk (${p.asOf})`
    return `${m.topic} from ${m.from}`
}
```

Wire it up in `apps/inference/src/server.ts`:

```ts
const transport = process.env.RELAY_TRANSPORT === "agent-relay" ? new AgentRelayTransport() : undefined
const hub = new RelayHub(transport)
if (transport) await transport.start(hub)
```

### 6. Rules the network must keep

1. **`findings.ready` is request/reply.** `POST :4000/.../check` expects `{delivery: {briefing}}` back from
   `/relay/publish`. The transport above does this by waiting for the Briefer's thread reply (`inReplyTo`) for up to 30 seconds.
2. **Keep `doc.extracted` ordered per company.** Rate cons must arrive before the BOL, POD and invoice for that load, or those
   docs end up unmatched. Intake already sends in phases. The `data-server` subscriber should forward one doc at a time per
   `companyId` (a simple per-company promise chain).
3. **Delivery is at-least-once, and that's safe.** Routing on the data server is idempotent by file name, and `idempotencyKey`
   stops duplicate sends. Don't add dedupe on the data side.
4. **Data server and actors stay LLM-free and SDK-free.** The Terse `Company` alarm still publishes through
   `POST :4100/relay/publish`, and the hub forwards it onto Agent Relay. Keep `RELAY_HUB_URL` pointing at the inference server.
5. **New agents join the network the same way:** register an identity, join channels, read `metadata.fleet`, and post with an
   envelope. Money math stays in `apps/data/src/shared/rules.ts`.

### 7. Check that it works

```sh
# terminals: dev:actors, dev:data, dev:inference (with RELAY_TRANSPORT=agent-relay)
curl -X POST localhost:4000/api/companies/ironline/seed -H 'content-type: application/json' -d '{}'
for d in 2026-10-26 2026-10-27 2026-10-28 2026-10-29 2026-10-30; do   # cached extractions → no OpenAI calls
  curl -s -X POST localhost:4100/api/companies/ironline/ingest-day -H 'content-type: application/json' -d "{\"day\":\"$d\"}" >/dev/null; done
curl -s -X POST localhost:4000/api/companies/ironline/check -H 'content-type: application/json' -d '{"asOf":"2026-10-30"}' | head -c 400
```

What you should see:
- the `doc.extracted` messages in `#fleet-intake`
- one `findings.ready` post in `#fleet-findings`, with the briefing in its thread
- `/check` returning a non-null `briefing`
- `GET :4000/api/companies/ironline/snapshot` with `unmatched: []`

If docs show up as unmatched, ordering is broken (see rule 2). Note that `bun apps/data/test/replay-truth.ts`
posts directly to the data server and **skips** the relay, so it's the fallback when the network is down, not a test of the network.

## What it catches (answer key)

P1 unbilled detention $162.50 · P3 rate mismatch $300 · P4 missing POD ($2,279.65 blocked) · P6 uninvoiced
lumper $175 · P7 fuel card used 560 mi away $800.73 · P8 duplicate receipt $1,250.43 · P10 8 invoices past due ·
P11 medical card expiring · P12 4 loads ready to invoice $14,192.68. Out of scope: P2, P5 (shown in P12
detail), P9.

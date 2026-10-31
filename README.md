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
  (company → briefer), `enrichment.requested` (briefer → enrichment), `enrichment` (enrichment → briefer),
  `briefing.ready` (briefer → owner). Choose in-process or Agent Relay delivery with `RELAY_TRANSPORT`.

## Run it

Needs Bun ≥ 1.4.2. Use three terminals:

```sh
bun install
bun run dev:actors          # Terse runtime on :7100 (wait for "Ready")
bun run dev:data            # data server on :4000
bun run dev:inference       # inference server on :4100 — put OPENAI_API_KEY in apps/inference/.env
bun run dev:web             # Rachit's UI on :5173 (mock data; not wired to the backend yet)
# live agent tracker (raw relay feed): http://localhost:4100/tracker
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

The inference server supports **local** and **agent-relay** transports. The network transport uses
`@agent-relay/sdk@15.0.1` and the existing Intake, Enrichment, Briefer and data-server bridge. Terse actors
remain SDK-free. No internet research or route-planning agent is included.

The agents execute inside the local inference server on your Mac; their Relay identities are not separate
cloud workers. The data server and Terse storage also run locally. Agent Relay carries messages through its
cloud service, and configured OpenAI calls use OpenAI's cloud. Moving execution to the cloud would require
deploying these services and persistent storage separately.

### Setup

```sh
bun install
bun run --cwd apps/inference relay:setup
```

Setup creates a uniquely named workspace, registers `intake-agent`, `data-server`, `enrichment-agent` and
`briefer`, creates four channels, and joins the participants. It saves credentials with mode `0600` in
`data/cache/relay/credentials.json`, and sets `RELAY_TRANSPORT=agent-relay` in `apps/inference/.env`.
It preserves existing model/API-key settings. Rerunning setup resumes incomplete work or reconnects existing
identities; it does not rotate their tokens. Credentials are never printed. Keep the credential file private.

Optional setup settings: `RELAY_WORKSPACE_NAME`, `RELAY_BASE_URL` (provider endpoint), and
`RELAY_CREDENTIALS_FILE` (absolute private credential-file path). Use one active inference process per workspace.

Start the project in three terminals:

```sh
bun run dev:actors
# Once Terse is Ready, generate bindings (also needed after actor method changes):
bun run --cwd apps/data generate
bun run dev:data
bun run dev:inference
```

`GET http://127.0.0.1:4100/health` reports `relay: "agent-relay"`. Startup fails if Relay credentials cannot be
loaded or connected; it never silently switches to local mode. Set `RELAY_TRANSPORT=local` explicitly to use
in-process delivery without network access.

### Channels and execution

| Channel | Traffic |
|---|---|
| `fleet-intake` | `doc.extracted`, followed by the data bridge's completion receipt |
| `fleet-findings` | `findings.ready`; the generated `briefing.ready` is a thread reply |
| `fleet-enrichment` | Briefer's `enrichment.requested`, Enrichment's EIA result, and completion receipt |
| `fleet-activity` | `load.updated` and `log` |

Each post includes a human summary and the original envelope in `metadata.fleet`. Logical `company:<id>`
senders use the `data-server` identity. Incoming records must match their authenticated sender and topic.
Agent replies are correlated by application message ID; Relay message acceptance is not handler completion.

`/relay/publish`, `/relay/recent`, and `/relay/feed` remain available. `/check` still waits for and returns
`{findings, totalAtRisk, briefing}`. Enrichment now runs through its own request and result exchange. The Briefer
uses the returned EIA data and its existing model/template fallback. The `briefing.ready` handler writes through
`POST :4000/api/companies/:c/briefing`, so both manual and scheduled briefings are persisted in Terse.

### Ordering and recovery

- Intake waits for document routing completion before advancing to the next phase. The receiver serializes documents
  per company. Keep rate confirmations before dependent paperwork when publishing from another client.
- The SDK's realtime events and REST retrieval share one receiver. REST retrieval catches an accepted message whose
  realtime notification was missed. The receiving role reads the persisted Relay record before executing the handler.
- `data/cache/relay/deliveries.sqlite` journals pending envelopes, provider IDs and completed handler results. On restart,
  pending deliveries resume; completed handlers are not rerun for the same message ID. Preserve this directory alongside
  Terse state. This is transport state, not a second business database.
- Retries use the same idempotency key. An optional `id` on `/relay/publish` lets callers safely repeat a request; reusing
  that ID with different content is rejected. New intentional processing uses a new ID.
- A crash between a business write and the completion checkpoint can still redeliver: handlers must remain idempotent.
  This is at-least-once processing, not an exactly-once transaction across Relay and Terse.
- Alarm checks retain their findings and message ID in Terse until the hub accepts them. `wait:false` acknowledges durable
  transport acceptance without holding the actor open during the briefing callback. If acceptance fails, the alarm retries
  after one minute. In local mode there is no durable transport journal.
- Requests time out after 60 seconds without fabricating success; pending work remains available for retry. The journal
  supports this application's accepted jobs, not arbitrary historical workspace messages authored while it was offline.

### Verification

```sh
bun test
bun run check
# With actors, data, and inference running in agent-relay mode:
bun run --cwd apps/inference relay:smoke
curl -N http://127.0.0.1:4100/relay/feed
```

The smoke test creates a NEW fictional company, sends answer-key extractions through Relay, runs an audit, and verifies
that the briefing was persisted. It does not reset the existing Ironline company. It exercises networking without paid
extraction calls; the Briefer uses its configured model if a key is present, otherwise its template.

Unit tests cover recipient completion, duplicate delivery, ordering, restart recovery, sender validation, failed-handler
retry, the Enrichment exchange, and local transport compatibility. The older `replay-truth.ts` script bypasses Relay and
resets its target company; use `relay:smoke` to verify the network.

## What it catches (answer key)

P1 unbilled detention $162.50 · P3 rate mismatch $300 · P4 missing POD ($2,279.65 blocked) · P6 uninvoiced
lumper $175 · P7 fuel card used 560 mi away $800.73 · P8 duplicate receipt $1,250.43 · P10 8 invoices past due ·
P11 medical card expiring · P12 4 loads ready to invoice $14,192.68. Out of scope: P2, P5 (shown in P12
detail), P9.

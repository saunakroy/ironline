# Inference server (`apps/inference`)

The inference server is home to the **agents**: everything that reads documents, calls the internet or writes prose. It also
hosts the **relay hub** the agents talk over, backed by local delivery or Agent Relay SDK 15.0.1.

State lives on the [data server](../data/README.md) in Terse actors. This server is stateless apart from
an in-memory message feed, the extraction cache, and a transport journal under `data/cache/relay/` in Agent Relay mode.

---

## Run

```sh
bun install                    # repo root
cp apps/inference/.env.example apps/inference/.env   # set OPENAI_API_KEY (and EIA_API_KEY if you have one)
bun run dev:inference          # :4100 (needs the data server on :4000 for routing)

bun run --cwd apps/inference extract data/fleet_demo/inbox/2026-10-26/RateCon_RFL-482317.pdf   # test one extraction
curl -X POST localhost:4100/api/companies/ironline/ingest-day -H 'content-type: application/json' -d '{"day":"2026-10-26"}'
curl -N localhost:4100/relay/feed     # watch the agents talk
```

| Var | Default | |
|---|---|---|
| `INFERENCE_PORT` | `4100` | |
| `DATA_URL` | `http://127.0.0.1:4000` | where `doc.extracted` is delivered |
| `OPENAI_API_KEY` | none | needed for Intake. The Briefer falls back to a template without it |
| `OPENAI_MODEL` | `gpt-5-mini` | used by both Intake and Briefer |
| `EIA_API_KEY` | none | optional. Without it the server uses `data/cache/eia_diesel.json`, then a fixed $6.50 |
| `RELAY_TRANSPORT` | `local` | `agent-relay` enables the network transport |
| `RELAY_CREDENTIALS_FILE` | `data/cache/relay/credentials.json` | private file created by `relay:setup` |

---

## Files

| File | What it is |
|---|---|
| `src/relay.ts` | `RelayHub`, local transport, and network dispatch |
| `src/agent-relay-transport.ts` | Agent Relay send/receive, completion receipts, ordering and recovery |
| `src/relay-store.ts` | SQLite transport journal (pending deliveries and completed results) |
| `src/relay-setup.ts` | Resumable workspace/channel/identity setup; private credentials |
| `src/agents.ts` | Document, Enrichment, Briefer and persistence handlers |
| `src/server.ts` | HTTP API, transport startup and the intake pipeline |
| `src/extract.ts` | Intake agent: zod schema, prompt, file-type handling |
| `src/eia.ts` | Enrichment agent's data source: EIA weekly diesel and implied FSC per mile |
| `src/briefer.ts` | Briefer agent: LLM prose plus a deterministic template fallback |
| `src/extract-cli.ts` | `bun run extract <files>` for prompt iteration |

---

## Agent roles

Each agent is a named participant on the relay. The `from`/`to` strings below are the names used today.

### 1. Intake agent (`intake-agent`)
- **Job:** turn one file into one `ExtractedDoc` (classify it and pull out its fields). **It only reads.** It never does math or
  "fixes" amounts.
- **Input:** a file. That can be a rate con PDF, a BOL or POD photo, a fuel or lumper receipt photo, an invoice `.docx`, a tender `.eml`, or a texts/notes `.txt`.
  It also gets context: the open loads (from `GET data/open-loads`) and today's date.
- **How:** OpenAI `generateObject` with a strict zod schema (`src/extract.ts`). Images and PDFs are sent natively, and `.docx` files go through
  mammoth first.
- **Matching help:** for texts and notes, it tags each event with the `loadReference` of an open load, but only when the lane, customer or
  driver makes it clear. Otherwise the reference is `null`.
- **Publishes:** `doc.extracted` → `company:<id>`.
- **Ordering:** files run in three **phases**. Rate cons and tenders go first (they create loads), then paperwork, then texts and notes.
  Within a phase, up to 4 files run concurrently.
- **Cache:** writes every extraction to `data/cache/extractions/<file>.json`. `?cache=1` / `cache:true` replays the
  cached copy without calling the LLM, which makes the stage-safe re-run instant.

### 2. Enrichment agent (`enrichment-agent`)
- **Job:** bring in outside facts that the documents can't provide. Today that's the DOE/EIA weekly diesel price and the fuel surcharge it implies
  per mile (`(price − 1.25) / 6`).
- **Triggered by:** `enrichment.requested` from Briefer while handling `findings.ready`, before the briefing gets written.
- **Publishes:** `enrichment` → `briefer`, with payload `{ diesel: {period, pricePerGallon, source}, impliedFscPerMile }`.
- **Next candidates:** broker credit and days-to-pay, lane rate benchmarks, FMCSA lookups. Each new source should be its own
  subscriber that publishes `enrichment`, never a direct database write.

### 3. Briefer agent (`briefer`)
- **Job:** write the owner's short nightly text from `Finding[]`. It leads with dollars at risk, puts the biggest money first, and gives one
  action per line. **It uses only the numbers in the findings JSON.**
- **Subscribes:** `findings.ready`.
- **Publishes:** `briefing.ready` → `owner:<companyId>` with a `Briefing`, and **also returns `{ briefing }` as the
  reply**, which the data server's `/check` waits for. The `briefing.ready` handler persists the result through the data API.
- **Fallback:** `templateBriefing()` is used with no API key, after a 20-second timeout, or on an error. The demo never shows an empty text.

### 4. The other participants (on the data server, in Terse)
- `company:<id>` (the **Company actor**, the ledger and auditor) receives `doc.extracted`, and publishes `findings.ready` after a
  check and from its nightly alarm.
- `data-server` (the **router**) publishes `load.updated` once per routed document.
- `ui` / `owner:<id>` (the **owner's screen**) consume `load.updated` and `briefing.ready` through `/relay/feed`.

---

## Message flow

```
upload ─▶ Intake ──doc.extracted──▶ company:<id> (router → Load/Company actors) ──load.updated──▶ ui
                                                    │
     "Run tonight's check" / 02:00 alarm ──▶ Company.runCheck ──findings.ready──▶ Briefer
                                                                                  │  ▲
                                                           Enrichment ──enrichment─┘  │
                                                                                     │
                                           Briefer ──briefing.ready──▶ owner:<id> ───┘ (+ reply to /check)
```

### Topics and payloads (types in `apps/data/src/shared/types.ts`)

| Topic | from → to | Payload | Delivery today |
|---|---|---|---|
| `doc.extracted` | `intake-agent` → `company:<id>` | `{ companyId, doc: ExtractedDoc, cached }` | handler `POST`s `doc` to `DATA_URL/api/companies/:c/docs` and returns `RouteResult[]` |
| `load.updated` | `data-server` → `ui` | `RouteResult` | feed only (no handler) |
| `findings.ready` | `data-server` \| `company:<id>` → `briefer` | `{ companyId, asOf, findings, totalAtRisk, unmatched? }` | handler runs Enrichment, then the Briefer, and **returns `{briefing}`** |
| `enrichment.requested` | `briefer` → `enrichment-agent` | `{companyId, asOf}` | returns the EIA enrichment after publishing it |
| `enrichment` | `enrichment-agent` → `briefer` | `{ diesel, impliedFscPerMile }` | visible result; Briefer receives the correlated completion |
| `briefing.ready` | `briefer` → `owner:<id>` | `Briefing` | persists through the data API; thread reply to findings |
| `log` | any → any | free-form (e.g. `{reading: file}`) | feed only, for the UI's agent-activity panel |

---

## Agent Relay setup

See the [root setup guide](../../README.md#agent-communication-network-agent-relay) for workspace creation,
identities, channels, recovery behavior and the live smoke test.

```sh
bun run --cwd apps/inference relay:setup
bun run dev:inference
```

The setup command preserves existing API keys, saves private credentials, and enables `RELAY_TRANSPORT=agent-relay`.
The local transport remains available by explicitly selecting `RELAY_TRANSPORT=local`.
All handlers are registered before connecting or replaying pending deliveries. The transport runs no business handler
until it reads the accepted message from Relay; completion receipts preserve `/check` and document-routing responses.

### Rules for any new agent
- **It reads or writes prose only.** Dollar amounts come from `rules.ts` on the data server. If a new check needs math, add a
  rule and a test there.
- **It talks over the relay,** never by writing to the database directly. Actor state changes only through the data server's API.
- **It publishes a `log` message for anything worth showing.** Judges watch the agent feed.

---

## HTTP API

| Method | Path | |
|---|---|---|
| GET | `/health` | `{ok, openai: boolean, relay: "local" \| "agent-relay"}` |
| POST | `/api/companies/:c/ingest` | multipart `files[]`, optional `?cache=1` → per-file `{file, kind, cached, routed}` |
| POST | `/api/companies/:c/ingest-day` | `{day: "2026-10-26", cache?: boolean}` ingests `data/fleet_demo/inbox/<day>` |
| POST | `/relay/publish` | `{topic, from, to, payload, id?, inReplyTo?, wait?}` → `{message, delivery}`; `wait:false` returns `202 {accepted:true}` |
| GET | `/relay/recent` | last 200 `RelayMessage`s |
| GET | `/relay/feed` | SSE: last 50 messages, then live |
| GET | `/api/enrich/diesel` | `{diesel, impliedFscPerMile}` |

## Not tested yet
Live OpenAI extraction hasn't been run (there was no key when this was written). Run `bun run extract` on one file
of each kind before the demo, and tweak the prompt or schema in `src/extract.ts` if fields come back wrong.

# Inference server (`apps/inference`)

The inference server is home to the **agents**: everything that reads documents, calls the internet or writes prose. It also
hosts the **relay hub** the agents talk over. This is where Agent Relay plugs in.

State lives on the [data server](../data/README.md) in Terse actors. This server is stateless apart from
an in-memory message feed and the extraction cache on disk.

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

---

## Files

| File | What it is |
|---|---|
| `src/relay.ts` | `RelayHub` plus the **`Transport` interface, the seam for Agent Relay** |
| `src/server.ts` | HTTP API, agent subscriptions (`hub.on(...)`) and the intake pipeline |
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
- **Triggered by:** `findings.ready`, before the briefing gets written.
- **Publishes:** `enrichment` → `briefer`, with payload `{ diesel: {period, pricePerGallon, source}, impliedFscPerMile }`.
- **Next candidates:** broker credit and days-to-pay, lane rate benchmarks, FMCSA lookups. Each new source should be its own
  subscriber that publishes `enrichment`, never a direct database write.

### 3. Briefer agent (`briefer`)
- **Job:** write the owner's short nightly text from `Finding[]`. It leads with dollars at risk, puts the biggest money first, and gives one
  action per line. **It uses only the numbers in the findings JSON.**
- **Subscribes:** `findings.ready`.
- **Publishes:** `briefing.ready` → `owner:<companyId>` with a `Briefing`, and **also returns `{ briefing }` as the
  reply**, which the data server's `/check` waits for.
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
| `enrichment` | `enrichment-agent` → `briefer` | `{ diesel, impliedFscPerMile }` | feed only. Today the Briefer gets the values in-process |
| `briefing.ready` | `briefer` → `owner:<id>` | `Briefing` | feed only |
| `log` | any → any | free-form (e.g. `{reading: file}`) | feed only, for the UI's agent-activity panel |

---

## Plugging in Agent Relay: where to start

`src/relay.ts` is the only file that needs to know about the transport:

```ts
export interface Transport {
    deliver(msg: RelayMessage, handler: Handler | undefined): Promise<unknown>
}
```

Today `localTransport` calls the in-process handler directly. Suggested migration:

1. **Register each agent as an Agent Relay identity:** `intake-agent`, `enrichment-agent`, `briefer`,
   `company-<id>` (or one `data-server` identity that fans out by `companyId`), and `ui`.
2. **Implement an `AgentRelayTransport`.** `deliver()` sends the envelope to the `to` participant (or to a channel named after
   the topic). Keep the `RelayMessage` envelope as-is so payloads don't change.
3. **Move each `hub.on(topic, handler)` into a subscriber** on the receiving agent. The handler bodies in
   `server.ts` are already the agent logic.
4. **Request/reply:** `findings.ready` → Briefer is synchronous today because `/check` waits for the briefing. Either:
   - use Agent Relay's request/reply or receipts, *or*
   - make it async: the Briefer publishes `briefing.ready`, and a data-side subscriber calls `Company.setBriefing` (the UI already gets it over the Company WebSocket).
5. **Ordering:** keep `doc.extracted` ordered per `companyId` (rate cons before paperwork). If Agent Relay can't guarantee
   that, have the data server re-try unmatched docs whenever a new `rate_confirmation` arrives.
6. **Keep `/relay/publish` and `/relay/feed` working.** The data server and the `Company` alarm publish via
   `POST /relay/publish`, and the UI reads `/relay/feed` (SSE). Back both with Agent Relay so neither side has to change.
7. **Durable delivery:** if Agent Relay offers offline catch-up and retries, `doc.extracted` should use them, because a dropped doc
   becomes a missed finding. Routing is idempotent (keyed by file name), so redelivery is safe.

### Rules for any new agent
- **It reads or writes prose only.** Dollar amounts come from `rules.ts` on the data server. If a new check needs math, add a
  rule and a test there.
- **It talks over the relay,** never by writing to the database directly. Actor state changes only through the data server's API.
- **It publishes a `log` message for anything worth showing.** Judges watch the agent feed.

---

## HTTP API

| Method | Path | |
|---|---|---|
| GET | `/health` | `{ok, openai: boolean}` |
| POST | `/api/companies/:c/ingest` | multipart `files[]`, optional `?cache=1` → per-file `{file, kind, cached, routed}` |
| POST | `/api/companies/:c/ingest-day` | `{day: "2026-10-26", cache?: boolean}` ingests `data/fleet_demo/inbox/<day>` |
| POST | `/relay/publish` | `{topic, from, to, payload}` → `{message, delivery}` |
| GET | `/relay/recent` | last 200 `RelayMessage`s |
| GET | `/relay/feed` | SSE: last 50 messages, then live |
| GET | `/api/enrich/diesel` | `{diesel, impliedFscPerMile}` |

## Not tested yet
Live OpenAI extraction hasn't been run (there was no key when this was written). Run `bun run extract` on one file
of each kind before the demo, and tweak the prompt or schema in `src/extract.ts` if fields come back wrong.

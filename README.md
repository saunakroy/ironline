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

## What it catches (answer key)

P1 unbilled detention $162.50 · P3 rate mismatch $300 · P4 missing POD ($2,279.65 blocked) · P6 uninvoiced
lumper $175 · P7 fuel card used 560 mi away $800.73 · P8 duplicate receipt $1,250.43 · P10 8 invoices past due ·
P11 medical card expiring · P12 4 loads ready to invoice $14,192.68. Out of scope: P2, P5 (shown in P12
detail), P9.

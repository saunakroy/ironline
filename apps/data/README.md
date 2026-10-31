# Data server (`apps/data`)

The data server is the source of truth for every fleet. It holds all state in **Terse Durable Actors**, routes
extracted documents to the right actor, and runs the deterministic nightly audit. **It never calls an LLM.**
Anything that reads a document, touches the internet or writes prose belongs on the
[inference server](../inference/README.md).

If you're wiring up Agent Relay, the data server is **one participant** on the network. It receives
`doc.extracted`, and it publishes `load.updated` and `findings.ready`. The relay hub currently lives on the inference
server, so the Agent Relay integration is mostly over there. This doc explains what the data side sends and
expects, so the network can be built around it.

---

## Run

```sh
bun install                         # from the repo root
bun run dev:actors                  # Terse runtime on :7100. Wait for "Ready"
bun run dev:data                    # HTTP API on :4000
bun run --cwd apps/data generate    # regenerate typed client after changing actor methods (needs :7100 up)

curl -X POST localhost:4000/api/companies/ironline/seed -H 'content-type: application/json' -d '{}'
bun apps/data/test/replay-truth.ts  # end-to-end smoke test (no LLM): docs → actors → check → briefing
bun test                            # rules vs. the answer key
```

`.env` (copied from `.env.example`):

| Var | Default | Used by |
|---|---|---|
| `DURABLE_ACTORS_PORT` / `DURABLE_ACTORS_CONTROL_PLANE_URL` | `7100` | Terse runtime + client |
| `DATA_PORT` | `4000` | HTTP API |
| `RELAY_HUB_URL` | `http://127.0.0.1:4100` | where the data server publishes relay messages (also read by the `Company` alarm) |
| `DATASET_DIR` | `data/fleet_demo` | seed source |

---

## Files

| File | What it is |
|---|---|
| `src/actors.ts` | The two Terse actors, `Company` and `Load` |
| `src/router.ts` | Deterministic routing that sends an `ExtractedDoc` to the right actor(s) |
| `src/server.ts` | Express API, plus `publish()`, the data server's only outbound relay call |
| `src/seed.ts` | Onboarding: CSV files become per-company SQLite tables, plus the company profile |
| `src/shared/types.ts` | **All shared types**, including `ExtractedDoc`, `Finding`, `Briefing` and `RelayMessage`. The inference server imports them as `@fleet/data/shared` |
| `src/shared/rules.ts` | The 9 audit rules (pure functions) |
| `src/shared/merge.ts` | How a document or message events merge into a `LoadRecord` |
| `test/rules.test.ts` | Answer-key tests |
| `test/replay-truth.ts` | Posts perfect extractions through the real stack. Use it as the stage fallback |

---

## Roles on the data side

These aren't LLM agents, but each one is a separate participant with its own state and responsibilities. Treat
them as named endpoints when you design the relay network.

### `Company` actor: the fleet's ledger and auditor (one per fleet, id = `companyId`, e.g. `ironline`)
- **Owns:** the company's SQLite database:
  - `h_*` history tables, created from the fleet's own CSV headers at onboarding
  - `live_loads`, `live_fuel_receipts`, `live_documents`, `findings_log`
  - persisted `profile`, `findings`, `briefing`, `lastCheckAt`
- **Does:**
  - assigns carrier load numbers (`registerLoad`)
  - matches documents to loads by reference, then BOL number (`matchLoad`)
  - keeps the fuel ledger
  - runs `runCheck(asOf)` → `Finding[]`
- **Schedules:** one durable alarm. `scheduleCheck()` defaults to the next 02:00. `onAlarm` runs the check and
  then **publishes `findings.ready` to `RELAY_HUB_URL` by itself**. That's the only relay call made from inside an actor.
- **Broadcasts** to WebSocket clients: `{type:"findings"}`, `{type:"load"}`, `{type:"briefing"}`.

### `Load` actor: one load's record, from rate con to payment (id = `${companyId}.${loadId}`, e.g. `ironline.IRN-1852`)
- **Owns:** a persisted `LoadRecord` (rate terms, stops, BOL, POD, lumper receipts, invoice drafts, documents).
- **Does:** `applyDoc(doc)` and `applyEvents(events, file, driver)`. It broadcasts the new record to anyone viewing that load.

### Router (`src/router.ts`): the data server's inbox for `doc.extracted`
| `doc.kind` | Goes to |
|---|---|
| `rate_confirmation`, `load_tender` | `Company.registerLoad(reference)` → `Load.applyDoc` (this creates the load) |
| `bol`, `pod`, `lumper_receipt`, `invoice_draft`, `dvir` | `Company.matchLoad(reference \| bolNumber)` → `Load.applyDoc`. With no match, the doc is stored as **unmatched** |
| `fuel_receipt` | `Company.addFuelReceipt`, on the fleet-level ledger rather than a load |
| `driver_texts`, `owner_notes` | Each `events[i].loadReference` → matched load → `Load.applyEvents` |

After every routed document, the router calls `Company.upsertLoad(record)` so the company's copy stays current.
Order matters: rate cons and tenders must arrive **before** the paperwork for their load, or that paperwork
ends up unmatched. The inference server enforces this today (see its phases), so keep that guarantee if
Agent Relay reorders delivery.

### Auditor (`src/shared/rules.ts`): deterministic checks, called by `Company.runCheck`
`UNBILLED_DETENTION`, `RATE_MISMATCH`, `MISSING_POD`, `UNINVOICED_LUMPER`, `FUEL_CARD_MISMATCH`,
`DUPLICATE_RECEIPT`, `AR_PAST_DUE`, `MEDICAL_CARD_EXPIRING`, `READY_TO_INVOICE`. Every dollar amount in the
product comes from here.

---

## Relay contract (data server side)

Envelope (`RelayMessage` in `src/shared/types.ts`):

```ts
{ id: string; topic: Topic; from: string; to: string; at: string /* ISO */; payload: T }
```

Today the data server publishes by calling `POST ${RELAY_HUB_URL}/relay/publish` with `{topic, from, to, payload}`. The hub
fills in `id` and `at`.

| Direction | Topic | from → to | Payload | Notes |
|---|---|---|---|---|
| **in** | `doc.extracted` | `intake-agent` → `company:<id>` | `{ companyId, doc: ExtractedDoc, cached: boolean }` | Delivered today by the hub as `POST /api/companies/:c/docs` with **body = `doc`**. Response is a `RouteResult` (`{file, kind, loadIds, matchedBy, note?}`) |
| out | `load.updated` | `data-server` → `ui` | `RouteResult` | Fire-and-forget, sent once per routed doc |
| out | `findings.ready` | `data-server` (or `company:<id>` from the alarm) → `briefer` | `{ companyId, asOf, findings: Finding[], totalAtRisk, unmatched: {file,kind,addedAt}[] }` | **Request/reply:** `POST /check` waits for the reply and reads `delivery.briefing` (a `Briefing`), then stores it with `Company.setBriefing` |

### What the Agent Relay migration has to preserve
1. **`findings.ready` is request/reply.** `server.ts` → `/check` expects the publish response to contain
   `{ delivery: { briefing } }`. If Agent Relay is async-only, do one of the following:
   - (a) have the Briefer publish `briefing.ready` and add a data-side subscriber that calls `Company.setBriefing`, *or*
   - (b) keep a correlation id and wait for the reply.

   Option (a) is cleaner. If you choose it, `/check` should return findings immediately, and the UI picks up the
   briefing from the Company WebSocket broadcast.
2. **`doc.extracted` needs per-company ordering.** Rate cons must land before BOLs and PODs for the same load. Either
   deliver in order per `companyId`, or retry unmatched docs after each new `rate_confirmation`.
3. **The actor alarm publishes too.** `Company.onAlarm` calls `fetch(RELAY_HUB_URL + "/relay/publish")`. If the
   hub moves, update that env var. Don't put an Agent Relay SDK inside the actor; keep actors thin and talk HTTP to the
   data server or hub.
4. **The data server stays LLM-free.** New agents subscribe on the relay. They don't run inside this process.

---

## HTTP API

| Method | Path | Body → Response |
|---|---|---|
| GET | `/health` | `{ok}` |
| POST | `/api/companies/:c/seed` | `{historyDir?, name?}` → `{profile, imported}` |
| GET | `/api/companies/:c/snapshot` | → `CompanySnapshot` (profile, tables, loads, unmatched, findings, briefing, lastCheckAt, nextCheckAt) |
| GET | `/api/companies/:c/open-loads` | → `OpenLoad[]` (the Intake agent uses this as matching context) |
| GET | `/api/companies/:c/loads/:id` | → `LoadRecord` |
| POST | `/api/companies/:c/docs` | `ExtractedDoc \| ExtractedDoc[]` → `RouteResult[]` (the **`doc.extracted` delivery endpoint**) |
| POST | `/api/companies/:c/check` | `{asOf?}` → `{findings, totalAtRisk, briefing}` |
| POST | `/api/companies/:c/schedule` | `{atMs?}` → `{nextCheckAt}` |
| POST | `/api/companies/:c/reset` | clears live data and keeps history |
| POST | `/api/companies/:c/socket` | Terse WebSocket grant (`websocketUrl`) for the company feed |
| POST | `/api/companies/:c/loads/:id/socket` | Terse WebSocket grant for one load |

---

## Terse gotchas (learned the hard way)

- **Every method on an actor class must be `async`,** private helpers included. Put sync helpers in module-level functions.
- **Actor ids** may contain only letters, digits, `.`, `_` and `-`. No `:` or `/`.
- **Imports inside the actor project use `.js` specifiers** (`./shared/index.js`). Terse's compiler rejects `.ts`.
- **Code the actors import must live inside `apps/data`.** A separate workspace package failed to compile. That's why
  `shared/` lives here.
- **`@Persisted` arrays and objects must be reassigned,** not mutated (`this.x = [...this.x, y]`).
- **Bulk writes go in `await this.db.transaction(...)`.** Row-by-row autocommit took about 2.5 minutes to seed; inside a transaction it takes about 13 seconds. `@Atomic` isn't
  exported in 0.14.6.
- **Tables starting with `_` are reserved** by the runtime. Don't query them.
- **Actor code reloads on save under `dev:actors`.** Restart `dev:data`, and run `generate` again after changing method signatures.

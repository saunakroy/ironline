// Thin client for the two backend servers. In dev, Vite proxies /data -> :4000 and /inference -> :4100.
import type { Briefing, CompanyProfile, Finding, LoadRecord, RelayMessage } from '@fleet/data/shared'

/** Mirrors Company.snapshot() in apps/data/src/actors.ts. */
export type CompanySnapshot = {
  profile: CompanyProfile | null
  tables: { name: string; rows: number }[]
  loads: LoadRecord[]
  unmatched: { file: string; kind: string; addedAt: string }[]
  findings: Finding[]
  briefing: Briefing | null
  lastCheckAt: string | null
  nextCheckAt: string | null
}

export const COMPANY = import.meta.env.VITE_COMPANY_ID ?? 'ironline'
/** The demo dataset's "tonight". Override with VITE_AS_OF for other datasets. */
export const AS_OF = import.meta.env.VITE_AS_OF ?? '2026-10-30'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1'

const DATA = import.meta.env.VITE_DATA_URL ?? '/data'
const INFERENCE = import.meta.env.VITE_INFERENCE_URL ?? '/inference'

async function json<T>(r: Response): Promise<T> {
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`)
  return body as T
}

export type RouteResult = { file: string; kind: string; loadIds: string[]; matchedBy: string; note?: string }
export type IngestResult = {
  file: string
  kind?: string
  cached?: boolean
  traceId?: string
  routed?: RouteResult | RouteResult[]
  error?: string
}

export const api = {
  snapshot: () => fetch(`${DATA}/api/companies/${COMPANY}/snapshot`).then(r => json<CompanySnapshot>(r)),
  runCheck: (asOf = AS_OF) =>
    fetch(`${DATA}/api/companies/${COMPANY}/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ asOf }),
    }).then(r => json<{ totalAtRisk: number }>(r)),
  companySocket: () =>
    fetch(`${DATA}/api/companies/${COMPANY}/socket`, { method: 'POST' }).then(r => json<{ websocketUrl: string }>(r)),
  inferenceHealth: () => fetch(`${INFERENCE}/health`).then(r => json<{ ok: boolean; openai: boolean; relay?: string }>(r)),
  /** One file per request so the queue can show per-file progress. */
  ingest: (file: File) => {
    const form = new FormData()
    form.append('files', file, file.name)
    return fetch(`${INFERENCE}/api/companies/${COMPANY}/ingest?cache=1`, { method: 'POST', body: form })
      .then(r => json<IngestResult[]>(r))
      .then(rows => rows[0] ?? { file: file.name, error: 'no result' })
  },
  /** Replays one dataset inbox day (cached extractions, so it's fast). */
  ingestDay: (day: string) =>
    fetch(`${INFERENCE}/api/companies/${COMPANY}/ingest-day`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ day, cache: true }),
    }).then(r => json<IngestResult[]>(r)),
  relayFeedUrl: () => `${INFERENCE}/relay/feed`,
  /** Dataset file (BOL photo, receipt) for the evidence drawer. */
  fileUrl: (path: string) => `${DATA}/api/files?path=${encodeURIComponent(path)}`,
}

export type { Finding, RelayMessage }

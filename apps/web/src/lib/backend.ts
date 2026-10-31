// Client for the two backend servers. In dev, Vite proxies /data -> :4000 and /inference -> :4100.
import type { Briefing, CompanyProfile, Finding, LoadRecord, RelayMessage } from '@fleet/data/shared';

export const COMPANY = import.meta.env.VITE_COMPANY_ID ?? 'ironline';
/** The demo dataset's "tonight". Override with VITE_AS_OF for other datasets. */
export const AS_OF = import.meta.env.VITE_AS_OF ?? '2026-10-30';
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

const DATA = import.meta.env.VITE_DATA_URL ?? '/data';
const INFERENCE = import.meta.env.VITE_INFERENCE_URL ?? '/inference';

/** Mirrors Company.snapshot() in apps/data/src/actors.ts. */
export type CompanySnapshot = {
  profile: CompanyProfile | null;
  tables: { name: string; rows: number }[];
  loads: LoadRecord[];
  unmatched: { file: string; kind: string; addedAt: string }[];
  findings: Finding[];
  briefing: Briefing | null;
  lastCheckAt: string | null;
  nextCheckAt: string | null;
};

/** Mirrors Company.fleetOverview(). */
export type FleetOverview = {
  drivers: {
    driverId: string;
    name: string;
    phone: string;
    truckId: string | null;
    fleetUnit: string | null;
    fuelCard: string | null;
    medicalCardExpiration: string | null;
    cdlExpiration: string | null;
  }[];
  kpis: {
    asOf: string;
    revenuePerMile: number | null;
    fuelCostPerMile: number | null;
    openReceivablesTotal: number;
    openReceivablesCount: number;
    overdueReceivablesCount: number;
    unbilledDetentionLoss: number;
    iftaMonth: string | null;
    monthlyIftaMiles: number;
  };
};

export type RouteResult = { file: string; kind: string; loadIds: string[]; matchedBy: string; note?: string };
export type IngestResult = {
  file: string;
  kind?: string;
  cached?: boolean;
  traceId?: string;
  routed?: RouteResult | RouteResult[];
  error?: string;
};

async function json<T>(r: Response): Promise<T> {
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
  return body as T;
}

export const api = {
  snapshot: () => fetch(`${DATA}/api/companies/${COMPANY}/snapshot`).then(r => json<CompanySnapshot>(r)),
  fleet: () => fetch(`${DATA}/api/companies/${COMPANY}/fleet?asOf=${AS_OF}`).then(r => json<FleetOverview>(r)),
  runCheck: () =>
    fetch(`${DATA}/api/companies/${COMPANY}/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ asOf: AS_OF }),
    }).then(r => json<{ totalAtRisk: number }>(r)),
  companySocket: () =>
    fetch(`${DATA}/api/companies/${COMPANY}/socket`, { method: 'POST' }).then(r => json<{ websocketUrl: string }>(r)),
  ingest: (file: File) => {
    const form = new FormData();
    form.append('files', file, file.name);
    return fetch(`${INFERENCE}/api/companies/${COMPANY}/ingest?cache=1`, { method: 'POST', body: form })
      .then(r => json<IngestResult[]>(r))
      .then(rows => rows[0] ?? { file: file.name, error: 'no result' });
  },
  /** Replays one dataset inbox day (cached extractions, so it's fast). */
  ingestDay: (day: string) =>
    fetch(`${INFERENCE}/api/companies/${COMPANY}/ingest-day`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ day, cache: true }),
    }).then(r => json<IngestResult[]>(r)),
  relayRecentUrl: () => `${INFERENCE}/relay/recent`,
  relayFeedUrl: () => `${INFERENCE}/relay/feed`,
  trackerUrl: () => `${INFERENCE}/tracker`,
  fileUrl: (path: string) => `${DATA}/api/files?path=${encodeURIComponent(path)}`,
};

export type { Finding, LoadRecord, RelayMessage };

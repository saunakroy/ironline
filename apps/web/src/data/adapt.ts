// Maps backend data onto Rachit's view types. Money math stays in the backend's rules; this only relabels.
import type { FindingType } from '@fleet/data/shared';
import { api, type CompanySnapshot, type Finding, type FleetOverview, type IngestResult, type RelayMessage, type RouteResult } from '../lib/backend';
import type { AgentMessage, AgentType, BriefingField, BriefingItem, DriverSession, FleetKPIs, ProcessedFile, WatchItem } from '../types';

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const base = (p: string) => p.split('/').pop() ?? p;
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const IMAGE = /\.(jpe?g|png|webp)$/i;

const STREET = /\b(?:Rd|St|Ave|Dr|Blvd|Hwy|Pkwy|Way|Ln|Ct|Pl|Ter|Cir|Road|Street|Avenue|Drive|Boulevard)\.?(?:\s+(?:N|S|E|W|NE|NW|SE|SW))?\b/g;
/** "1850 Williams Rd Columbus, OH 43207" -> "Columbus, OH" */
export function cityState(s?: string | null): string {
  if (!s) return '—';
  const m = [...s.matchAll(/([A-Za-z .'-]+),\s*([A-Z]{2})\b/g)].pop();
  if (!m) return s.split('\n').pop()!.trim();
  let city = m[1]!.split('\n').pop()!;
  const streets = [...city.matchAll(STREET)];
  if (streets.length) city = city.slice(streets[streets.length - 1]!.index! + streets[streets.length - 1]![0].length);
  return `${city.trim()}, ${m[2]}`;
}

// ---------- findings -> tonight's briefing + watch list ----------

/** Money that's lost unless the owner acts tonight. The rest is the watch list (cash timing, compliance). */
const TONIGHT: FindingType[] = ['UNBILLED_DETENTION', 'RATE_MISMATCH', 'UNINVOICED_LUMPER', 'FUEL_CARD_MISMATCH', 'DUPLICATE_RECEIPT'];
const ACTION: Record<FindingType, string> = {
  UNBILLED_DETENTION: 'Add the detention line to the invoice and send the BOL times to the broker',
  RATE_MISMATCH: 'Correct the invoice to the signed rate con and resend',
  MISSING_POD: 'Get the POD photo from the driver so the load can be invoiced',
  UNINVOICED_LUMPER: 'Add the lumper receipt to the invoice for reimbursement',
  FUEL_CARD_MISMATCH: 'Reassign the purchase to the right truck and check who has the card',
  DUPLICATE_RECEIPT: 'Delete the duplicate so fuel cost and IFTA count it once',
  AR_PAST_DUE: 'Call the brokers on the oldest past-due invoices',
  MEDICAL_CARD_EXPIRING: 'Book the DOT physical before the card lapses',
  READY_TO_INVOICE: 'Send these invoices tonight',
};
const WATCH: Partial<Record<FindingType, { badge: string; category: WatchItem['category'] }>> = {
  AR_PAST_DUE: { badge: 'Past due', category: 'cash' },
  READY_TO_INVOICE: { badge: 'Ready to bill', category: 'cash' },
  MISSING_POD: { badge: 'Missing POD', category: 'billing' },
  MEDICAL_CARD_EXPIRING: { badge: 'Compliance', category: 'compliance' },
};

function fields(f: Finding): BriefingField[] {
  const out: BriefingField[] = [];
  if (f.loadIds.length) out.push({ label: f.loadIds.length > 1 ? 'Loads' : 'Load', value: f.loadIds.join(', ') });
  out.push({ label: 'What we found', value: f.detail, isProblem: true });
  if (f.amount != null) out.push({ label: 'Amount', value: usd(f.amount), isProblem: true });
  const docs = f.evidence.filter(e => e.includes('/') || e.includes('.')).map(base);
  if (docs.length) out.push({ label: 'Source documents', value: docs.join(', ') });
  return out;
}

export function briefingFrom(snapshot: CompanySnapshot | null, fleet: FleetOverview | null): { items: BriefingItem[]; watch: WatchItem[] } {
  if (!snapshot) return { items: [], watch: [] };
  const loads = new Map(snapshot.loads.map(l => [l.loadId, l]));
  const driverName = new Map((fleet?.drivers ?? []).map(d => [d.driverId, d.name]));
  const items: BriefingItem[] = [];
  const watch: WatchItem[] = [];
  for (const f of snapshot.findings) {
    if (TONIGHT.includes(f.type)) {
      const load = f.loadIds.length === 1 ? loads.get(f.loadIds[0]!) : undefined;
      const img = f.evidence.find(e => e.startsWith('inbox/') && IMAGE.test(e));
      items.push({
        id: f.id,
        title: f.title,
        amount: f.amount ?? 0,
        amountFormatted: usd(f.amount ?? 0),
        summary: f.detail,
        agent: 'reconciler',
        loadId: f.loadIds[0],
        truckId: load?.truckId ? `Truck ${load.truckId.replace(/^T/, '')}` : undefined,
        driver: load?.driverId ? driverName.get(load.driverId) : undefined,
        evidenceUrl: img ? api.fileUrl(img) : '',
        evidenceType: img ? 'image' : 'comparison',
        evidenceTitle: img ? base(img) : f.evidence.map(base).join(' vs ') || 'Company records',
        confidence: null, // deterministic rule, not an AI guess
        fields: fields(f),
        problemFields: [],
        suggestedAction: ACTION[f.type],
        notes: 'Checked by rule against the paperwork; the amount is computed, not guessed.',
      });
    } else {
      const w = WATCH[f.type] ?? { badge: 'Watch', category: 'billing' as const };
      watch.push({ id: f.id, title: f.title, amountFormatted: f.amount != null ? usd(f.amount) : undefined, summary: f.detail, badge: w.badge, category: w.category });
    }
  }
  return { items, watch };
}

export function kpisFrom(fleet: FleetOverview | null): FleetKPIs | null {
  if (!fleet) return null;
  const k = fleet.kpis;
  return {
    revenuePerMile: k.revenuePerMile ?? 0,
    fuelCostPerMile: k.fuelCostPerMile ?? 0,
    openReceivablesTotal: Math.round(k.openReceivablesTotal),
    overdueReceivablesCount: k.overdueReceivablesCount,
    unbilledDetentionLoss: Math.round(k.unbilledDetentionLoss),
    monthlyIftaMiles: k.monthlyIftaMiles,
  };
}

export function driversFrom(snapshot: CompanySnapshot | null, fleet: FleetOverview | null): DriverSession[] {
  if (!fleet) return [];
  const loads = snapshot?.loads ?? [];
  return fleet.drivers.map(d => {
    const current = loads
      .filter(l => l.driverId === d.driverId)
      .sort((a, b) => String(a.pickup?.appointment ?? '').localeCompare(String(b.pickup?.appointment ?? '')))
      .pop();
    return {
      id: d.driverId,
      name: d.name,
      truckId: d.fleetUnit ? `Truck ${d.fleetUnit}` : d.truckId ?? '—',
      currentLoadId: current?.loadId ?? '—',
      route: current ? `${cityState(current.pickup?.cityStateZip)} → ${cityState(current.delivery?.cityStateZip)}` : 'No active load',
      cardLast4: d.fuelCard ? d.fuelCard.replace(/\D/g, '').slice(-4) : '—',
    };
  });
}

// ---------- intake results -> processed files ----------

const DOC_TYPE: Record<string, string> = {
  rate_confirmation: 'Rate Confirmation', load_tender: 'Load Tender', bol: 'Bill of Lading', pod: 'Proof of Delivery',
  fuel_receipt: 'Fuel Receipt', lumper_receipt: 'Lumper Receipt', dvir: 'Inspection Report (DVIR)', invoice_draft: 'Invoice Draft',
  driver_texts: 'Driver Texts', owner_notes: 'Owner Notes',
};
const route = (r: IngestResult): RouteResult | undefined => (Array.isArray(r.routed) ? r.routed[0] : r.routed);

export function pendingFile(name: string, size?: number): ProcessedFile {
  const kb = size ? Math.round(size / 1024) : 0;
  return {
    id: `FILE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: base(name),
    size: !size ? '—' : kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`,
    type: name.split('.').pop()?.toUpperCase() ?? 'FILE',
    uploadedAt: 'Just now',
    stage: 'extracting',
    isExpanded: false,
  };
}

export function finishedFile(pending: ProcessedFile, r: IngestResult): ProcessedFile {
  if (r.error) return { ...pending, stage: 'needs_review', docType: 'Not processed', keyFields: { Error: r.error } };
  const rt = route(r);
  const filed = !!rt && (rt.loadIds.length > 0 || rt.matchedBy.includes('fleet') || rt.matchedBy.includes('message'));
  return {
    ...pending,
    stage: filed ? 'done' : 'needs_review',
    docType: DOC_TYPE[r.kind ?? ''] ?? (r.kind ?? 'Unknown').replace(/_/g, ' '),
    loadId: rt?.loadIds[0],
    keyFields: {
      'Filed on': rt?.loadIds.length ? rt.loadIds.join(', ') : rt?.matchedBy.includes('fleet') ? 'Fleet fuel ledger' : 'No load matched',
      'Matched by': rt?.matchedBy ?? '—',
      ...(r.cached ? { Source: 'Cached extraction' } : { Source: 'Read by OpenAI vision' }),
    },
  };
}

// ---------- relay feed -> agent messages ----------

const AGENT: Record<string, AgentType> = { 'intake-agent': 'extractor', 'data-server': 'reconciler', 'enrichment-agent': 'enrichment', briefer: 'briefer' };
const agentOf = (id: string): AgentType | null => AGENT[id] ?? (id.startsWith('company:') ? 'reconciler' : null);

export function messagesFrom(feed: RelayMessage[]): AgentMessage[] {
  const out: AgentMessage[] = [];
  for (const m of feed) {
    const from = agentOf(m.from);
    if (!from) continue;
    const p = m.payload as any;
    let text: string = m.topic;
    let priority: AgentMessage['priority'] = 'normal';
    let loadId: string | undefined;
    switch (m.topic) {
      case 'log': text = p?.reading ? `Reading ${base(p.reading)} with OpenAI vision` : 'log'; break;
      case 'doc.extracted': text = `Read ${base(p.doc.file)}: ${String(p.doc.kind).replace(/_/g, ' ')}${p.doc.reference ? ` (ref ${p.doc.reference})` : ''}`; break;
      case 'load.updated': {
        const r = p as RouteResult;
        loadId = r.loadIds[0];
        text = r.loadIds.length ? `Filed ${base(r.file)} on ${r.loadIds.join(', ')}` : r.matchedBy.includes('fleet') ? `Added ${base(r.file)} to the fuel ledger` : `Couldn't match ${base(r.file)} to a load`;
        if (!r.loadIds.length && !r.matchedBy.includes('fleet') && !r.matchedBy.includes('message')) priority = 'urgent';
        break;
      }
      case 'findings.ready': text = `Nightly check: ${p.findings.length} findings, ${usd(p.totalAtRisk)} at risk. Briefer, write the owner's text.`; priority = 'alert'; break;
      case 'enrichment.requested': text = 'Need this week’s diesel price for the briefing'; break;
      case 'enrichment': text = `Diesel ${p.diesel.period}: $${Number(p.diesel.pricePerGallon).toFixed(3)}/gal (${p.diesel.source})`; break;
      case 'briefing.ready': text = `Sent the owner: ${String(p.text).split('\n')[0]}`; priority = 'alert'; break;
    }
    out.push({ id: m.id, timestamp: clock(m.at), from, to: agentOf(m.to) ?? 'all', loadId, text, priority });
  }
  return out.reverse(); // newest first
}

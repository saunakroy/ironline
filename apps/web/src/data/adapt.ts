// Maps backend data onto Prakruti's view types. Money math stays in the backend's rules; this only relabels.
import type { FindingType } from '@fleet/data/shared';
import { api, type CompanySnapshot, type Finding, type FleetOverview, type LoadRecord, type RelayMessage, type RouteResult } from '../lib/backend';
import { DRIVERS as MOCK_DRIVERS } from './mockData';
import type { AgentRelayMessage, DriverProfile, ExtractedDocument, FleetKPIs, LoadItem, PlantedProblem } from '../types';

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const base = (p: string) => p.split('/').pop() ?? p;
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** "4900 Alum Creek Dr, Obetz, OH 43207" -> "Obetz, OH" */
const STREET = /\b(?:Rd|St|Ave|Dr|Blvd|Hwy|Pkwy|Way|Ln|Ct|Pl|Ter|Cir|Road|Street|Avenue|Drive|Boulevard)\.?(?:\s+(?:N|S|E|W|NE|NW|SE|SW))?\b/g;
export function cityState(s?: string | null): string {
  if (!s) return '—';
  const m = [...s.matchAll(/([A-Za-z .'-]+),\s*([A-Z]{2})\b/g)].pop();
  if (!m) return s.split('\n').pop()!.trim();
  // "1850 Williams Rd Columbus" -> "Columbus": keep only what follows the last street word.
  let city = m[1]!.split('\n').pop()!;
  const streets = [...city.matchAll(STREET)];
  if (streets.length) city = city.slice(streets[streets.length - 1]!.index! + streets[streets.length - 1]![0].length);
  return `${city.trim()}, ${m[2]}`;
}

// ---------- findings -> PlantedProblem ----------

const CATEGORY: Record<FindingType, PlantedProblem['category']> = {
  UNBILLED_DETENTION: 'detention',
  RATE_MISMATCH: 'billing',
  MISSING_POD: 'pod',
  UNINVOICED_LUMPER: 'lumper',
  FUEL_CARD_MISMATCH: 'fuel',
  DUPLICATE_RECEIPT: 'fuel',
  AR_PAST_DUE: 'receivables',
  MEDICAL_CARD_EXPIRING: 'compliance',
  READY_TO_INVOICE: 'receivables',
};
/** Money that's lost unless the owner acts tonight. The rest is backlog (cash timing, compliance). */
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
const DOC_BADGE = (file: string) =>
  /ratecon/i.test(file) ? 'Rate Con' : /^INV-|\.docx$/i.test(base(file)) ? 'Invoice' : /receipt/i.test(file) ? 'Receipt' : /\.txt$/i.test(file) ? 'Messages' : /\.eml$/i.test(file) ? 'Tender' : 'Document';

export function problemsFrom(snapshot: CompanySnapshot | null, fleet: FleetOverview | null): PlantedProblem[] {
  if (!snapshot) return [];
  const loads = new Map(snapshot.loads.map(l => [l.loadId, l]));
  const driverName = new Map((fleet?.drivers ?? []).map(d => [d.driverId, d.name]));
  return snapshot.findings.map((f: Finding) => {
    const load = f.loadIds.length === 1 ? loads.get(f.loadIds[0]!) : undefined;
    const files = f.evidence.filter(e => e.includes('/') || e.includes('.'));
    const doc = (file: string) => ({ title: base(file), source: file.startsWith('inbox/') ? file.split('/')[1]! : 'record', highlightText: f.detail, badge: DOC_BADGE(file) });
    return {
      id: f.id,
      title: f.title,
      category: CATEGORY[f.type],
      impactAmount: f.amount ?? undefined,
      impactFormatted: f.amount != null ? usd(f.amount) : 'Compliance',
      isTonightBriefing: TONIGHT.includes(f.type),
      severity: f.severity === 'fraud_or_error' || (f.amount ?? 0) >= 1000 ? 'critical' : f.severity === 'compliance' ? 'info' : 'warning',
      loadId: f.loadIds[0],
      truckId: load?.truckId ? `Truck ${load.truckId.replace(/^T/, '')}` : undefined,
      driver: load?.driverId ? driverName.get(load.driverId) : undefined,
      description: f.detail,
      agentResponsible: 'reconciler',
      suggestedAction: ACTION[f.type],
      evidence:
        files.length >= 2
          ? { type: 'comparison', docA: doc(files[0]!), docB: doc(files[1]!), notes: 'Checked by rule against the paperwork; the amount is computed, not guessed.' }
          : { type: 'document', docA: files[0] ? doc(files[0]) : { title: f.title, source: 'fleet records', highlightText: f.detail, badge: 'Records' }, notes: 'Checked by rule against the company records.' },
    };
  });
}

// ---------- loads ----------

function loadStatus(l: LoadRecord): LoadItem['status'] {
  if (l.invoiceDrafts.length) return 'Invoiced';
  if (l.deliveryReported && !l.pod?.received) return 'Missing Docs';
  if (l.pod?.received || l.delivery?.checkOut) return 'Delivered';
  return 'In Transit';
}

export function loadsFrom(snapshot: CompanySnapshot | null, fleet: FleetOverview | null): LoadItem[] {
  if (!snapshot) return [];
  const flagged = new Set(snapshot.findings.flatMap(f => f.loadIds));
  const driverName = new Map((fleet?.drivers ?? []).map(d => [d.driverId, d.name]));
  return snapshot.loads.map(l => {
    const status = loadStatus(l);
    const last = l.documents.map(d => d.addedAt).sort().pop();
    return {
      id: l.loadId,
      broker: l.billToName ?? l.customerReference,
      origin: cityState(l.pickup?.cityStateZip),
      destination: cityState(l.delivery?.cityStateZip),
      truck: l.truckId ? `Truck ${l.truckId.replace(/^T/, '')}` : '—',
      driver: (l.driverId && driverName.get(l.driverId)) || '—',
      status,
      agreedRate: l.rate ? l.rate.linehaul + l.rate.fuelSurcharge : 0,
      invoicedRate: l.invoiceDrafts[0]?.total,
      documentsCount: l.documents.length,
      hasDiscrepancy: flagged.has(l.loadId),
      durableActorState: {
        state: status === 'Missing Docs' ? 'Waiting_POD' : status === 'Delivered' ? 'Ready_Invoice' : 'Active',
        lastHeartbeat: last ? clock(last) : '—',
        scheduledReconcile: snapshot.nextCheckAt ? clock(snapshot.nextCheckAt) : 'on demand',
      },
    };
  });
}

// ---------- drivers ----------

export function driversFrom(snapshot: CompanySnapshot | null, fleet: FleetOverview | null): DriverProfile[] {
  if (!fleet) return [];
  const loads = snapshot?.loads ?? [];
  return fleet.drivers.map((d, i) => {
    const mine = loads.filter(l => l.driverId === d.driverId).sort((a, b) => String(a.pickup?.appointment ?? '').localeCompare(String(b.pickup?.appointment ?? '')));
    const current = mine[mine.length - 1];
    const status: DriverProfile['status'] = !current
      ? 'Off-Duty'
      : current.pickup?.checkIn && !current.pickup.checkOut
        ? 'Loading / Dock'
        : current.delivery?.checkOut
          ? 'Resting'
          : 'Driving';
    return {
      id: d.driverId,
      name: d.name,
      truckId: d.fleetUnit ? `Truck ${d.fleetUnit}` : d.truckId ?? '—',
      // Photos are design placeholders only; everything else is the driver's real record.
      avatar: MOCK_DRIVERS[i % MOCK_DRIVERS.length]!.avatar,
      status,
      currentLoadId: current?.loadId,
      todayMiles: current?.loadedMiles ?? 0,
      phone: d.phone,
      fuelCardNumber: d.fuelCard ? `Card #${d.fuelCard.replace(/\D/g, '').slice(-4)}` : '—',
      recentUploadsCount: mine.reduce((n, l) => n + l.documents.length, 0),
    };
  });
}

// ---------- KPIs ----------

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

// ---------- documents (trucker's recent uploads) ----------

const CLASS: Record<string, ExtractedDocument['docClassification']> = {
  rate_confirmation: 'Rate Con', load_tender: 'Rate Con', bol: 'BOL', pod: 'POD', fuel_receipt: 'Fuel Receipt',
  lumper_receipt: 'Lumper', dvir: 'DVIR', invoice_draft: 'Invoice',
};
const fileType = (f: string): ExtractedDocument['fileType'] => {
  const ext = f.split('.').pop()?.toLowerCase();
  return ext === 'pdf' || ext === 'png' || ext === 'docx' || ext === 'eml' || ext === 'txt' ? ext : 'jpg';
};

export function documentsFrom(snapshot: CompanySnapshot | null, fleet: FleetOverview | null): ExtractedDocument[] {
  if (!snapshot) return [];
  const driverName = new Map((fleet?.drivers ?? []).map(d => [d.driverId, d.name]));
  const rows: ExtractedDocument[] = [];
  for (const l of snapshot.loads)
    for (const d of l.documents)
      if (CLASS[d.kind])
        rows.push({
          id: `${l.loadId}:${d.file}`,
          filename: base(d.file),
          fileType: fileType(d.file),
          docClassification: CLASS[d.kind]!,
          confidenceScore: 100,
          needsReview: false,
          uploadedAt: clock(d.addedAt),
          loadRef: l.loadId,
          driverName: l.driverId ? driverName.get(l.driverId) : undefined,
          extractedFields: { Load: l.loadId, Reference: l.customerReference, Type: CLASS[d.kind]! },
          sourceThumbnail: /\.(jpe?g|png)$/i.test(d.file) && d.file.startsWith('inbox/') ? api.fileUrl(d.file) : undefined,
        });
  for (const u of snapshot.unmatched)
    if (CLASS[u.kind])
      rows.push({
        id: `unmatched:${u.file}`, filename: base(u.file), fileType: fileType(u.file), docClassification: CLASS[u.kind]!,
        confidenceScore: 100, needsReview: true, uploadedAt: clock(u.addedAt), extractedFields: { Status: 'No load matched' },
      });
  return rows.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function documentFromUpload(r: { file: string; kind?: string; routed?: RouteResult | RouteResult[]; error?: string }, driver?: string): ExtractedDocument {
  const route = Array.isArray(r.routed) ? r.routed[0] : r.routed;
  const matched = !!route && (route.loadIds.length > 0 || route.matchedBy.includes('fleet'));
  return {
    id: `upload:${r.file}:${Date.now()}`,
    filename: r.file,
    fileType: fileType(r.file),
    docClassification: CLASS[r.kind ?? ''] ?? 'BOL',
    confidenceScore: r.error ? 0 : 100,
    needsReview: !!r.error || !matched,
    uploadedAt: 'Just now',
    loadRef: route?.loadIds[0],
    driverName: driver,
    extractedFields: r.error
      ? { Error: r.error }
      : { Type: (r.kind ?? 'unknown').replace(/_/g, ' '), 'Filed on': route?.loadIds.join(', ') || (route?.matchedBy.includes('fleet') ? 'Fleet fuel ledger' : 'No load matched'), 'Matched by': route?.matchedBy ?? '—' },
  };
}

// ---------- relay feed -> Live Activity ----------

const AGENT: Record<string, AgentRelayMessage['fromAgent']> = {
  'intake-agent': 'extractor', 'data-server': 'reconciler', 'enrichment-agent': 'enrichment', briefer: 'briefer',
};
const agentOf = (id: string) => AGENT[id] ?? (id.startsWith('company:') ? 'reconciler' : null);

export function messagesFrom(feed: RelayMessage[]): AgentRelayMessage[] {
  const out: AgentRelayMessage[] = [];
  for (const m of feed) {
    const from = agentOf(m.from);
    if (!from) continue;
    const p = m.payload as any;
    let text = m.topic as string;
    let priority: AgentRelayMessage['priority'] = 'normal';
    let loadRef: string | undefined;
    switch (m.topic) {
      case 'log': text = p?.reading ? `Reading ${base(p.reading)} with OpenAI vision` : 'log'; break;
      case 'doc.extracted': text = `Read ${base(p.doc.file)}: ${String(p.doc.kind).replace(/_/g, ' ')}${p.doc.reference ? ` (ref ${p.doc.reference})` : ''}`; break;
      case 'load.updated': {
        const r = p as RouteResult;
        loadRef = r.loadIds[0];
        text = r.loadIds.length ? `Filed ${base(r.file)} on ${r.loadIds.join(', ')}` : r.matchedBy.includes('fleet') ? `Added ${base(r.file)} to the fuel ledger` : `Couldn't match ${base(r.file)} to a load`;
        if (!r.loadIds.length && !r.matchedBy.includes('fleet') && !r.matchedBy.includes('message')) priority = 'urgent';
        break;
      }
      case 'findings.ready': text = `Nightly check: ${p.findings.length} findings, ${usd(p.totalAtRisk)} at risk`; priority = 'alert'; break;
      case 'enrichment.requested': text = 'Asked for this week’s diesel price'; break;
      case 'enrichment': text = `Diesel ${p.diesel.period}: $${Number(p.diesel.pricePerGallon).toFixed(3)}/gal (${p.diesel.source})`; break;
      case 'briefing.ready': text = String(p.text).split('\n')[0] ?? 'Briefing sent'; priority = 'alert'; break;
    }
    const to = agentOf(m.to) ?? 'all';
    out.push({ id: m.id, timestamp: clock(m.at), fromAgent: from, toAgent: to, loadRef, message: text, humanSummary: text, priority });
  }
  return out.reverse(); // newest first, like the mock feed
}

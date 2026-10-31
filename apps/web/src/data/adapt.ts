// Maps backend data (rule findings, relay messages, routed docs) onto the UI's view types.
import { totalAtRisk, type Finding, type FindingType, type RelayMessage } from '@fleet/data/shared'
import { api, type CompanySnapshot, type RouteResult } from '../lib/backend'
import { formatUsd } from '../lib/format'
import type { AgentMessage } from './agents'
import { briefingItems as mockBriefing, totalFlaggedAmount as mockTotal, watchItems as mockWatch } from './briefing'
import type { AgentName, BriefingItem, ExtractedField, ProblemCategory, WatchItem } from './types'

const CATEGORY: Partial<Record<FindingType, ProblemCategory>> = {
  FUEL_CARD_MISMATCH: 'fuel',
  DUPLICATE_RECEIPT: 'fuel',
  RATE_MISMATCH: 'rate',
  UNINVOICED_LUMPER: 'lumper',
  UNBILLED_DETENTION: 'detention',
}

const IMAGE = /\.(jpe?g|png|gif|webp|svg)$/i
const base = (p: string) => p.split('/').pop() ?? p

/** First evidence file the drawer can render as an image, served from the dataset. */
function evidenceImage(f: Finding): string {
  const img = f.evidence.find(e => e.startsWith('inbox/') && IMAGE.test(e))
  return img ? api.fileUrl(img) : ''
}

function fieldsFor(f: Finding): ExtractedField[] {
  const fields: ExtractedField[] = []
  if (f.loadIds.length) fields.push({ label: f.loadIds.length > 1 ? 'Loads' : 'Load', value: f.loadIds.join(', '), status: 'ok' })
  fields.push({ label: 'What we found', value: f.detail, status: 'flagged' })
  if (f.amount != null) fields.push({ label: 'Amount', value: formatUsd(f.amount), status: 'flagged' })
  const docs = f.evidence.filter(e => e.includes('/') || e.includes('.')).map(base)
  if (docs.length) fields.push({ label: 'Source documents', value: docs.join(', '), status: 'ok' })
  return fields
}

export type LiveBriefing = { items: BriefingItem[]; watch: WatchItem[]; total: number; checkedAt: string | null; text: string | null }

export function briefingFrom(snapshot: CompanySnapshot | null, mock: boolean): LiveBriefing {
  if (mock) return { items: mockBriefing, watch: mockWatch, total: mockTotal, checkedAt: null, text: null }
  const findings = snapshot?.findings ?? []
  const items: BriefingItem[] = []
  const watch: WatchItem[] = []
  for (const f of findings) {
    const category = CATEGORY[f.type]
    if (category) {
      items.push({
        id: f.id,
        category,
        title: f.title,
        amount: f.amount ?? 0,
        summary: f.detail,
        agent: 'Auditor',
        loadId: f.loadIds[0] ?? 'fleet',
        evidenceUrl: evidenceImage(f),
        fields: fieldsFor(f),
        severity: (f.amount ?? 0) >= 500 ? 'critical' : 'warning',
      })
    } else {
      watch.push({
        id: f.id,
        title: f.title,
        detail: f.detail,
        severity: f.severity === 'compliance' ? 'info' : 'warning',
        amount: f.amount ?? undefined,
      })
    }
  }
  return { items, watch, total: totalAtRisk(findings), checkedAt: snapshot?.lastCheckAt ?? null, text: snapshot?.briefing?.text ?? null }
}

// ---------- relay feed ----------

const WHO: Record<string, AgentName> = {
  'intake-agent': 'Intake Agent',
  'data-server': 'Data Server',
  'enrichment-agent': 'Enrichment Agent',
  briefer: 'Briefer',
}
const who = (id: string): AgentName | null => WHO[id] ?? (id.startsWith('company:') ? 'Data Server' : null)
const label = (id: string) => who(id) ?? (id.startsWith('owner:') ? 'Owner' : id === 'ui' ? 'Owner app' : id === 'openai' ? 'OpenAI' : id)

function describe(m: RelayMessage): { text: string; loadId?: string } {
  const p = m.payload as any
  switch (m.topic) {
    case 'doc.extracted':
      return { text: `Read ${base(p.doc.file)} → ${String(p.doc.kind).replace(/_/g, ' ')}${p.doc.reference ? ` (ref ${p.doc.reference})` : ''}${p.cached ? ' · cached' : ''}` }
    case 'load.updated': {
      const r = p as RouteResult
      return { text: r.loadIds.length ? `Filed ${base(r.file)} on ${r.loadIds.join(', ')} — ${r.matchedBy}` : `Couldn't match ${base(r.file)} to a load — ${r.matchedBy}`, loadId: r.loadIds[0] }
    }
    case 'findings.ready':
      return { text: `Nightly check for ${p.asOf}: ${p.findings.length} findings, ${formatUsd(p.totalAtRisk)} at risk. Please write the owner's briefing.` }
    case 'enrichment.requested':
      return { text: `Need outside data for the ${p.asOf} briefing (diesel price).` }
    case 'enrichment':
      return { text: `DOE diesel ${p.diesel.period}: $${Number(p.diesel.pricePerGallon).toFixed(3)}/gal (${p.diesel.source}). Implied FSC $${p.impliedFscPerMile}/mi.` }
    case 'briefing.ready':
      return { text: String(p.text).split('\n')[0] ?? 'Briefing ready' }
    default:
      return { text: p?.reading ? `Reading ${base(p.reading)}…` : `${m.topic}` }
  }
}

export function agentMessagesFrom(feed: RelayMessage[]): AgentMessage[] {
  return feed
    .filter(m => who(m.from))
    .map(m => {
      const d = describe(m)
      return {
        id: m.id,
        from: who(m.from)!,
        to: label(m.to),
        message: d.text,
        loadId: d.loadId,
        time: new Date(m.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
    })
}

// ---------- intake queue ----------

export function routedFields(r: RouteResult | undefined, kind: string | undefined): ExtractedField[] {
  const fields: ExtractedField[] = [{ label: 'Detected type', value: (kind ?? 'unknown').replace(/_/g, ' '), status: 'ok' }]
  if (!r) return fields
  fields.push({ label: 'Filed on', value: r.loadIds.length ? r.loadIds.join(', ') : 'No load matched', status: r.loadIds.length || r.matchedBy.includes('fleet') ? 'ok' : 'flagged' })
  fields.push({ label: 'Matched by', value: r.matchedBy, status: 'ok' })
  if (r.note) fields.push({ label: 'Note', value: r.note, status: 'ok' })
  return fields
}

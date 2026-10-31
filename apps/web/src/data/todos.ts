import type { BriefingItem, ExtractedField, WatchItem } from './types'

export type TodoPriority = 'high' | 'medium' | 'low'

export interface TodoItem {
  id: string
  title: string
  amount?: number
  priority: TodoPriority
  due: string
  loadId?: string
  evidenceUrl?: string
  confidence?: number
  fields?: ExtractedField[]
}

const BRIEFING_TASK_TITLE: Record<string, string> = {
  'p8-duplicate-fuel': 'Remove duplicate fuel receipt',
  'p7-fuel-card-two-states': 'Call the fuel card provider about Truck 102',
  'p3-rate-mismatch': 'Fix invoice to $1,680 and resend',
  'p6-lumper-not-invoiced': 'Add $175 lumper to invoice',
  'p1-unbilled-detention': 'Bill $162.50 detention to the broker',
}

const BRIEFING_TASK_PRIORITY: Record<string, TodoPriority> = {
  'p8-duplicate-fuel': 'high',
  'p7-fuel-card-two-states': 'high',
  'p3-rate-mismatch': 'medium',
  'p6-lumper-not-invoiced': 'medium',
  'p1-unbilled-detention': 'low',
}

const BRIEFING_TASK_DUE: Record<string, string> = {
  'p8-duplicate-fuel': 'Tonight',
  'p7-fuel-card-two-states': 'Tonight',
  'p3-rate-mismatch': 'This week',
  'p6-lumper-not-invoiced': 'This week',
  'p1-unbilled-detention': 'This week',
}

const WATCH_TASK: Record<string, { title: string; priority: TodoPriority; due: string; evidenceUrl?: string }> = {
  'pod-not-invoiced': {
    title: 'Upload the missing POD for 4 delivered loads',
    priority: 'high',
    due: 'This week',
    evidenceUrl: '/evidence/p1-detention-log.svg',
  },
  'summit-lane-aging': {
    title: 'Chase the 41-day-old Summit Lane invoice',
    priority: 'medium',
    due: 'This week',
    evidenceUrl: '/evidence/p3-rate-con.svg',
  },
  'dot-medical-card': {
    title: "Renew the driver's DOT medical card before it expires",
    priority: 'high',
    due: 'In 12 days',
    evidenceUrl: '/evidence/p1-driver-text.svg',
  },
}

// Live findings have backend ids; fall back to rules by severity when a mock-specific mapping is missing.
export function buildTodos(briefingItems: BriefingItem[], watchItems: WatchItem[]): TodoItem[] {
  const fromBriefing: TodoItem[] = briefingItems.map((item) => ({
    id: item.id,
    title: BRIEFING_TASK_TITLE[item.id] ? `${BRIEFING_TASK_TITLE[item.id]} (${item.loadId})` : item.title,
    amount: item.amount,
    priority: BRIEFING_TASK_PRIORITY[item.id] ?? (item.severity === 'critical' ? 'high' : 'medium'),
    due: BRIEFING_TASK_DUE[item.id] ?? (item.severity === 'critical' ? 'Tonight' : 'This week'),
    loadId: item.loadId,
    evidenceUrl: item.evidenceUrl,
    confidence: item.confidence,
    fields: item.fields,
  }))

  const fromWatch: TodoItem[] = watchItems.map((item) => {
    const meta = WATCH_TASK[item.id]
    return {
      id: item.id,
      title: meta?.title ?? item.title,
      amount: item.amount,
      priority: meta?.priority ?? (item.severity === 'warning' ? 'high' : 'medium'),
      due: meta?.due ?? 'This week',
      evidenceUrl: meta?.evidenceUrl,
      confidence: meta ? 0.9 : undefined,
      fields: [{ label: 'Detail', value: item.detail, status: 'flagged' }],
    }
  })

  return [...fromBriefing, ...fromWatch]
}

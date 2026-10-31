import { briefingItems, watchItems } from './briefing'
import type { ExtractedField } from './types'

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

export function buildTodos(): TodoItem[] {
  const fromBriefing: TodoItem[] = briefingItems.map((item) => ({
    id: item.id,
    title: `${BRIEFING_TASK_TITLE[item.id]} (${item.loadId})`,
    amount: item.amount,
    priority: BRIEFING_TASK_PRIORITY[item.id],
    due: BRIEFING_TASK_DUE[item.id],
    loadId: item.loadId,
    evidenceUrl: item.evidenceUrl,
    confidence: item.confidence,
    fields: item.fields,
  }))

  const fromWatch: TodoItem[] = watchItems.map((item) => {
    const meta = WATCH_TASK[item.id]
    return {
      id: item.id,
      title: meta.title,
      amount: item.amount,
      priority: meta.priority,
      due: meta.due,
      evidenceUrl: meta.evidenceUrl,
      confidence: 0.9,
      fields: [{ label: 'Detail', value: item.detail, status: 'flagged' }],
    }
  })

  return [...fromBriefing, ...fromWatch]
}

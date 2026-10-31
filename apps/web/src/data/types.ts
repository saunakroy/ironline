export type AgentName =
  | 'Fuel Agent'
  | 'Billing Agent'
  | 'Rate Agent'
  | 'Detention Agent'
  | 'Watchdog'

export type FieldStatus = 'ok' | 'flagged'

export interface ExtractedField {
  label: string
  value: string
  status: FieldStatus
}

export type BriefingSeverity = 'critical' | 'warning'
export type ProblemCategory = 'fuel' | 'rate' | 'lumper' | 'detention'

export interface BriefingItem {
  id: string
  title: string
  amount: number
  summary: string
  agent: AgentName
  loadId: string
  evidenceUrl: string
  confidence: number
  fields: ExtractedField[]
  severity: BriefingSeverity
  category: ProblemCategory
}

export type WatchSeverity = 'warning' | 'info'

export interface WatchItem {
  id: string
  title: string
  detail: string
  severity: WatchSeverity
  amount?: number
}

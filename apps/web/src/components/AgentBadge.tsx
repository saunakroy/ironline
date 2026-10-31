import type { AgentName } from '../data/types'

const COLORED_STYLES: Record<AgentName, string> = {
  'Fuel Agent': 'bg-warning-soft text-warning-text ring-warning/25',
  'Billing Agent': 'bg-info-soft text-info ring-info/25',
  'Rate Agent': 'bg-accent-soft text-accent-text ring-accent/25',
  'Detention Agent': 'bg-success-soft text-success-text ring-success/25',
  Watchdog: 'bg-critical-soft text-critical-text ring-critical/25',
  'Intake Agent': 'bg-info-soft text-info ring-info/25',
  'Enrichment Agent': 'bg-warning-soft text-warning-text ring-warning/25',
  Briefer: 'bg-accent-soft text-accent-text ring-accent/25',
  'Data Server': 'bg-success-soft text-success-text ring-success/25',
  Auditor: 'bg-critical-soft text-critical-text ring-critical/25',
}

const DOT_COLOR: Record<AgentName, string> = {
  'Fuel Agent': 'bg-warning',
  'Billing Agent': 'bg-info',
  'Rate Agent': 'bg-accent',
  'Detention Agent': 'bg-success',
  Watchdog: 'bg-critical',
  'Intake Agent': 'bg-info',
  'Enrichment Agent': 'bg-warning',
  Briefer: 'bg-accent',
  'Data Server': 'bg-success',
  Auditor: 'bg-critical',
}

export default function AgentBadge({
  agent,
  tone = 'neutral',
  live = false,
}: {
  agent: AgentName
  tone?: 'neutral' | 'colored'
  live?: boolean
}) {
  const style = tone === 'colored' ? COLORED_STYLES[agent] : 'bg-surface-2 text-text-secondary ring-border'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap ${style}`}>
      {live && (
        <span className="relative flex h-1.5 w-1.5 flex-none">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${DOT_COLOR[agent]}`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOT_COLOR[agent]}`} />
        </span>
      )}
      {agent}
    </span>
  )
}

import type { AgentName } from '../data/types'

const AGENT_STYLES: Record<AgentName, string> = {
  'Fuel Agent': 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  'Billing Agent': 'bg-sky-500/10 text-sky-400 ring-sky-500/30',
  'Rate Agent': 'bg-violet-500/10 text-violet-400 ring-violet-500/30',
  'Detention Agent': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
  Watchdog: 'bg-rose-500/10 text-rose-400 ring-rose-500/30',
}

export default function AgentBadge({ agent }: { agent: AgentName }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap ${AGENT_STYLES[agent]}`}
    >
      {agent}
    </span>
  )
}

import type { AgentName } from '../data/types'

const COLORED_STYLES: Record<AgentName, string> = {
  'Fuel Agent': 'bg-amber-400/10 text-amber-200 ring-amber-400/25',
  'Billing Agent': 'bg-sky-400/10 text-sky-200 ring-sky-400/25',
  'Rate Agent': 'bg-orange-400/10 text-orange-200 ring-orange-400/25',
  'Detention Agent': 'bg-teal-400/10 text-teal-200 ring-teal-400/25',
  Watchdog: 'bg-rose-400/10 text-rose-200 ring-rose-400/25',
}

const DOT_COLOR: Record<AgentName, string> = {
  'Fuel Agent': 'bg-amber-300',
  'Billing Agent': 'bg-sky-300',
  'Rate Agent': 'bg-orange-300',
  'Detention Agent': 'bg-teal-300',
  Watchdog: 'bg-rose-300',
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
  const style =
    tone === 'colored'
      ? COLORED_STYLES[agent]
      : 'bg-slate-500/10 text-slate-300 ring-slate-500/20'

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

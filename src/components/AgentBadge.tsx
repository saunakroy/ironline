import type { AgentName } from '../data/types'

export default function AgentBadge({ agent }: { agent: AgentName }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap">
      {agent}
    </span>
  )
}

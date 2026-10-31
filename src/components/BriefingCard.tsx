import type { BriefingItem } from '../data/types'
import AgentBadge from './AgentBadge'

const formatUsd = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function BriefingCard({
  item,
  rank,
  onViewEvidence,
}: {
  item: BriefingItem
  rank: number
  onViewEvidence: (item: BriefingItem) => void
}) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
            {rank}
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-white leading-snug">{item.title}</h3>
            <p className="mt-1 text-sm text-white/60 leading-snug">{item.summary}</p>
          </div>
        </div>
        <div className="flex-none text-right">
          <div className="text-xl font-bold tabular-nums text-red-400">{formatUsd(item.amount)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AgentBadge agent={item.agent} />
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
            Load {item.loadId}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onViewEvidence(item)}
          className="flex-none text-[13px] font-semibold text-violet-400 hover:text-violet-300 active:text-violet-300"
        >
          View evidence &rarr;
        </button>
      </div>
    </li>
  )
}

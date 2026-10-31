import { motion } from 'framer-motion'
import type { BriefingItem } from '../data/types'
import { formatUsd } from '../lib/format'
import { CATEGORY_ICON } from '../lib/icons'
import AgentBadge from './AgentBadge'

const AMOUNT_COLOR: Record<BriefingItem['severity'], string> = {
  critical: 'text-rose-300',
  warning: 'text-amber-200/90',
}

const RANK_DOT: Record<BriefingItem['severity'], string> = {
  critical: 'bg-rose-400/20 text-rose-200',
  warning: 'bg-white/10 text-white/60',
}

export const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

export default function BriefingCard({
  item,
  rank,
  onViewEvidence,
}: {
  item: BriefingItem
  rank: number
  onViewEvidence: (item: BriefingItem) => void
}) {
  const Icon = CATEGORY_ICON[item.category]

  return (
    <motion.li
      variants={cardVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition-shadow duration-300 hover:border-orange-400/20 hover:shadow-[0_8px_30px_-8px_rgba(251,146,60,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${RANK_DOT[item.severity]}`}
          >
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <Icon size={14} className="text-white/35" strokeWidth={1.8} />
              <h3 className="text-[15px] font-semibold text-white/90 leading-snug">{item.title}</h3>
            </div>
            <p className="mt-1 text-sm text-white/50 leading-snug">{item.summary}</p>
          </div>
        </div>
        <div className="flex-none text-right">
          <div className={`text-xl font-bold tabular-nums ${AMOUNT_COLOR[item.severity]}`}>
            {formatUsd(item.amount)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AgentBadge agent={item.agent} />
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/40">
            Load {item.loadId}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onViewEvidence(item)}
          className="flex-none text-[13px] font-semibold text-orange-300 hover:text-orange-200 active:text-orange-200"
        >
          View evidence &rarr;
        </button>
      </div>
    </motion.li>
  )
}

import { motion } from 'framer-motion'
import type { BriefingItem } from '../data/types'
import { formatUsd } from '../lib/format'
import { CATEGORY_ICON } from '../lib/icons'
import AgentBadge from './AgentBadge'

const AMOUNT_COLOR: Record<BriefingItem['severity'], string> = {
  critical: 'text-critical-text',
  warning: 'text-warning-text',
}

const RANK_DOT: Record<BriefingItem['severity'], string> = {
  critical: 'bg-critical-soft text-critical-text',
  warning: 'bg-surface-2 text-text-secondary',
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
      className="rounded-2xl border border-border bg-surface p-4 transition-shadow duration-300 hover:border-accent/30 hover:shadow-[0_8px_30px_-8px_var(--color-accent-soft)]"
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
              <Icon size={14} className="text-text-faint" strokeWidth={1.8} />
              <h3 className="text-[15px] font-semibold text-text leading-snug">{item.title}</h3>
            </div>
            <p className="mt-1 text-sm text-text-muted leading-snug">{item.summary}</p>
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
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-text-muted">
            Load {item.loadId}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onViewEvidence(item)}
          className="flex-none text-[13px] font-semibold text-accent-text hover:text-accent"
        >
          View evidence &rarr;
        </button>
      </div>
    </motion.li>
  )
}

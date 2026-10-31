import { motion, useReducedMotion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { useState } from 'react'
import { briefingItems, totalFlaggedAmount, watchItems } from '../data/briefing'
import type { BriefingItem } from '../data/types'
import { formatUsd } from '../lib/format'
import { useCountUp } from '../lib/useCountUp'
import BriefingCard from './BriefingCard'
import EvidenceDrawer, { type EvidenceDrawerProps } from './EvidenceDrawer'
import WatchList from './WatchList'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export default function HomeScreen({ onGoUpload }: { onGoUpload: () => void }) {
  const reduced = useReducedMotion()
  const [drawer, setDrawer] = useState<Omit<EvidenceDrawerProps, 'onClose'> | null>(null)
  const [showMore, setShowMore] = useState(false)

  const roundedTotal = Math.round(totalFlaggedAmount)
  const animatedTotal = useCountUp(roundedTotal, 1000, !!reduced)

  const criticalItems = briefingItems.filter((item) => item.severity === 'critical')
  const warningItems = briefingItems.filter((item) => item.severity === 'warning')

  const openItemEvidence = (item: BriefingItem) =>
    setDrawer({
      title: item.title,
      tag: `Load ${item.loadId}`,
      evidenceUrl: item.evidenceUrl,
      confidence: item.confidence,
      fields: item.fields,
      footer: { label: 'Flagged amount', value: formatUsd(item.amount) },
    })

  return (
    <div className="px-4 pb-10 pt-6 sm:px-6">
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-accent-soft blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-text-muted">Tonight&apos;s briefing &middot; Oct 31</p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight text-text sm:text-3xl">
              {briefingItems.length} things need your attention tonight
            </h1>
          </div>
          <button
            type="button"
            onClick={onGoUpload}
            className="mt-1 flex flex-none items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-[12.5px] font-semibold text-text-secondary hover:text-text sm:px-3.5"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Upload paperwork</span>
          </button>
        </div>
        <div className="relative mt-3 inline-flex items-baseline gap-2 rounded-2xl bg-surface px-4 py-2.5 ring-1 ring-inset ring-border">
          <span className="text-3xl font-extrabold tabular-nums text-text">
            ${animatedTotal.toLocaleString('en-US')}
          </span>
          <span className="text-sm font-medium text-text-muted">flagged</span>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-critical-text">Needs you now</h2>
        <motion.ul variants={listVariants} initial="hidden" animate="show" className="mt-3 space-y-3">
          {criticalItems.map((item, i) => (
            <BriefingCard key={item.id} item={item} rank={i + 1} onViewEvidence={openItemEvidence} />
          ))}
        </motion.ul>
      </section>

      <section className="mt-5">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-text-secondary">
            {warningItems.length} more flagged, lower priority
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`text-text-muted transition-transform ${showMore ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showMore && (
          <motion.ul variants={listVariants} initial="hidden" animate="show" className="mt-3 space-y-3">
            {warningItems.map((item, i) => (
              <BriefingCard
                key={item.id}
                item={item}
                rank={criticalItems.length + i + 1}
                onViewEvidence={openItemEvidence}
              />
            ))}
          </motion.ul>
        )}
      </section>

      <WatchList items={watchItems} />

      {drawer && <EvidenceDrawer {...drawer} onClose={() => setDrawer(null)} />}
    </div>
  )
}

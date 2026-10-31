import { motion, useReducedMotion } from 'framer-motion'
import { MessageSquareText, PlayCircle, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { briefingFrom } from '../data/adapt'
import type { BriefingItem } from '../data/types'
import { AS_OF } from '../lib/backend'
import { useLive } from '../lib/live'
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
  const { snapshot, status, checking, runCheck, error } = useLive()
  const live = useMemo(() => briefingFrom(snapshot, status === 'mock'), [snapshot, status])
  const { items: briefingItems, watch: watchItems, total: totalFlaggedAmount } = live
  const asOfLabel = new Date(`${AS_OF}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const noCheckYet = status !== 'mock' && !live.checkedAt

  const roundedTotal = Math.round(totalFlaggedAmount)
  const animatedTotal = useCountUp(roundedTotal, 1000, !!reduced)

  const criticalItems = briefingItems.filter((item) => item.severity === 'critical')
  const warningItems = briefingItems.filter((item) => item.severity === 'warning')

  const openItemEvidence = (item: BriefingItem) =>
    setDrawer({
      title: item.title,
      tag: item.loadId === 'fleet' ? 'Fleet-wide' : `Load ${item.loadId}`,
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
            <p className="text-[13px] font-medium text-text-muted">Tonight&apos;s briefing &middot; {asOfLabel}</p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight text-text sm:text-3xl">
              {noCheckYet ? 'No check has run yet tonight' : `${briefingItems.length + watchItems.length} things need your attention tonight`}
            </h1>
          </div>
          <div className="mt-1 flex flex-none items-center gap-2">
          {status !== 'mock' && (
            <button
              type="button"
              onClick={() => void runCheck()}
              disabled={checking || status !== 'live'}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:px-3.5"
            >
              <PlayCircle size={14} />
              <span>{checking ? 'Checking…' : "Run tonight's check"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onGoUpload}
            className="mt-1 flex flex-none items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-[12.5px] font-semibold text-text-secondary hover:text-text sm:px-3.5"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Upload paperwork</span>
          </button>
          </div>
        </div>
        {error && <p className="relative mt-2 text-[12.5px] text-critical-text">{error}</p>}
        <div className="relative mt-3 inline-flex items-baseline gap-2 rounded-2xl bg-surface px-4 py-2.5 ring-1 ring-inset ring-border">
          <span className="text-3xl font-extrabold tabular-nums text-text">
            ${animatedTotal.toLocaleString('en-US')}
          </span>
          <span className="text-sm font-medium text-text-muted">at risk</span>
        </div>
        {live.text && (
          <details className="relative mt-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <summary className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-text-secondary">
              <MessageSquareText size={14} /> The text the owner gets
            </summary>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-[13px] leading-snug text-text-secondary">{live.text}</pre>
          </details>
        )}
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

import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { briefingItems, totalFlaggedAmount, watchItems } from '../data/briefing'
import type { BriefingItem } from '../data/types'
import { useCountUp } from '../lib/useCountUp'
import BriefingCard from './BriefingCard'
import EvidenceDrawer, { type EvidenceDrawerProps } from './EvidenceDrawer'
import IntakeSection from './IntakeSection'
import WatchList from './WatchList'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export default function HomeScreen() {
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
      footer: { label: 'Flagged amount', value: item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) },
    })

  return (
    <div className="px-4 pb-10 pt-6 sm:px-6">
      <IntakeSection onOpenEvidence={setDrawer} />

      <header className="relative mt-9 overflow-hidden">
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl"
        />
        <p className="relative text-[13px] font-medium text-white/40">Tonight&apos;s briefing &middot; Oct 31</p>
        <h1 className="relative mt-1 text-[26px] font-bold leading-tight text-white sm:text-3xl">
          {briefingItems.length} things need your attention tonight
        </h1>
        <div className="relative mt-3 inline-flex items-baseline gap-2 rounded-2xl bg-white/[0.04] px-4 py-2.5 ring-1 ring-inset ring-white/10">
          <span className="text-3xl font-extrabold tabular-nums text-white">
            ${animatedTotal.toLocaleString('en-US')}
          </span>
          <span className="text-sm font-medium text-white/50">flagged</span>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-rose-200/80">Needs you now</h2>
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="mt-3 space-y-3"
        >
          {criticalItems.map((item, i) => (
            <BriefingCard key={item.id} item={item} rank={i + 1} onViewEvidence={openItemEvidence} />
          ))}
        </motion.ul>
      </section>

      <section className="mt-5">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-white/70">
            {warningItems.length} more flagged, lower priority
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`text-white/40 transition-transform ${showMore ? 'rotate-180' : ''}`}
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

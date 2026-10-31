import { useState } from 'react'
import { briefingItems, totalFlaggedAmount, watchItems } from '../data/briefing'
import type { BriefingItem } from '../data/types'
import BriefingCard from './BriefingCard'
import EvidenceDrawer from './EvidenceDrawer'
import WatchList from './WatchList'

export default function BriefingScreen() {
  const [activeItem, setActiveItem] = useState<BriefingItem | null>(null)
  const [showMore, setShowMore] = useState(false)
  const roundedTotal = Math.round(totalFlaggedAmount)

  const criticalItems = briefingItems.filter((item) => item.severity === 'critical')
  const warningItems = briefingItems.filter((item) => item.severity === 'warning')

  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-white/40">Tonight&apos;s briefing &middot; Oct 31</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight text-white sm:text-3xl">
          {briefingItems.length} things need your attention tonight
        </h1>
        <div className="mt-3 inline-flex items-baseline gap-2 rounded-2xl bg-white/[0.04] px-4 py-2.5 ring-1 ring-inset ring-white/10">
          <span className="text-3xl font-extrabold tabular-nums text-white">
            ${roundedTotal.toLocaleString('en-US')}
          </span>
          <span className="text-sm font-medium text-white/50">flagged</span>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-rose-200/80">Needs you now</h2>
        <ul className="mt-3 space-y-3">
          {criticalItems.map((item, i) => (
            <BriefingCard key={item.id} item={item} rank={i + 1} onViewEvidence={setActiveItem} />
          ))}
        </ul>
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
          <ul className="mt-3 space-y-3">
            {warningItems.map((item, i) => (
              <BriefingCard
                key={item.id}
                item={item}
                rank={criticalItems.length + i + 1}
                onViewEvidence={setActiveItem}
              />
            ))}
          </ul>
        )}
      </section>

      <WatchList items={watchItems} />

      {activeItem && <EvidenceDrawer item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  )
}

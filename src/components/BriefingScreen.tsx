import { useState } from 'react'
import { briefingItems, totalFlaggedAmount, watchItems } from '../data/briefing'
import type { BriefingItem } from '../data/types'
import BriefingCard from './BriefingCard'
import EvidenceDrawer from './EvidenceDrawer'
import WatchList from './WatchList'

export default function BriefingScreen() {
  const [activeItem, setActiveItem] = useState<BriefingItem | null>(null)
  const roundedTotal = Math.round(totalFlaggedAmount)

  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-white/40">Tonight&apos;s briefing &middot; Oct 31</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight text-white sm:text-3xl">
          {briefingItems.length} things need your attention tonight
        </h1>
        <div className="mt-3 inline-flex items-baseline gap-2 rounded-2xl bg-red-500/10 px-4 py-2.5 ring-1 ring-inset ring-red-500/20">
          <span className="text-3xl font-extrabold tabular-nums text-red-400">
            ${roundedTotal.toLocaleString('en-US')}
          </span>
          <span className="text-sm font-medium text-red-300/80">flagged</span>
        </div>
      </header>

      <ul className="mt-6 space-y-3">
        {briefingItems.map((item, i) => (
          <BriefingCard key={item.id} item={item} rank={i + 1} onViewEvidence={setActiveItem} />
        ))}
      </ul>

      <WatchList items={watchItems} />

      {activeItem && <EvidenceDrawer item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  )
}

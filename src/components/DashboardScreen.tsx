import { ArrowDown, ArrowRight, ArrowUp, Search } from 'lucide-react'
import { useState } from 'react'
import { agingBuckets, kpiCards } from '../data/dashboard'
import Sparkline from './Sparkline'

const TREND_ICON = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const
const TREND_COLOR: Record<string, string> = {
  up: 'text-success-text bg-success-soft',
  down: 'text-critical-text bg-critical-soft',
  flat: 'text-text-muted bg-surface-2',
}
const SPARK_COLOR: Record<string, string> = {
  up: 'text-success',
  down: 'text-critical',
  flat: 'text-text-faint',
}

export default function DashboardScreen() {
  const [query, setQuery] = useState('')
  const totalAging = agingBuckets.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-text-muted">Fleet overview</p>
        <h1 className="mt-1 text-[26px] font-bold text-text sm:text-3xl">Dashboard</h1>
      </header>

      <div className="mt-4 relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search loads, drivers, invoices..."
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-faint outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kpiCards.map((kpi) => {
          const TrendIcon = kpi.trend ? TREND_ICON[kpi.trend] : null
          return (
            <div key={kpi.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-text-muted">{kpi.label}</p>
                {kpi.trend && TrendIcon && (
                  <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${TREND_COLOR[kpi.trend]}`}>
                    <TrendIcon size={11} />
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-xl font-bold tabular-nums text-text leading-tight">{kpi.value}</p>
                <Sparkline values={kpi.sparkline} colorClass={kpi.trend ? SPARK_COLOR[kpi.trend] : 'text-accent'} />
              </div>
              <p className="mt-1 text-[12.5px] text-text-muted">{kpi.sub}</p>
            </div>
          )
        })}

        <div className="rounded-2xl border border-border bg-surface p-4 sm:col-span-2">
          <p className="text-[13px] font-medium text-text-muted">Receivables aging</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-text">${totalAging.toLocaleString('en-US')}</p>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
            {agingBuckets.map((b) => (
              <div key={b.label} className={b.colorClass} style={{ width: `${(b.amount / totalAging) * 100}%` }} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {agingBuckets.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
                <span className={`h-2 w-2 rounded-full ${b.colorClass}`} />
                {b.label} &middot; ${b.amount.toLocaleString('en-US')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { ArrowDown, ArrowRight, ArrowUp, Search } from 'lucide-react'
import { useState } from 'react'
import { agingBuckets, kpiCards } from '../data/dashboard'
import Sparkline from './Sparkline'

const TREND_ICON = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const
const TREND_COLOR: Record<string, string> = {
  up: 'text-emerald-300/80 bg-emerald-400/10',
  down: 'text-rose-300/80 bg-rose-400/10',
  flat: 'text-white/40 bg-white/5',
}
const SPARK_COLOR: Record<string, string> = {
  up: '#6ee7b7',
  down: '#fda4af',
  flat: '#94a3b8',
}

export default function DashboardScreen() {
  const [query, setQuery] = useState('')
  const totalAging = agingBuckets.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-white/40">Fleet overview</p>
        <h1 className="mt-1 text-[26px] font-bold text-white sm:text-3xl">Dashboard</h1>
      </header>

      <div className="mt-4 relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search loads, drivers, invoices..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kpiCards.map((kpi) => {
          const TrendIcon = kpi.trend ? TREND_ICON[kpi.trend] : null
          return (
            <div key={kpi.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-white/50">{kpi.label}</p>
                {kpi.trend && TrendIcon && (
                  <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${TREND_COLOR[kpi.trend]}`}>
                    <TrendIcon size={11} />
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-xl font-bold tabular-nums text-white leading-tight">{kpi.value}</p>
                <Sparkline values={kpi.sparkline} color={kpi.trend ? SPARK_COLOR[kpi.trend] : '#fb923c'} />
              </div>
              <p className="mt-1 text-[12.5px] text-white/40">{kpi.sub}</p>
            </div>
          )
        })}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
          <p className="text-[13px] font-medium text-white/50">Receivables aging</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-white">
            ${totalAging.toLocaleString('en-US')}
          </p>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-white/5">
            {agingBuckets.map((b) => (
              <div key={b.label} className={b.color} style={{ width: `${(b.amount / totalAging) * 100}%` }} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {agingBuckets.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-[11.5px] text-white/50">
                <span className={`h-2 w-2 rounded-full ${b.color}`} />
                {b.label} &middot; ${b.amount.toLocaleString('en-US')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

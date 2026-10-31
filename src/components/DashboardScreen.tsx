import { useState } from 'react'
import { kpiCards } from '../data/dashboard'

const TREND_ICON: Record<string, string> = { up: '↑', down: '↓', flat: '→' }
const TREND_COLOR: Record<string, string> = {
  up: 'text-emerald-300/80',
  down: 'text-rose-300/80',
  flat: 'text-white/40',
}

export default function DashboardScreen() {
  const [query, setQuery] = useState('')

  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-white/40">Fleet overview</p>
        <h1 className="mt-1 text-[26px] font-bold text-white sm:text-3xl">Dashboard</h1>
      </header>

      <div className="mt-4 relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11.5 11.5L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search loads, drivers, invoices..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kpiCards.map((kpi) => (
          <div key={kpi.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-medium text-white/50">{kpi.label}</p>
              {kpi.trend && (
                <span className={`text-sm font-semibold ${TREND_COLOR[kpi.trend]}`}>{TREND_ICON[kpi.trend]}</span>
              )}
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums text-white leading-tight">{kpi.value}</p>
            <p className="mt-1 text-[12.5px] text-white/40">{kpi.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import type { BriefingItem } from '../data/types'
import AgentBadge from './AgentBadge'

const formatUsd = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function EvidenceDrawer({
  item,
  onClose,
}: {
  item: BriefingItem
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const confidencePct = Math.round(item.confidence * 100)
  const confidenceColor =
    confidencePct >= 95 ? 'bg-emerald-400' : confidencePct >= 85 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close evidence viewer"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#121218] shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <AgentBadge agent={item.agent} />
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
                Load {item.loadId}
              </span>
            </div>
            <h2 className="mt-2 text-base font-semibold text-white leading-snug">{item.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-none rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-white/60">Extraction confidence</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${confidenceColor}`} style={{ width: `${confidencePct}%` }} />
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-white/80">{confidencePct}%</span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white">
            <img src={item.evidenceUrl} alt={`Source document for ${item.title}`} className="block w-full" />
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40">Extracted fields</h3>
            <dl className="mt-2 divide-y divide-white/5 rounded-xl border border-white/10">
              {item.fields.map((field) => (
                <div
                  key={field.label}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${
                    field.status === 'flagged' ? 'bg-red-500/[0.07]' : ''
                  }`}
                >
                  <dt className="text-[13px] text-white/55">{field.label}</dt>
                  <dd
                    className={`text-[13.5px] font-medium ${
                      field.status === 'flagged' ? 'text-red-300' : 'text-white/80'
                    }`}
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3">
            <span className="text-[13px] font-medium text-white/70">Flagged amount</span>
            <span className="text-lg font-bold tabular-nums text-red-400">{formatUsd(item.amount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

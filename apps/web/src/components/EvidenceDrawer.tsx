import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { ExtractedField } from '../data/types'

export interface EvidenceDrawerProps {
  title: string
  badge?: ReactNode
  tag?: string
  evidenceUrl: string
  confidence: number
  fields: ExtractedField[]
  footer?: { label: string; value: string }
  onClose: () => void
}

function ConfidenceBar({ pct }: { pct: number }) {
  const reduced = useReducedMotion()
  const color = pct >= 95 ? 'bg-success' : pct >= 85 ? 'bg-warning' : 'bg-critical'
  return (
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function EvidenceDrawer({
  title,
  badge,
  tag,
  evidenceUrl,
  confidence,
  fields,
  footer,
  onClose,
}: EvidenceDrawerProps) {
  const reduced = useReducedMotion()
  const [imgError, setImgError] = useState(false)

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

  const confidencePct = Math.round(confidence * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.button
        type="button"
        aria-label="Close evidence viewer"
        onClick={onClose}
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'var(--color-overlay)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.2 }}
      />

      <motion.div
        initial={reduced ? { opacity: 0 } : { y: 48, opacity: 0 }}
        animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
        exit={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-bg-elevated shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              {badge}
              {tag && (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-text-muted">{tag}</span>
              )}
            </div>
            <h2 className="mt-2 text-base font-semibold text-text leading-snug">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-none rounded-full bg-surface-2 p-2 text-text-muted hover:text-text"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-text-secondary">Extraction confidence</span>
            <div className="flex items-center gap-2">
              <ConfidenceBar pct={confidencePct} />
              <span className="text-[13px] font-semibold tabular-nums text-text">{confidencePct}%</span>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
            {!imgError ? (
              <img
                src={evidenceUrl}
                alt={`Source document for ${title}`}
                className="block w-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">Preview unavailable</div>
            )}
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Extracted fields</h3>
            <dl className="mt-2 divide-y divide-border rounded-xl border border-border">
              {fields.map((field, i) => (
                <motion.div
                  key={field.label}
                  initial={field.status === 'flagged' && !reduced ? { backgroundColor: 'var(--color-critical-soft)' } : undefined}
                  animate={field.status === 'flagged' && !reduced ? { backgroundColor: 'rgba(0,0,0,0)' } : undefined}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.04 }}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${
                    field.status === 'flagged' ? 'bg-critical-soft' : ''
                  }`}
                >
                  <dt className="text-[13px] text-text-muted">{field.label}</dt>
                  <dd
                    className={`text-[13.5px] font-medium ${
                      field.status === 'flagged' ? 'text-critical-text' : 'text-text-secondary'
                    }`}
                  >
                    {field.value}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>

          {footer && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3">
              <span className="text-[13px] font-medium text-text-secondary">{footer.label}</span>
              <span className="text-lg font-bold tabular-nums text-critical-text">{footer.value}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function AnimatedEvidenceDrawer(props: EvidenceDrawerProps | null) {
  return <AnimatePresence>{props && <EvidenceDrawer key={props.title} {...props} />}</AnimatePresence>
}

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, CloudUpload, ListChecks, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { buildGenericExtraction, demoFiles, guessDocKind, type DocKind, type DocStage } from '../data/intake'
import type { ExtractedField } from '../data/types'
import { DOC_KIND_ICON } from '../lib/icons'
import type { EvidenceDrawerProps } from './EvidenceDrawer'

interface QueueItem {
  key: string
  name: string
  kind: DocKind
  stage: DocStage
  docType: string
  confidence: number
  evidenceUrl?: string
  fields: ExtractedField[]
  loadId?: string
}

const STAGE_LABEL: Record<DocStage, string> = {
  uploaded: 'Uploaded',
  classifying: 'Classifying…',
  extracting: 'Extracting…',
  done: 'Done',
  'needs review': 'Needs review',
}

function StagePill({ stage }: { stage: DocStage }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium'
  if (stage === 'done') {
    return (
      <span className={`${base} bg-emerald-400/10 text-emerald-200/90`}>
        <CheckCircle2 size={12} /> {STAGE_LABEL[stage]}
      </span>
    )
  }
  if (stage === 'needs review') {
    return <span className={`${base} bg-rose-400/10 text-rose-200/90`}>{STAGE_LABEL[stage]}</span>
  }
  return (
    <span className={`${base} bg-white/8 text-white/55`}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-300" />
      {STAGE_LABEL[stage]}
    </span>
  )
}

export default function IntakeSection({
  onOpenEvidence,
}: {
  onOpenEvidence: (props: Omit<EvidenceDrawerProps, 'onClose'>) => void
}) {
  const reduced = useReducedMotion()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const counter = useRef(0)

  const schedule = (key: string, finalStage: 'done' | 'needs review') => {
    const delays = reduced ? [0, 0, 0] : [500, 900, 1300]
    setTimeout(() => setQueue((q) => q.map((i) => (i.key === key ? { ...i, stage: 'classifying' } : i))), delays[0])
    setTimeout(() => setQueue((q) => q.map((i) => (i.key === key ? { ...i, stage: 'extracting' } : i))), delays[0] + delays[1])
    setTimeout(
      () => setQueue((q) => q.map((i) => (i.key === key ? { ...i, stage: finalStage } : i))),
      delays[0] + delays[1] + delays[2],
    )
  }

  const pushItem = (item: Omit<QueueItem, 'key' | 'stage'>, finalStage: 'done' | 'needs review', startDelay: number) => {
    const key = `doc-${Date.now()}-${counter.current++}`
    setTimeout(() => {
      setQueue((q) => [{ ...item, key, stage: 'uploaded' }, ...q])
      schedule(key, finalStage)
    }, startDelay)
  }

  const loadDemoFiles = () => {
    setError(null)
    demoFiles.forEach((doc, i) => {
      pushItem(
        {
          name: doc.name,
          kind: doc.kind,
          docType: doc.docType,
          confidence: doc.confidence,
          evidenceUrl: doc.evidenceUrl,
          fields: doc.fields,
          loadId: doc.loadId,
        },
        doc.finalStage,
        i * (reduced ? 0 : 450),
      )
    })
  }

  const ACCEPTED = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.eml', '.txt']

  const addFiles = (files: File[]) => {
    const bad = files.find((f) => !ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext)))
    if (bad) {
      setError(`"${bad.name}" isn't a supported file type (PDF, DOCX, JPG, EML, TXT).`)
      return
    }
    setError(null)
    files.forEach((f, i) => {
      const extraction = buildGenericExtraction(f.name)
      pushItem(
        {
          name: f.name,
          kind: guessDocKind(f.name),
          docType: extraction.docType,
          confidence: extraction.confidence,
          fields: extraction.fields,
        },
        extraction.finalStage,
        i * (reduced ? 0 : 350),
      )
    })
  }

  return (
    <section>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors sm:py-8 ${
          isDragOver ? 'border-orange-400/60 bg-orange-400/[0.06]' : 'border-white/12 bg-white/[0.02]'
        }`}
      >
        <CloudUpload size={24} className="text-white/35" strokeWidth={1.6} />
        <p className="hidden text-sm font-medium text-white/70 sm:block">
          Drop paperwork here: rate cons, BOL photos, receipts, texts
        </p>
        <p className="hidden text-[12px] text-white/35 sm:block">PDF, DOCX, JPG, EML, TXT</p>
        <p className="text-sm font-medium text-white/70 sm:hidden">Add tonight&apos;s paperwork</p>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <label className="cursor-pointer rounded-full bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:py-2">
            <span className="sm:hidden">Take photo / choose file</span>
            <span className="hidden sm:inline">Browse files</span>
            <input
              type="file"
              multiple
              accept={ACCEPTED.join(',')}
              capture="environment"
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          <button
            type="button"
            onClick={loadDemoFiles}
            className="flex items-center gap-1.5 rounded-full bg-orange-400/15 px-4 py-2.5 text-[13px] font-semibold text-orange-200 hover:bg-orange-400/25 sm:py-2"
          >
            <Sparkles size={14} /> Load demo files
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-[12.5px] text-rose-300">{error}</p>}

      {queue.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-white/30">
          <ListChecks size={13} /> Nothing processed yet tonight — drop a file or load the demo set.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {queue.map((item) => {
              const Icon = DOC_KIND_ICON[item.kind]
              const isFinal = item.stage === 'done' || item.stage === 'needs review'
              const isExpanded = expandedKey === item.key
              return (
                <motion.li
                  key={item.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduced ? 0 : 0.3 }}
                  className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.025]"
                >
                  <button
                    type="button"
                    disabled={!isFinal}
                    onClick={() => isFinal && setExpandedKey(isExpanded ? null : item.key)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Icon size={16} className="flex-none text-white/40" strokeWidth={1.7} />
                      <span className="truncate text-[13.5px] font-medium text-white/85">{item.name}</span>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <StagePill stage={item.stage} />
                      {isFinal && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          className={`text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {item.stage === 'extracting' && (
                    <div className="px-3.5 pb-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {isExpanded && isFinal && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduced ? 0 : 0.25 }}
                        className="border-t border-white/8 px-3.5 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold uppercase tracking-wide text-white/40">
                            {item.docType}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              item.confidence >= 0.85
                                ? 'bg-emerald-400/10 text-emerald-200/90'
                                : 'bg-amber-300/10 text-amber-200/90'
                            }`}
                          >
                            {Math.round(item.confidence * 100)}% confidence
                          </span>
                        </div>
                        <dl className="mt-2 space-y-1">
                          {item.fields.slice(0, 3).map((f) => (
                            <div key={f.label} className="flex items-center justify-between gap-3 text-[12.5px]">
                              <dt className="text-white/45">{f.label}</dt>
                              <dd className={f.status === 'flagged' ? 'font-medium text-rose-200' : 'text-white/75'}>
                                {f.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {item.evidenceUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenEvidence({
                                title: item.docType,
                                tag: item.loadId ? `Load ${item.loadId}` : undefined,
                                evidenceUrl: item.evidenceUrl!,
                                confidence: item.confidence,
                                fields: item.fields,
                              })
                            }
                            className="mt-2.5 text-[12.5px] font-semibold text-orange-300 hover:text-orange-200"
                          >
                            View source file &rarr;
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}

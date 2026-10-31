import { useReducedMotion } from 'framer-motion'
import { Check, PartyPopper } from 'lucide-react'
import { useMemo, useState } from 'react'
import { briefingFrom } from '../data/adapt'
import { buildTodos, type TodoPriority } from '../data/todos'
import { useLive } from '../lib/live'
import { formatUsd } from '../lib/format'
import { useLocalStorageState } from '../lib/useLocalStorage'
import { useCountUp } from '../lib/useCountUp'
import EvidenceDrawer, { type EvidenceDrawerProps } from './EvidenceDrawer'

const PRIORITY_STYLE: Record<TodoPriority, string> = {
  high: 'bg-critical-soft text-critical-text',
  medium: 'bg-warning-soft text-warning-text',
  low: 'bg-surface-2 text-text-muted',
}

type Filter = 'all' | 'open' | 'done'

export default function TodoScreen() {
  const reduced = useReducedMotion()
  const { snapshot, status } = useLive()
  const todos = useMemo(() => {
    const b = briefingFrom(snapshot, status === 'mock')
    return buildTodos(b.items, b.watch)
  }, [snapshot, status])
  const [doneIds, setDoneIds] = useLocalStorageState<string[]>('ironline-todo-done', [])
  const [filter, setFilter] = useState<Filter>('all')
  const [drawer, setDrawer] = useState<Omit<EvidenceDrawerProps, 'onClose'> | null>(null)

  const doneSet = new Set(doneIds)
  const toggle = (id: string) => {
    setDoneIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const recovered = todos.filter((t) => doneSet.has(t.id) && t.amount).reduce((s, t) => s + (t.amount ?? 0), 0)
  const animatedRecovered = useCountUp(Math.round(recovered), 700, !!reduced)
  const doneCount = todos.filter((t) => doneSet.has(t.id)).length

  const visible = todos.filter((t) => {
    if (filter === 'open') return !doneSet.has(t.id)
    if (filter === 'done') return doneSet.has(t.id)
    return true
  })

  return (
    <div className="px-4 pb-10 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-text-muted">Tonight&apos;s action list</p>
        <h1 className="mt-1 text-[26px] font-bold text-text sm:text-3xl">To-do</h1>
      </header>

      <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-text-secondary">
            {doneCount} of {todos.length} done
          </span>
          <span className="font-bold tabular-nums text-success-text">
            {formatUsd(animatedRecovered)} recovered
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
            style={{ width: `${(doneCount / todos.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-border bg-surface p-0.5">
        {(['all', 'open', 'done'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold capitalize transition-colors ${
              filter === f ? 'bg-accent-soft text-accent-text' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-10 text-center">
          <PartyPopper size={22} className="text-text-faint" />
          <p className="text-sm font-medium text-text-secondary">
            {filter === 'done' ? "Nothing done yet — check something off above." : "Everything's handled. Nice work."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {visible.map((todo) => {
            const isDone = doneSet.has(todo.id)
            return (
              <li
                key={todo.id}
                className={`rounded-2xl border border-border bg-surface p-3.5 transition-opacity ${isDone ? 'opacity-55' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(todo.id)}
                    aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                    className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border transition-colors ${
                      isDone ? 'border-success bg-success text-white' : 'border-border-strong text-transparent hover:border-accent'
                    }`}
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] font-medium leading-snug text-text ${isDone ? 'line-through' : ''}`}>
                      {todo.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {todo.amount !== undefined && (
                        <span className="text-[13px] font-bold tabular-nums text-text-secondary">
                          {formatUsd(todo.amount)}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ${PRIORITY_STYLE[todo.priority]}`}>
                        {todo.priority}
                      </span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-text-muted">
                        {todo.due}
                      </span>
                      {todo.loadId && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-text-muted">
                          Load {todo.loadId}
                        </span>
                      )}
                      {todo.evidenceUrl && todo.fields && (
                        <button
                          type="button"
                          onClick={() =>
                            setDrawer({
                              title: todo.title,
                              tag: todo.loadId ? `Load ${todo.loadId}` : undefined,
                              evidenceUrl: todo.evidenceUrl!,
                              confidence: todo.confidence,
                              fields: todo.fields!,
                            })
                          }
                          className="text-[12px] font-semibold text-accent-text hover:text-accent"
                        >
                          View evidence &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {drawer && <EvidenceDrawer {...drawer} onClose={() => setDrawer(null)} />}
    </div>
  )
}

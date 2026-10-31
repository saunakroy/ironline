import type { WatchItem } from '../data/types'
import { formatUsd } from '../lib/format'

export default function WatchList({ items }: { items: WatchItem[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-text-secondary">Also on watch</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-3"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${
                  item.severity === 'warning' ? 'bg-warning' : 'bg-text-faint'
                }`}
              />
              <div>
                <p className="text-[13.5px] font-medium text-text-secondary leading-snug">{item.title}</p>
                <p className="text-[12.5px] text-text-muted leading-snug">{item.detail}</p>
              </div>
            </div>
            {item.amount !== undefined && (
              <span className="flex-none text-sm font-semibold tabular-nums text-text-secondary">
                {formatUsd(item.amount)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

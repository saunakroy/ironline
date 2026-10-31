import type { WatchItem } from '../data/types'

const formatUsd = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function WatchList({ items }: { items: WatchItem[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-white/70">Also on watch</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${
                  item.severity === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                }`}
              />
              <div>
                <p className="text-[13.5px] font-medium text-white/80 leading-snug">{item.title}</p>
                <p className="text-[12.5px] text-white/45 leading-snug">{item.detail}</p>
              </div>
            </div>
            {item.amount !== undefined && (
              <span className="flex-none text-sm font-semibold tabular-nums text-white/70">
                {formatUsd(item.amount)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

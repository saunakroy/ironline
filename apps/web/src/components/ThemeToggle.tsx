import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeChoice } from '../lib/useTheme'

const OPTIONS: { id: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'system', icon: Laptop, label: 'System' },
  { id: 'dark', icon: Moon, label: 'Dark' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-0.5">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const active = theme === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            aria-label={opt.label}
            aria-pressed={active}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active ? 'bg-accent-soft text-accent-text' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={14} strokeWidth={1.8} />
          </button>
        )
      })}
    </div>
  )
}

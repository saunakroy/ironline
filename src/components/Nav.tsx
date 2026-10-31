import { LayoutDashboard, ListChecks, MessageSquareText, ScrollText, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Page = 'home' | 'upload' | 'todo' | 'dashboard' | 'agents'

export const PAGES: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: ScrollText },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'todo', label: 'To-do', icon: ListChecks },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: MessageSquareText },
]

export function TopNav({ active, onChange }: { active: Page; onChange: (page: Page) => void }) {
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {PAGES.map((p) => {
        const Icon = p.icon
        const isActive = p.id === active
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
              isActive ? 'bg-accent-soft text-accent-text' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={14} strokeWidth={isActive ? 2 : 1.6} />
            {p.label}
          </button>
        )
      })}
    </nav>
  )
}

export function BottomTabBar({ active, onChange }: { active: Page; onChange: (page: Page) => void }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-bg-elevated/95 backdrop-blur-md sm:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-5">
        {PAGES.map((p) => {
          const Icon = p.icon
          const isActive = p.id === active
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex flex-col items-center gap-1 py-3 text-[10.5px] font-medium transition-colors ${
                isActive ? 'text-accent-text' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
              {p.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

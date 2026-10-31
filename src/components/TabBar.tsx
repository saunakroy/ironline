import { LayoutDashboard, MessageSquareText, ScrollText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Tab = 'home' | 'dashboard' | 'agents'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: ScrollText },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: MessageSquareText },
]

export default function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-white/10 bg-[#14161b]/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-2xl grid-cols-3">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-orange-300' : 'text-white/40'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.6} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

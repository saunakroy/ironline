export type Tab = 'briefing' | 'dashboard' | 'upload' | 'agents'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'briefing',
    label: 'Briefing',
    icon: (
      <path
        d="M4 4h16v12H9l-5 4V4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <path
        d="M4 13h4v7H4v-7zM10 4h4v16h-4V4zM16 9h4v11h-4V9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    id: 'upload',
    label: 'Upload',
    icon: (
      <path
        d="M12 16V4M12 4L7 9M12 4L17 9M5 20H19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: (
      <path
        d="M4 6h16M4 12h16M4 18h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
]

export default function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-white/10 bg-[#0a0a0d]/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-violet-400' : 'text-white/40'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                {tab.icon}
              </svg>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

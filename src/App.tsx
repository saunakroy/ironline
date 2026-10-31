import { useState } from 'react'
import AgentsScreen from './components/AgentsScreen'
import BriefingScreen from './components/BriefingScreen'
import DashboardScreen from './components/DashboardScreen'
import DriverHome from './components/DriverHome'
import RoleHome from './components/RoleHome'
import TabBar, { type Tab } from './components/TabBar'
import UploadScreen from './components/UploadScreen'
import type { Role } from './data/people'

function OwnerShell({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('briefing')

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-[#14161b]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Switch person"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/5 text-white/50 active:bg-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 2L4 8l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[15px] font-bold tracking-tight text-white">Ironline</span>
      </div>

      <main className="flex-1 overflow-y-auto">
        {tab === 'briefing' && <BriefingScreen />}
        {tab === 'dashboard' && <DashboardScreen />}
        {tab === 'upload' && <UploadScreen />}
        {tab === 'agents' && <AgentsScreen />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role | null>(null)

  if (role === 'owner') return <OwnerShell onBack={() => setRole(null)} />
  if (role === 'driver') return <DriverHome onBack={() => setRole(null)} />
  return <RoleHome onSelect={setRole} />
}

export default App

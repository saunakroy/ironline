import { useState } from 'react'
import AgentsScreen from './components/AgentsScreen'
import BriefingScreen from './components/BriefingScreen'
import DashboardScreen from './components/DashboardScreen'
import TabBar, { type Tab } from './components/TabBar'
import UploadScreen from './components/UploadScreen'

function App() {
  const [tab, setTab] = useState<Tab>('briefing')

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-[#0a0a0d]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <span className="text-[15px] font-bold tracking-tight text-white">Ironline</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" title="Agents online" />
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

export default App

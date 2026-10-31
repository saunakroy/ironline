import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import AgentsScreen from './components/AgentsScreen'
import DashboardScreen from './components/DashboardScreen'
import DriverHome from './components/DriverHome'
import HomeScreen from './components/HomeScreen'
import RoleHome from './components/RoleHome'
import StatusStrip from './components/StatusStrip'
import TabBar, { type Tab } from './components/TabBar'
import type { Role } from './data/people'

function OwnerShell({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('home')
  const reduced = useReducedMotion()

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-[#14161b]">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Switch person"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/5 text-white/50 active:bg-white/10"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[15px] font-bold tracking-tight text-white">Ironline</span>
      </div>
      <StatusStrip />

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            {tab === 'home' && <HomeScreen />}
            {tab === 'dashboard' && <DashboardScreen />}
            {tab === 'agents' && <AgentsScreen />}
          </motion.div>
        </AnimatePresence>
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

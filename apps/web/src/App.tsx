import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import AgentsScreen from './components/AgentsScreen'
import DashboardScreen from './components/DashboardScreen'
import DriverHome from './components/DriverHome'
import HomeScreen from './components/HomeScreen'
import { BottomTabBar, TopNav, type Page } from './components/Nav'
import RoleHome from './components/RoleHome'
import StatusStrip from './components/StatusStrip'
import ThemeToggle from './components/ThemeToggle'
import TodoScreen from './components/TodoScreen'
import UploadScreen from './components/UploadScreen'
import type { Role } from './data/people'

function OwnerShell({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState<Page>('home')
  const reduced = useReducedMotion()

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-bg">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Switch person"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface text-text-muted hover:text-text-secondary"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-bold tracking-tight text-text">Ironline</span>
        </div>
        <div className="flex items-center gap-3">
          <TopNav active={page} onChange={setPage} />
          <ThemeToggle />
        </div>
      </div>
      <StatusStrip />

      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            {page === 'home' && <HomeScreen onGoUpload={() => setPage('upload')} />}
            {page === 'upload' && <UploadScreen />}
            {page === 'todo' && <TodoScreen />}
            {page === 'dashboard' && <DashboardScreen />}
            {page === 'agents' && <AgentsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomTabBar active={page} onChange={setPage} />
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

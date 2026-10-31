import { useLive } from '../lib/live'

const DOT: Record<string, string> = { live: 'bg-success', connecting: 'bg-warning', offline: 'bg-critical', mock: 'bg-text-faint' }

export default function StatusStrip() {
  const { status, snapshot, relayMode } = useLive()
  const loads = snapshot?.loads.length ?? 0
  const last = snapshot?.lastCheckAt ? new Date(snapshot.lastCheckAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'not yet'
  const text =
    status === 'mock'
      ? 'Demo data (VITE_USE_MOCKS=1) · not connected to the backend'
      : status === 'offline'
        ? 'Backend offline · start dev:actors, dev:data, dev:inference'
        : status === 'connecting'
          ? 'Connecting to the backend…'
          : `${loads} load actors · last check ${last} · relay ${relayMode ?? 'unknown'}`
  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-1.5 text-[11.5px] text-text-muted sm:px-6">
      <span className="relative flex h-1.5 w-1.5 flex-none">
        {status === 'live' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      </span>
      <span className="truncate">{text}</span>
    </div>
  )
}

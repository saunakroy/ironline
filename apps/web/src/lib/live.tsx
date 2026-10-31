// Live backend state for the whole app: Company snapshot (kept fresh by the Terse WebSocket),
// the agent relay feed (SSE), and actions (run check, upload, replay demo days).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AS_OF, USE_MOCKS, api, type CompanySnapshot, type IngestResult, type RelayMessage } from './backend'

export type ConnStatus = 'connecting' | 'live' | 'offline' | 'mock'

type LiveState = {
  status: ConnStatus
  snapshot: CompanySnapshot | null
  feed: RelayMessage[]
  relayMode: string | null
  checking: boolean
  error: string | null
  runCheck: () => Promise<void>
  ingest: (file: File) => Promise<IngestResult>
  ingestDay: (day: string) => Promise<IngestResult[]>
}

const Ctx = createContext<LiveState | null>(null)

export function LiveProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnStatus>(USE_MOCKS ? 'mock' : 'connecting')
  const [snapshot, setSnapshot] = useState<CompanySnapshot | null>(null)
  const [feed, setFeed] = useState<RelayMessage[]>([])
  const [relayMode, setRelayMode] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshTimer = useRef<number | undefined>(undefined)

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await api.snapshot())
      setStatus('live')
    } catch (e) {
      setStatus('offline')
      setError(String((e as Error).message))
    }
  }, [])
  // Coalesce bursts of actor broadcasts (one per routed doc) into one snapshot fetch.
  const scheduleRefresh = useCallback(() => {
    window.clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(refresh, 250)
  }, [refresh])

  // Company actor WebSocket: any broadcast or state change means the snapshot moved.
  useEffect(() => {
    if (USE_MOCKS) return
    let ws: WebSocket | null = null
    let retry: number | undefined
    let stopped = false
    const connect = async () => {
      try {
        const { websocketUrl } = await api.companySocket()
        if (stopped) return
        ws = new WebSocket(websocketUrl)
        ws.onopen = () => void refresh()
        ws.onmessage = () => scheduleRefresh()
        ws.onclose = () => {
          if (!stopped) retry = window.setTimeout(connect, 3000)
        }
      } catch {
        setStatus('offline')
        if (!stopped) retry = window.setTimeout(connect, 3000)
      }
    }
    void refresh()
    void connect()
    return () => {
      stopped = true
      window.clearTimeout(retry)
      ws?.close()
    }
  }, [refresh, scheduleRefresh])

  // Agent relay feed (Server-Sent Events). EventSource reconnects on its own.
  useEffect(() => {
    if (USE_MOCKS) return
    const es = new EventSource(api.relayFeedUrl())
    es.onmessage = e => {
      const m = JSON.parse(e.data) as RelayMessage
      setFeed(f => (f.some(x => x.id === m.id) ? f : [...f, m].slice(-300)))
    }
    api.inferenceHealth().then(h => setRelayMode(h.relay ?? 'local'), () => setRelayMode(null))
    return () => es.close()
  }, [])

  const runCheck = useCallback(async () => {
    setChecking(true)
    setError(null)
    try {
      await api.runCheck(AS_OF)
      await refresh()
    } catch (e) {
      setError(`Check failed: ${(e as Error).message}`)
    } finally {
      setChecking(false)
    }
  }, [refresh])

  const value = useMemo<LiveState>(
    () => ({ status, snapshot, feed, relayMode, checking, error, runCheck, ingest: api.ingest, ingestDay: api.ingestDay }),
    [status, snapshot, feed, relayMode, checking, error, runCheck],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLive(): LiveState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLive must be used inside <LiveProvider>')
  return v
}

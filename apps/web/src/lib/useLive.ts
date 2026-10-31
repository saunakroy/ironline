// Live backend state: Company snapshot (refreshed on every Terse actor broadcast), fleet overview,
// and the agent relay feed (SSE). Returns nulls while connecting; App falls back to nothing, not mocks.
import { useCallback, useEffect, useRef, useState } from 'react';
import { USE_MOCKS, api, type CompanySnapshot, type FleetOverview, type RelayMessage } from './backend';

export type ConnStatus = 'connecting' | 'live' | 'offline' | 'mock';

export function useLive() {
  const [status, setStatus] = useState<ConnStatus>(USE_MOCKS ? 'mock' : 'connecting');
  const [snapshot, setSnapshot] = useState<CompanySnapshot | null>(null);
  const [fleet, setFleet] = useState<FleetOverview | null>(null);
  const [feed, setFeed] = useState<RelayMessage[]>([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([api.snapshot(), api.fleet()]);
      setSnapshot(s);
      setFleet(f);
      setStatus('live');
    } catch (e) {
      setStatus('offline');
      setError((e as Error).message);
    }
  }, []);
  const soon = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(refresh, 250);
  }, [refresh]);

  useEffect(() => {
    if (USE_MOCKS) return;
    let ws: WebSocket | null = null;
    let retry: number | undefined;
    let stopped = false;
    const connect = async () => {
      try {
        const { websocketUrl } = await api.companySocket();
        if (stopped) return;
        ws = new WebSocket(websocketUrl);
        ws.onopen = () => void refresh();
        ws.onmessage = () => soon();
        ws.onclose = () => { if (!stopped) retry = window.setTimeout(connect, 3000); };
      } catch {
        setStatus('offline');
        if (!stopped) retry = window.setTimeout(connect, 3000);
      }
    };
    void refresh();
    void connect();
    return () => { stopped = true; window.clearTimeout(retry); ws?.close(); };
  }, [refresh, soon]);

  useEffect(() => {
    if (USE_MOCKS) return;
    const add = (m: RelayMessage) => setFeed(f => (f.some(x => x.id === m.id) ? f : [...f, m].slice(-300)));
    fetch(api.relayRecentUrl()).then(r => r.json()).then((ms: RelayMessage[]) => ms.forEach(add)).catch(() => {});
    const es = new EventSource(api.relayFeedUrl());
    es.onmessage = e => add(JSON.parse(e.data) as RelayMessage);
    return () => es.close();
  }, []);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      await api.runCheck();
      await refresh();
    } catch (e) {
      setError(`Check failed: ${(e as Error).message}`);
    } finally {
      setChecking(false);
    }
  }, [refresh]);

  return { status, snapshot, fleet, feed, checking, error, runCheck, refresh };
}

import { useEffect, useMemo, useState } from 'react';
import { USE_MOCKS, api } from './lib/backend';
import { useLive } from './lib/useLive';
import { documentFromUpload, documentsFrom, driversFrom, kpisFrom, loadsFrom, messagesFrom, problemsFrom } from './data/adapt';
import { 
  DRIVERS,
  PLANTED_PROBLEMS, 
  MOCK_EXTRACTED_DOCS, 
  MOCK_LOADS, 
  MOCK_AGENT_MESSAGES, 
  MOCK_KPIS 
} from './data/mockData';
import { UserRole, DriverProfile, PlantedProblem, ExtractedDocument, AgentRelayMessage } from './types';
import { Navbar } from './components/Navbar';
import { TruckerPortal } from './components/TruckerPortal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AgentRelayStream } from './components/AgentRelayStream';

export default function App() {
  const live = useLive();
  const [currentRole, setCurrentRole] = useState<UserRole>('trucker');
  const [mockProblems, setProblems] = useState<PlantedProblem[]>(PLANTED_PROBLEMS);
  const [mockDocuments, setDocuments] = useState<ExtractedDocument[]>(MOCK_EXTRACTED_DOCS);
  const [mockMessages, setMessages] = useState<AgentRelayMessage[]>(MOCK_AGENT_MESSAGES);
  // Live mode: "resolve" hides a finding locally (the backend re-flags it on the next check if it's still true).
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [sessionUploads, setSessionUploads] = useState<ExtractedDocument[]>([]);

  const drivers = useMemo(() => (USE_MOCKS ? DRIVERS : driversFrom(live.snapshot, live.fleet)), [live.snapshot, live.fleet]);
  const loads = useMemo(() => (USE_MOCKS ? MOCK_LOADS : loadsFrom(live.snapshot, live.fleet)), [live.snapshot, live.fleet]);
  const kpis = USE_MOCKS ? MOCK_KPIS : kpisFrom(live.fleet);
  const problems = useMemo(
    () => (USE_MOCKS ? mockProblems : problemsFrom(live.snapshot, live.fleet).filter(p => !resolvedIds.includes(p.id))),
    [mockProblems, live.snapshot, live.fleet, resolvedIds],
  );
  const documents = useMemo(
    () => (USE_MOCKS ? mockDocuments : [...sessionUploads, ...documentsFrom(live.snapshot, live.fleet)]),
    [mockDocuments, sessionUploads, live.snapshot, live.fleet],
  );
  const messages = useMemo(() => (USE_MOCKS ? mockMessages : messagesFrom(live.feed)), [mockMessages, live.feed]);

  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
  const currentDriver = drivers.find(d => d.id === currentDriverId) ?? drivers[0];
  const setCurrentDriver = (d: DriverProfile) => setCurrentDriverId(d.id);
  useEffect(() => {
    if (!currentDriverId && drivers[0]) setCurrentDriverId(drivers[0].id);
  }, [drivers, currentDriverId]);
  const [isAgentStreamOpen, setIsAgentStreamOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleResolveProblem = (id: string) => {
    const resolvedItem = problems.find(p => p.id === id);
    if (!resolvedItem) return;

    if (USE_MOCKS) setProblems(prev => prev.filter(p => p.id !== id));
    else setResolvedIds(prev => [...prev, id]);
    
    // Add human-friendly activity log
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}`,
      timestamp: timeStr,
      fromAgent: 'briefer',
      toAgent: 'all',
      loadRef: resolvedItem.loadId,
      message: `Owner resolved ${resolvedItem.id}: ${resolvedItem.title}. Reconciled on ledger.`,
      humanSummary: `✓ Resolved ${resolvedItem.id} (${resolvedItem.title}) — Updated carrier ledger.`,
      priority: 'normal'
    };
    if (USE_MOCKS) setMessages(prev => [newMsg, ...prev]);

    setActionNotice(`✓ Reconciled ${resolvedItem.id}: ${resolvedItem.suggestedAction}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAddDocument = (newDoc: ExtractedDocument) => {
    if (!USE_MOCKS) {
      setSessionUploads(prev => [newDoc, ...prev]); // the relay feed already shows the agents' messages
      return;
    }
    setDocuments(prev => [newDoc, ...prev]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}`,
      timestamp: timeStr,
      fromAgent: 'extractor',
      toAgent: 'reconciler',
      loadRef: newDoc.loadRef,
      message: `New upload: ${newDoc.filename} (${newDoc.docClassification}) received from ${newDoc.driverName || 'driver'}.`,
      humanSummary: `📄 Ingested ${newDoc.docClassification} from ${newDoc.driverName || 'driver'}: matched to ${newDoc.loadRef || 'fleet expenses'}.`,
      priority: 'normal'
    };
    setMessages(prev => [newMsg, ...prev]);
  };

  const handleUploadFile = async (file: File) => documentFromUpload(await api.ingest(file).catch((e: Error) => ({ file: file.name, error: e.message })), currentDriver?.name);

  const handleTriggerReconcile = () => {
    if (!USE_MOCKS) {
      setIsAgentStreamOpen(true);
      void live.runCheck();
      return;
    }
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const triggerMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}-check`,
      timestamp: timeStr,
      fromAgent: 'reconciler',
      toAgent: 'briefer',
      message: 'Automated 18:00 check completed across all loads, BOLs, and receipts.',
      humanSummary: '⚡ Manual audit trigger: Reconciled 4 trucks, 12 receipts, and telematics in 42ms.',
      priority: 'alert'
    };

    setMessages(prev => [triggerMsg, ...prev]);
    setIsAgentStreamOpen(true);
  };

  const activeLoadForDriver = loads.find(l => l.id === currentDriver?.currentLoadId);

  if (!USE_MOCKS && (!currentDriver || !kpis)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-base font-bold text-slate-900">{live.status === 'offline' ? 'Backend offline' : 'Connecting to Ironline…'}</div>
          <div className="mt-1 text-sm text-slate-500">
            {live.status === 'offline'
              ? 'Start dev:actors, dev:data and dev:inference, then reload. (Set VITE_USE_MOCKS=1 for demo data.)'
              : 'Loading loads, drivers and tonight\u2019s findings from the durable actors.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isAgentStreamOpen={isAgentStreamOpen}
        onToggleAgentStream={() => setIsAgentStreamOpen(!isAgentStreamOpen)}
        unresolvedCount={problems.filter(p => p.isTonightBriefing).length}
      />
      {!USE_MOCKS && live.error && (
        <div className="bg-rose-50 text-rose-700 text-xs font-semibold text-center py-2 px-4">{live.error}</div>
      )}

      {/* Floating Notification Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-200">
          {actionNotice}
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentRole === 'trucker' ? (
          <TruckerPortal
            drivers={drivers}
            currentDriver={currentDriver!}
            onSelectDriver={setCurrentDriver}
            activeLoad={activeLoadForDriver}
            recentDocuments={documents}
            onUploadDocument={handleAddDocument}
            onUploadFile={USE_MOCKS ? undefined : handleUploadFile}
          />
        ) : (
          <OwnerDashboard
            drivers={drivers}
            problems={problems}
            loads={loads}
            kpis={kpis!}
            onResolveProblem={handleResolveProblem}
            onSelectDriverForTruckerMode={(driver) => {
              setCurrentDriver(driver);
              setCurrentRole('trucker');
            }}
          />
        )}
      </main>

      {/* Minimalist Live Activity Drawer */}
      <AgentRelayStream
        messages={messages}
        onTriggerReconcile={handleTriggerReconcile}
        isOpen={isAgentStreamOpen}
        onClose={() => setIsAgentStreamOpen(false)}
        trackerUrl={USE_MOCKS ? undefined : api.trackerUrl()}
        isChecking={live.checking}
      />

      {/* Minimal clean footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 font-mono">
        Ironline Freight LLC • Built for YC Haunted Hacks • Terse Durable Actors & Agent Relay
      </footer>
    </div>
  );
}

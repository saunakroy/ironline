import { useState, useEffect, useMemo } from 'react';
import { AS_OF, USE_MOCKS, api } from './lib/backend';
import { useLive } from './lib/useLive';
import { briefingFrom, driversFrom, finishedFile, kpisFrom, messagesFrom, pendingFile } from './data/adapt';
import { 
  BRIEFING_ITEMS, 
  WATCH_ITEMS, 
  DEMO_FILES_SAMPLE, 
  AGENT_RELAY_MESSAGES, 
  FLEET_KPIS,
  DEMO_DRIVERS
} from './data/mockData';
import { 
  ActiveTab, 
  BriefingItem, 
  WatchItem, 
  ProcessedFile, 
  AgentMessage, 
  FleetKPIs,
  UserRole,
  DriverSession,
  ThemeMode
} from './types';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { DashboardTab } from './components/DashboardTab';
import { AgentsTab } from './components/AgentsTab';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { LoginModal } from './components/LoginModal';
import { TruckerPortal } from './components/TruckerPortal';

export default function App() {
  const live = useLive();
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [mockBriefing, setBriefingItems] = useState<BriefingItem[]>(BRIEFING_ITEMS);
  const [mockWatch] = useState<WatchItem[]>(WATCH_ITEMS);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [mockMessages, setMessages] = useState<AgentMessage[]>(AGENT_RELAY_MESSAGES);
  const [mockKpis] = useState<FleetKPIs>(FLEET_KPIS);
  // Live mode: "resolve" hides a finding locally; the next check re-flags it if it's still true.
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const liveBriefing = useMemo(() => briefingFrom(live.snapshot, live.fleet), [live.snapshot, live.fleet]);
  const briefingItems = USE_MOCKS ? mockBriefing : liveBriefing.items.filter((b) => !resolvedIds.includes(b.id));
  const watchItems = USE_MOCKS ? mockWatch : liveBriefing.watch;
  const messages = useMemo(() => (USE_MOCKS ? mockMessages : messagesFrom(live.feed)), [mockMessages, live.feed]);
  const kpis = USE_MOCKS ? mockKpis : kpisFrom(live.fleet);
  const drivers = useMemo(() => (USE_MOCKS ? DEMO_DRIVERS : driversFrom(live.snapshot, live.fleet)), [live.snapshot, live.fleet]);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
  const activeDriver = drivers.find((d) => d.id === activeDriverId) ?? drivers[0];
  const setActiveDriver = (d: DriverSession) => setActiveDriverId(d.id);
  const [selectedBriefingItem, setSelectedBriefingItem] = useState<BriefingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Live intake: one file at a time through the Intake agent (rate cons first, so loads exist before paperwork).
  const phase = (n: string) => (/^ratecon|\.eml$/i.test(n) ? 0 : /\.txt$/i.test(n) ? 2 : 1);
  const uploadLive = async (file: File): Promise<ProcessedFile> => {
    const pending = pendingFile(file.name, file.size);
    setProcessedFiles((prev) => [pending, ...prev]);
    const result = await api.ingest(file).catch((e: Error) => ({ file: file.name, error: e.message }));
    const done = { ...finishedFile(pending, result), isExpanded: true };
    setProcessedFiles((prev) => prev.map((p) => (p.id === pending.id ? done : p)));
    return done;
  };
  const DEMO_DAYS = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];
  const replayDemoDays = async () => {
    for (const day of DEMO_DAYS) {
      const rows = await api.ingestDay(day).catch((e: Error) => [{ file: `inbox/${day}`, error: e.message }]);
      setProcessedFiles((prev) => [...rows.map((r) => finishedFile(pendingFile(r.file), r)), ...prev]);
    }
    showToast(`✓ Replayed ${DEMO_DAYS.length} days of inbox through the agents — run tonight's check next`);
  };

  const handleSelectRole = (role: UserRole, driver?: DriverSession) => {
    setCurrentRole(role);
    if (driver) {
      setActiveDriver(driver);
    }
    showToast(
      role === 'owner' 
        ? `👔 Authenticated: Fleet Owner${USE_MOCKS ? ' (Marcus Vance)' : ''}` 
        : `🚛 In-Cab Mode: ${(driver || activeDriver)?.name} (${(driver || activeDriver)?.truckId})`
    );
  };

  const handleDriverUpload = (docName: string, docType: string, keyFields: Record<string, string>) => {
    const newDoc: ProcessedFile = {
      id: `FILE-${Date.now()}`,
      name: docName,
      size: '1.4 MB',
      type: 'JPG',
      uploadedAt: 'Just now',
      stage: 'done',
      docType,
      confidence: 96,
      loadId: activeDriver.currentLoadId,
      keyFields,
      isExpanded: true
    };

    setProcessedFiles((prev) => [newDoc, ...prev]);

    // Also dispatch message into the agent relay stream
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const relayMsg: AgentMessage = {
      id: `RELAY-${Date.now()}`,
      timestamp: timeStr,
      from: 'extractor',
      to: 'reconciler',
      loadId: activeDriver.currentLoadId,
      text: `CAB INTAKE: ${activeDriver.name} uploaded ${docType}. Reconciler verifying against contract terms.`,
      priority: 'normal'
    };
    setMessages((prev) => [relayMsg, ...prev]);
  };

  // Resolve a briefing item (e.g. from the evidence drawer)
  const handleResolveItem = (id: string) => {
    const item = briefingItems.find((b) => b.id === id);
    if (!item) return;

    if (USE_MOCKS) setBriefingItems((prev) => prev.filter((b) => b.id !== id));
    else setResolvedIds((prev) => [...prev, id]);

    // Append resolved event to Agent Relay Stream
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const resolveMsg: AgentMessage = {
      id: `RELAY-${Date.now()}`,
      timestamp: timeStr,
      from: 'briefer',
      to: 'all',
      loadId: item.loadId,
      text: `OWNER SIGN-OFF: Reconciled ${item.id} (${item.title}). Recovered ${item.amountFormatted}. Ledger updated.`,
      priority: 'urgent'
    };
    if (USE_MOCKS) setMessages((prev) => [resolveMsg, ...prev]);

    showToast(`✓ Resolved ${item.id}: Reconciled ${item.amountFormatted}`);
  };

  // Triggering the "Load demo files" action for the 3-minute pitch
  const handleLoadDemoFiles = () => {
    if (!USE_MOCKS) {
      showToast('⚡ Replaying the demo inbox through the agents…');
      void replayDemoDays();
      return;
    }
    showToast('⚡ Ingesting Monday demo files: 4 documents queued');

    // Add files in 'uploaded' stage
    const initialFiles: ProcessedFile[] = DEMO_FILES_SAMPLE.map((f) => ({
      ...f,
      stage: 'uploaded',
      isExpanded: false
    }));

    setProcessedFiles(initialFiles);

    // Transition each file through classifying -> extracting -> done/needs_review
    initialFiles.forEach((file, index) => {
      // Step 1: Classifying
      setTimeout(() => {
        setProcessedFiles((prev) =>
          prev.map((p) => (p.id === file.id ? { ...p, stage: 'classifying' } : p))
        );
      }, 500 + index * 400);

      // Step 2: Extracting
      setTimeout(() => {
        setProcessedFiles((prev) =>
          prev.map((p) => (p.id === file.id ? { ...p, stage: 'extracting' } : p))
        );
      }, 1200 + index * 500);

      // Step 3: Finished (done or needs_review)
      setTimeout(() => {
        setProcessedFiles((prev) =>
          prev.map((p) =>
            p.id === file.id
              ? {
                  ...p,
                  stage: DEMO_FILES_SAMPLE[index].stage,
                  isExpanded: index === 0 // expand the first record to show off keys
                }
              : p
          )
        );
      }, 2200 + index * 600);
    });
  };

  // Handle actual manual drag/drop or file input
  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    showToast(`Uploaded ${fileArray.length} file(s) for autonomous extraction`);
    if (!USE_MOCKS) {
      void (async () => {
        for (const f of [...fileArray].sort((a, b) => phase(a.name) - phase(b.name))) await uploadLive(f);
      })();
      return;
    }

    const newFiles: ProcessedFile[] = fileArray.map((f, i) => {
      const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
      const sizeKb = Math.round(f.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      return {
        id: `FILE-${Date.now()}-${i}`,
        name: f.name,
        size: sizeStr,
        type: ext,
        uploadedAt: 'Just now',
        stage: 'uploaded',
        docType: ext === 'PDF' ? 'Contract / Invoice' : 'Delivery Receipt / Fuel Slip',
        confidence: 96,
        keyFields: {
          'File Name': f.name,
          'Extracted Text': 'Driver timestamp 07:40 - 12:10 matched',
          'Audit Check': 'Ready for nightly reconciliation'
        },
        isExpanded: false
      };
    });

    setProcessedFiles((prev) => [...newFiles, ...prev]);

    // Animate new files through the stages
    newFiles.forEach((f) => {
      setTimeout(() => {
        setProcessedFiles((prev) =>
          prev.map((p) => (p.id === f.id ? { ...p, stage: 'classifying' } : p))
        );
      }, 600);

      setTimeout(() => {
        setProcessedFiles((prev) =>
          prev.map((p) => (p.id === f.id ? { ...p, stage: 'extracting' } : p))
        );
      }, 1400);

      setTimeout(() => {
        setProcessedFiles((prev) =>
          prev.map((p) => (p.id === f.id ? { ...p, stage: 'done', isExpanded: true } : p))
        );
      }, 2400);
    });
  };

  const handleToggleExpandFile = (fileId: string) => {
    setProcessedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isExpanded: !f.isExpanded } : f))
    );
  };

  if (!USE_MOCKS && (!activeDriver || !kpis)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-mono">
        <div>
          <div className="text-base font-bold text-slate-900">{live.status === 'offline' ? 'Backend offline' : 'Connecting to Ironline…'}</div>
          <div className="mt-1 text-xs text-slate-500">
            {live.status === 'offline'
              ? 'Start dev:actors, dev:data and dev:inference, then reload. (VITE_USE_MOCKS=1 for demo data.)'
              : `Loading loads, drivers and findings for ${AS_OF} from the durable actors.`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme} ${theme === 'light' ? 'bg-[#f8fafc] text-[#0f172a]' : 'bg-[#070b14] text-[#f8fafc]'} flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden selection:bg-orange-500 selection:text-white`}>
      {/* Top Navigation with Profile Picture & Dropdown */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unresolvedCount={briefingItems.length}
        currentRole={currentRole}
        activeDriver={activeDriver!}
        demoDrivers={drivers}
        onSelectRole={handleSelectRole}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-orange-400 border border-orange-500/40 text-xs sm:text-sm font-mono font-bold px-5 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentRole === 'trucker' ? (
          <div className="animate-tab-enter">
            <TruckerPortal
              driver={activeDriver!}
              onSwitchToOwner={() => handleSelectRole('owner')}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onDriverUpload={handleDriverUpload}
              recentFiles={processedFiles}
              onUploadFile={USE_MOCKS ? undefined : uploadLive}
            />
          </div>
        ) : (
          <div key={activeTab} className="animate-tab-enter">
            {activeTab === 'home' && (
              <HomeScreen
                briefingItems={briefingItems}
                watchItems={watchItems}
                processedFiles={processedFiles}
                onSelectBriefingItem={setSelectedBriefingItem}
                onLoadDemoFiles={handleLoadDemoFiles}
                onFileUpload={handleFileUpload}
                onToggleExpandFile={handleToggleExpandFile}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab kpis={kpis!} />
            )}

            {activeTab === 'agents' && (
              <AgentsTab
                messages={messages}
                onRunCheck={USE_MOCKS ? undefined : () => void live.runCheck()}
                isChecking={live.checking}
                trackerUrl={USE_MOCKS ? undefined : api.trackerUrl()}
              />
            )}
          </div>
        )}
      </main>

      {/* Evidence Viewer Drawer (Modal / Bottom Sheet) */}
      <EvidenceDrawer
        item={selectedBriefingItem}
        onClose={() => setSelectedBriefingItem(null)}
        onResolve={handleResolveItem}
      />

      {/* Interactive Terminal Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        demoDrivers={drivers}
        activeDriver={activeDriver!}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            IRONLINE Freight LLC • Built for YC Haunted Hacks
          </div>
          <div className="text-[11px] text-slate-600">
            Terse Durable Actors & Inter-Agent Relay Protocol
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { 
  BRIEFING_ITEMS, 
  WATCH_ITEMS, 
  DEMO_FILES_SAMPLE, 
  AGENT_RELAY_MESSAGES, 
  FLEET_KPIS 
} from './data/mockData';
import { 
  ActiveTab, 
  BriefingItem, 
  WatchItem, 
  ProcessedFile, 
  AgentMessage, 
  FleetKPIs 
} from './types';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { DashboardTab } from './components/DashboardTab';
import { AgentsTab } from './components/AgentsTab';
import { EvidenceDrawer } from './components/EvidenceDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [briefingItems, setBriefingItems] = useState<BriefingItem[]>(BRIEFING_ITEMS);
  const [watchItems] = useState<WatchItem[]>(WATCH_ITEMS);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>(AGENT_RELAY_MESSAGES);
  const [kpis] = useState<FleetKPIs>(FLEET_KPIS);
  const [selectedBriefingItem, setSelectedBriefingItem] = useState<BriefingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Resolve a briefing item (e.g. from the evidence drawer)
  const handleResolveItem = (id: string) => {
    const item = briefingItems.find((b) => b.id === id);
    if (!item) return;

    setBriefingItems((prev) => prev.filter((b) => b.id !== id));

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
    setMessages((prev) => [resolveMsg, ...prev]);

    showToast(`✓ Resolved ${item.id}: Reconciled ${item.amountFormatted}`);
  };

  // Triggering the "Load demo files" action for the 3-minute pitch
  const handleLoadDemoFiles = () => {
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

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f8fafc] flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden selection:bg-orange-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unresolvedCount={briefingItems.length}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-orange-400 border border-orange-500/40 text-xs sm:text-sm font-mono font-bold px-5 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            <DashboardTab kpis={kpis} />
          )}

          {activeTab === 'agents' && (
            <AgentsTab messages={messages} />
          )}
        </div>
      </main>

      {/* Evidence Viewer Drawer (Modal / Bottom Sheet) */}
      <EvidenceDrawer
        item={selectedBriefingItem}
        onClose={() => setSelectedBriefingItem(null)}
        onResolve={handleResolveItem}
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

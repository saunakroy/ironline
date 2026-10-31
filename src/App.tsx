import { useState } from 'react';
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
import { MaintainerDashboard } from './components/MaintainerDashboard';
import { AgentRelayStream } from './components/AgentRelayStream';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('trucker');
  const [currentDriver, setCurrentDriver] = useState<DriverProfile>(DRIVERS[0]);
  const [drivers] = useState<DriverProfile[]>(DRIVERS);
  const [problems, setProblems] = useState<PlantedProblem[]>(PLANTED_PROBLEMS);
  const [documents, setDocuments] = useState<ExtractedDocument[]>(MOCK_EXTRACTED_DOCS);
  const [loads] = useState(MOCK_LOADS);
  const [messages, setMessages] = useState<AgentRelayMessage[]>(MOCK_AGENT_MESSAGES);
  const [kpis] = useState(MOCK_KPIS);
  const [isAgentStreamOpen, setIsAgentStreamOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleResolveProblem = (id: string) => {
    const resolvedItem = problems.find(p => p.id === id);
    if (!resolvedItem) return;

    setProblems(prev => prev.filter(p => p.id !== id));
    
    // Add audit log to Agent Relay stream
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}`,
      timestamp: timeStr,
      fromAgent: 'briefer',
      toAgent: 'all',
      loadRef: resolvedItem.loadId,
      message: `RESOLVED: ${resolvedItem.id} (${resolvedItem.title}). Reconciled and saved to carrier ledger.`,
      priority: 'normal'
    };
    setMessages(prev => [newMsg, ...prev]);

    setActionNotice(`✓ Resolved ${resolvedItem.id}: ${resolvedItem.suggestedAction}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAddDocument = (newDoc: ExtractedDocument) => {
    setDocuments(prev => [newDoc, ...prev]);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}`,
      timestamp: timeStr,
      fromAgent: 'extractor',
      toAgent: 'reconciler',
      loadRef: newDoc.loadRef,
      message: `MOBILE UPLOAD: ${newDoc.filename} (${newDoc.docClassification}) received from ${newDoc.driverName || 'driver'}. Running cross-check.`,
      priority: 'normal'
    };
    setMessages(prev => [newMsg, ...prev]);
  };

  const handleTriggerReconcile = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const triggerMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}-alarm`,
      timestamp: timeStr,
      fromAgent: 'watchdog',
      toAgent: 'reconciler',
      message: '18:00 EST SCHEDULED CRON: Verifying 4 loads, 12 receipts, and telematics...',
      priority: 'normal'
    };

    setMessages(prev => [triggerMsg, ...prev]);
    setIsAgentStreamOpen(true);
  };

  const activeLoadForDriver = loads.find(l => l.id === currentDriver.currentLoadId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isAgentStreamOpen={isAgentStreamOpen}
        onToggleAgentStream={() => setIsAgentStreamOpen(!isAgentStreamOpen)}
        unresolvedCount={problems.filter(p => p.isTonightBriefing).length}
      />

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-200">
          {actionNotice}
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentRole === 'trucker' ? (
          <TruckerPortal
            drivers={drivers}
            currentDriver={currentDriver}
            onSelectDriver={setCurrentDriver}
            activeLoad={activeLoadForDriver}
            recentDocuments={documents}
            onUploadDocument={handleAddDocument}
          />
        ) : (
          <MaintainerDashboard
            drivers={drivers}
            problems={problems}
            loads={loads}
            kpis={kpis}
            onResolveProblem={handleResolveProblem}
            onSelectDriverForTruckerMode={(driver) => {
              setCurrentDriver(driver);
              setCurrentRole('trucker');
            }}
          />
        )}
      </main>

      {/* Agent Relay Live Stream Drawer */}
      <AgentRelayStream
        messages={messages}
        onTriggerReconcile={handleTriggerReconcile}
        isOpen={isAgentStreamOpen}
        onClose={() => setIsAgentStreamOpen(false)}
      />

      {/* Minimal clean footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 font-mono">
        Ironline Freight LLC • Built for YC Haunted Hacks • Terse Durable Actors & Agent Relay
      </footer>
    </div>
  );
}

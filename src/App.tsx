import { useState } from 'react';
import { 
  PLANTED_PROBLEMS, 
  MOCK_EXTRACTED_DOCS, 
  MOCK_LOADS, 
  MOCK_AGENT_MESSAGES, 
  MOCK_KPIS 
} from './data/mockData';
import { PlantedProblem, ExtractedDocument, LoadItem, AgentRelayMessage, FleetKPIs } from './types';
import { Navbar } from './components/Navbar';
import { NightlyBriefing } from './components/NightlyBriefing';
import { UploadExtractionFeed } from './components/UploadExtractionFeed';
import { FleetDashboard } from './components/FleetDashboard';
import { AgentRelayStream } from './components/AgentRelayStream';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'briefing' | 'upload' | 'dashboard'>('briefing');
  const [problems, setProblems] = useState<PlantedProblem[]>(PLANTED_PROBLEMS);
  const [documents, setDocuments] = useState<ExtractedDocument[]>(MOCK_EXTRACTED_DOCS);
  const [loads] = useState<LoadItem[]>(MOCK_LOADS);
  const [messages, setMessages] = useState<AgentRelayMessage[]>(MOCK_AGENT_MESSAGES);
  const [kpis] = useState<FleetKPIs>(MOCK_KPIS);
  const [isAgentStreamOpen, setIsAgentStreamOpen] = useState<boolean>(false);
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);

  const handleResolveProblem = (id: string) => {
    const resolvedItem = problems.find(p => p.id === id);
    if (!resolvedItem) return;

    setProblems(prev => prev.filter(p => p.id !== id));
    
    // Add an audit trail message to the Agent Relay mesh
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newMsg: AgentRelayMessage = {
      id: `MSG-${Date.now()}`,
      timestamp: timeStr,
      fromAgent: 'briefer',
      toAgent: 'all',
      loadRef: resolvedItem.loadId,
      message: `RESOLVED BY OWNER: ${resolvedItem.id} (${resolvedItem.title}). Updated settlement ledger.`,
      priority: 'normal'
    };
    setMessages(prev => [newMsg, ...prev]);

    setResolvedNotice(`✓ Resolved ${resolvedItem.id}: ${resolvedItem.suggestedAction}`);
    setTimeout(() => setResolvedNotice(null), 4000);
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
      message: `NEW INGESTION: ${newDoc.filename} (${newDoc.docClassification}) processed with ${newDoc.confidenceScore}% confidence. Dispatched to Reconciler.`,
      priority: 'normal'
    };
    setMessages(prev => [newMsg, ...prev]);
  };

  const handleTriggerReconcile = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const triggerMsg1: AgentRelayMessage = {
      id: `MSG-${Date.now()}-1`,
      timestamp: timeStr,
      fromAgent: 'watchdog',
      toAgent: 'reconciler',
      loadRef: 'LD-4091',
      message: 'CRON ALARM: Initiating 18:00 EST cross-document verification on active loads...',
      priority: 'normal'
    };

    const triggerMsg2: AgentRelayMessage = {
      id: `MSG-${Date.now()}-2`,
      timestamp: timeStr,
      fromAgent: 'reconciler',
      toAgent: 'briefer',
      loadRef: 'LD-4091',
      message: 'RECONCILIATION SUMMARY: 5 discrepancies detected across 12 loads. Flagged total $2,688.66.',
      priority: 'alert'
    };

    setMessages(prev => [triggerMsg2, triggerMsg1, ...prev]);
    setIsAgentStreamOpen(true);
  };

  const handleSelectLoad = (loadId: string) => {
    // If user clicks audit on load in dashboard, switch to briefing or filter
    const relatedProblem = problems.find(p => p.loadId === loadId);
    if (relatedProblem) {
      setCurrentTab('briefing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isAgentStreamOpen={isAgentStreamOpen}
        onToggleAgentStream={() => setIsAgentStreamOpen(!isAgentStreamOpen)}
        unresolvedCount={problems.filter(p => p.isTonightBriefing).length}
      />

      {/* Floating Notification Toast */}
      {resolvedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-mono px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom duration-200">
          {resolvedNotice}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'briefing' && (
          <NightlyBriefing
            problems={problems}
            onResolveProblem={handleResolveProblem}
          />
        )}

        {currentTab === 'upload' && (
          <UploadExtractionFeed
            documents={documents}
            onAddDocument={handleAddDocument}
          />
        )}

        {currentTab === 'dashboard' && (
          <FleetDashboard
            kpis={kpis}
            loads={loads}
            onSelectLoad={handleSelectLoad}
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

      {/* Persistent Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        Ironline Freight LLC • Built for YC Haunted Hacks • Powered by Terse Durable Actors & Agent Relay
      </footer>
    </div>
  );
}

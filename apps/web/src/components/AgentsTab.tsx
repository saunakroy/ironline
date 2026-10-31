import React, { useState, useEffect } from 'react';
import { AgentMessage, AgentType } from '../types';
import { 
  ArrowRight, 
  Play, 
  RotateCcw, 
  Cpu, 
  Zap, 
  Clock 
} from 'lucide-react';

interface AgentsTabProps {
  messages: AgentMessage[];
  /** Live mode: run the nightly audit now, and link to the backend's full tracker. */
  onRunCheck?: () => void;
  isChecking?: boolean;
  trackerUrl?: string;
}

export const AgentsTab: React.FC<AgentsTabProps> = ({ messages, onRunCheck, isChecking = false, trackerUrl }) => {
  const [displayedCount, setDisplayedCount] = useState<number>(messages.length);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alert' | 'urgent'>('all');

  const handleStartStream = () => {
    setIsStreaming(true);
    setDisplayedCount(1);
  };

  useEffect(() => {
    if (!isStreaming) return;

    if (displayedCount < messages.length) {
      const timer = setTimeout(() => {
        setDisplayedCount((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsStreaming(false);
    }
  }, [isStreaming, displayedCount, messages.length]);

  const getAgentColor = (agent: AgentType | 'all') => {
    switch (agent) {
      case 'extractor':
        return 'text-sky-800 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/50';
      case 'reconciler':
        return 'text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/50';
      case 'watchdog':
        return 'text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/50';
      case 'briefer':
        return 'text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/50';
      case 'enrichment':
        return 'text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/50';
      case 'all':
      default:
        return 'text-orange-800 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800/50';
    }
  };

  const getAgentName = (agent: AgentType | 'all') => {
    switch (agent) {
      case 'extractor':
        return 'Doc Extractor';
      case 'reconciler':
        return 'Contract Reconciler';
      case 'watchdog':
        return 'Fraud Watchdog';
      case 'briefer':
        return 'Owner Briefer';
      case 'enrichment':
        return 'Data Enrichment';
      case 'all':
      default:
        return 'All Agents (Broadcast)';
    }
  };

  // Live messages keep arriving: show them all unless a replay is running.
  const visibleMessages = messages.slice(0, isStreaming ? displayedCount : messages.length).filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'alert') return m.priority === 'alert' || m.priority === 'urgent';
    return m.priority === 'urgent';
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 4 ACTIVE AGENT SYSTEM OVERVIEW */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 sm:p-6 space-y-4 shadow-xs dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-mono uppercase">
                AI Agent Team: Live Relay
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Watch the 4 agents collaborate in real time to audit paperwork and catch leaks
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onRunCheck && (
              <button
                onClick={onRunCheck}
                disabled={isChecking}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black flex items-center gap-2 transition disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking…' : "Run Tonight's Check"}</span>
              </button>
            )}
            {trackerUrl && (
              <a
                href={trackerUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-bold font-mono text-orange-600 dark:text-orange-400 hover:text-orange-700 border border-orange-300 dark:border-orange-500/40 transition"
              >
                Full Tracker →
              </a>
            )}
            <button
              onClick={handleStartStream}
              disabled={isStreaming}
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black flex items-center gap-2 transition disabled:opacity-50 shadow-md shadow-orange-500/20"
            >
              {isStreaming ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming Messages...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Replay Agent Chat</span>
                </>
              )}
            </button>

            <button
              onClick={() => setDisplayedCount(messages.length)}
              className="p-2 rounded-xl text-xs font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
              title="Show all messages"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Agent Actor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Agent 1: Extractor */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-sky-800 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800/50">
                Extractor
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Paperwork Reader</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Scans receipts, delivery notes, and driver text photos.
            </div>
          </div>

          {/* Agent 2: Reconciler */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/50">
                Reconciler
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Contract Checker</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Compares customer contract terms against dock wait times.
            </div>
          </div>

          {/* Agent 3: Watchdog */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/50">
                Watchdog
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Fraud Detector</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Compares GPS coordinates vs fuel card swipes to catch fraud.
            </div>
          </div>

          {/* Agent 4: Briefer */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50">
                Briefer
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Nightly Briefer</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Compiles the 5 highest-value items for the owner's review.
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR & MESSAGE FEED */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden shadow-xs dark:shadow-none">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#0b1120]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Live Agent Feed ({visibleMessages.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-black font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setActiveFilter('alert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeFilter === 'alert'
                  ? 'bg-orange-500 text-black font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Alerts Only
            </button>
          </div>
        </div>

        {/* Streaming Messages List */}
        <div className="p-4 sm:p-6 space-y-3 font-mono">
          {visibleMessages.map((msg, index) => {
            const isAlert = msg.priority === 'alert';
            const isUrgent = msg.priority === 'urgent';

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-2 animate-in fade-in duration-300 ${
                  isUrgent
                    ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-950/20 shadow-xs dark:shadow-lg dark:shadow-red-950/20'
                    : isAlert
                    ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/15'
                    : 'border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0b1120] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Header: Timestamp, From -> To Routing, Load ID */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {msg.timestamp}
                    </span>

                    {/* From Agent */}
                    <span className={`px-2 py-0.5 rounded font-bold uppercase border ${getAgentColor(msg.from)}`}>
                      {getAgentName(msg.from)}
                    </span>

                    {/* Routing Arrow */}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                    {/* To Agent */}
                    <span className={`px-2 py-0.5 rounded font-bold uppercase border ${getAgentColor(msg.to)}`}>
                      {getAgentName(msg.to)}
                    </span>

                    {msg.loadId && (
                      <span className="text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-300 dark:border-orange-800/40 font-bold">
                        {msg.loadId}
                      </span>
                    )}
                  </div>

                  {/* Priority Tag */}
                  {(isAlert || isUrgent) && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isUrgent 
                        ? 'bg-red-500 text-black font-black' 
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                    }`}>
                      {msg.priority}
                    </span>
                  )}
                </div>

                {/* Message Body */}
                <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans sm:font-mono text-xs sm:text-sm pt-1">
                  {msg.text}
                  {isStreaming && index === visibleMessages.length - 1 && (
                    <span className="inline-block w-1.5 h-3.5 bg-orange-500 ml-1.5 align-middle animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

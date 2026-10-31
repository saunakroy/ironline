import React, { useState } from 'react';
import { AgentRelayMessage } from '../types';
import { Terminal, Send, Play, ShieldAlert, Sparkles, X } from 'lucide-react';

interface AgentRelayStreamProps {
  messages: AgentRelayMessage[];
  onTriggerReconcile: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentRelayStream: React.FC<AgentRelayStreamProps> = ({ 
  messages, 
  onTriggerReconcile, 
  isOpen, 
  onClose 
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'watchdog' | 'reconciler' | 'extractor' | 'briefer'>('all');

  const filteredMessages = messages.filter(m => {
    if (activeFilter === 'all') return true;
    return m.fromAgent === activeFilter || m.toAgent === activeFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Agent Relay Live Stream</h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Mesh Relay • 4 Autonomous Back-Office Agents
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Agents Topology Pill Bar */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800/80">
        <div className="text-[10px] font-mono uppercase text-slate-500 mb-2 font-bold tracking-wider">
          Active Agents on Mesh:
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
          <button
            onClick={() => setActiveFilter(activeFilter === 'extractor' ? 'all' : 'extractor')}
            className={`p-1.5 rounded border transition ${
              activeFilter === 'extractor'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-sky-400 hover:border-slate-700'
            }`}
          >
            Extractor
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'reconciler' ? 'all' : 'reconciler')}
            className={`p-1.5 rounded border transition ${
              activeFilter === 'reconciler'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-purple-400 hover:border-slate-700'
            }`}
          >
            Reconciler
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'watchdog' ? 'all' : 'watchdog')}
            className={`p-1.5 rounded border transition ${
              activeFilter === 'watchdog'
                ? 'bg-red-500/20 border-red-400 text-red-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-red-400 hover:border-slate-700'
            }`}
          >
            Watchdog
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'briefer' ? 'all' : 'briefer')}
            className={`p-1.5 rounded border transition ${
              activeFilter === 'briefer'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-slate-700'
            }`}
          >
            Briefer
          </button>
        </div>
      </div>

      {/* Demo Action Trigger: "Trigger End of Day Reconciliation" */}
      <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between">
        <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Step 4: Cross-agent talk</span>
        </div>
        <button
          onClick={onTriggerReconcile}
          className="px-3 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center gap-1.5 transition shadow"
        >
          <Play className="w-3 h-3 fill-current" />
          Trigger End of Day
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {filteredMessages.map((msg) => (
          <div 
            key={msg.id}
            className={`p-3 rounded-xl border space-y-1.5 transition-all ${
              msg.priority === 'urgent'
                ? 'bg-red-950/20 border-red-800/40'
                : msg.priority === 'alert'
                ? 'bg-amber-950/20 border-amber-800/40'
                : 'bg-slate-900/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  msg.fromAgent === 'extractor' ? 'bg-sky-500/20 text-sky-400' :
                  msg.fromAgent === 'reconciler' ? 'bg-purple-500/20 text-purple-400' :
                  msg.fromAgent === 'watchdog' ? 'bg-red-500/20 text-red-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {msg.fromAgent}
                </span>
                <Send className="w-2.5 h-2.5 text-slate-600" />
                <span className="text-[10px] text-slate-400 uppercase">
                  {msg.toAgent}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                {msg.priority === 'urgent' && <ShieldAlert className="w-3 h-3 text-red-400" />}
                {msg.timestamp}
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {msg.message}
            </p>

            {msg.loadRef && (
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                Context: <strong className="text-amber-400">{msg.loadRef}</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Status */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span>Channel: <strong className="text-slate-200">fleet.relay.v1</strong></span>
        <span className="text-emerald-400">All 4 Agents Online</span>
      </div>
    </div>
  );
};

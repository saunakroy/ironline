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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Agent Relay Live Stream</h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Mesh Relay • 4 Autonomous Back-Office Agents
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Agents Topology Pill Bar */}
      <div className="p-3 bg-white border-b border-slate-100">
        <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold tracking-wider">
          Filter by Active Agent:
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
          <button
            onClick={() => setActiveFilter(activeFilter === 'extractor' ? 'all' : 'extractor')}
            className={`p-1.5 rounded-xl border transition ${
              activeFilter === 'extractor'
                ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-blue-700 hover:bg-slate-100'
            }`}
          >
            Extractor
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'reconciler' ? 'all' : 'reconciler')}
            className={`p-1.5 rounded-xl border transition ${
              activeFilter === 'reconciler'
                ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-purple-700 hover:bg-slate-100'
            }`}
          >
            Reconciler
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'watchdog' ? 'all' : 'watchdog')}
            className={`p-1.5 rounded-xl border transition ${
              activeFilter === 'watchdog'
                ? 'bg-red-600 text-white font-bold border-red-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-red-700 hover:bg-slate-100'
            }`}
          >
            Watchdog
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'briefer' ? 'all' : 'briefer')}
            className={`p-1.5 rounded-xl border transition ${
              activeFilter === 'briefer'
                ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-emerald-700 hover:bg-slate-100'
            }`}
          >
            Briefer
          </button>
        </div>
      </div>

      {/* Demo Action Trigger */}
      <div className="p-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
        <div className="text-xs text-blue-900 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Demo Step 4: Agents talking</span>
        </div>
        <button
          onClick={onTriggerReconcile}
          className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          Trigger 18:00 Alarm
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs bg-slate-50/50">
        {filteredMessages.map((msg) => (
          <div 
            key={msg.id}
            className={`p-3 rounded-2xl border space-y-1.5 bg-white shadow-xs transition-all ${
              msg.priority === 'urgent'
                ? 'border-red-200 ring-1 ring-red-400/20'
                : msg.priority === 'alert'
                ? 'border-amber-200 ring-1 ring-amber-400/20'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  msg.fromAgent === 'extractor' ? 'bg-blue-100 text-blue-800' :
                  msg.fromAgent === 'reconciler' ? 'bg-purple-100 text-purple-800' :
                  msg.fromAgent === 'watchdog' ? 'bg-red-100 text-red-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {msg.fromAgent}
                </span>
                <Send className="w-2.5 h-2.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  {msg.toAgent}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                {msg.priority === 'urgent' && <ShieldAlert className="w-3 h-3 text-red-600" />}
                {msg.timestamp}
              </div>
            </div>

            <p className="text-slate-800 leading-relaxed font-sans text-xs">
              {msg.message}
            </p>

            {msg.loadRef && (
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                Context: <strong className="text-blue-700">{msg.loadRef}</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Status */}
      <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>Channel: <strong className="text-slate-700">fleet.relay.v1</strong></span>
        <span className="text-emerald-700 font-semibold">4 Agents Online</span>
      </div>
    </div>
  );
};

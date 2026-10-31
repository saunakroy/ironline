import React, { useState } from 'react';
import { AgentRelayMessage } from '../types';
import { X, Sparkles, CheckCircle, ShieldAlert, FileText, Play } from 'lucide-react';

interface AgentRelayStreamProps {
  messages: AgentRelayMessage[];
  onTriggerReconcile: () => void;
  isOpen: boolean;
  onClose: () => void;
  /** Live mode: link to the backend's full tracker (every file, every agent). */
  trackerUrl?: string;
  isChecking?: boolean;
}

export const AgentRelayStream: React.FC<AgentRelayStreamProps> = ({ 
  messages, 
  onTriggerReconcile, 
  isOpen, 
  onClose,
  trackerUrl,
  isChecking = false
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'alert' | 'normal'>('all');

  const filteredMessages = messages.filter(m => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'alert') return m.priority === 'alert' || m.priority === 'urgent';
    return m.priority === 'normal';
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Minimal Header */}
      <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Live Activity</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {trackerUrl && (
              <a href={trackerUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Open full tracker →
              </a>
            )}
            <p className="text-xs text-slate-500 font-medium">
              Autonomous back-office agents running in background
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Trigger & Quick Status Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>4 AI agents active</span>
        </div>

        <button
          onClick={onTriggerReconcile}
          disabled={isChecking}
          className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl flex items-center gap-1.5 transition shadow-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isChecking ? 'Checking…' : 'Run Check Now'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold">Filter:</span>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({messages.length})
        </button>
        <button
          onClick={() => setActiveFilter('alert')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            activeFilter === 'alert'
              ? 'bg-amber-600 text-white'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span>Flagged Items</span>
        </button>
      </div>

      {/* Clean Activity Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
        {filteredMessages.map((msg) => {
          const isAlert = msg.priority === 'alert' || msg.priority === 'urgent';

          return (
            <div 
              key={msg.id}
              className={`p-4 rounded-2xl border transition-all bg-white shadow-xs ${
                isAlert ? 'border-amber-200 ring-1 ring-amber-400/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    msg.fromAgent === 'watchdog' ? 'bg-red-50 text-red-600' :
                    msg.fromAgent === 'reconciler' ? 'bg-purple-50 text-purple-600' :
                    msg.fromAgent === 'extractor' ? 'bg-blue-50 text-blue-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {msg.fromAgent === 'watchdog' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                     msg.fromAgent === 'reconciler' ? <Sparkles className="w-3.5 h-3.5" /> :
                     msg.fromAgent === 'extractor' ? <FileText className="w-3.5 h-3.5" /> :
                     <CheckCircle className="w-3.5 h-3.5" />}
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    {msg.fromAgent} Agent
                  </span>
                </div>

                <span className="text-xs text-slate-400 font-medium">
                  {msg.timestamp}
                </span>
              </div>

              {/* Human-friendly Narrative Summary */}
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {msg.humanSummary || msg.message}
              </p>

              {msg.loadRef && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Linked to Load: <strong className="text-blue-700 font-mono">{msg.loadRef}</strong></span>
                  <span className="text-slate-400">Verified</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Minimal Footer */}
      <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span className="font-medium">Powered by Agent Relay & Durable Actors</span>
        <span className="text-emerald-700 font-bold">100% Synced</span>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { BriefingItem } from '../types';
import { X, CheckCircle2, Sparkles, ExternalLink, AlertTriangle, FileText, Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface EvidenceDrawerProps {
  item: BriefingItem | null;
  onClose: () => void;
  onResolve?: (id: string) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ item, onClose, onResolve }) => {
  const [animatedConfidence, setAnimatedConfidence] = useState<number>(0);
  const [isDocOpen, setIsDocOpen] = useState<boolean>(true);
  const [isFieldsOpen, setIsFieldsOpen] = useState<boolean>(true);
  const [isActionOpen, setIsActionOpen] = useState<boolean>(true);

  useEffect(() => {
    if (item) {
      setAnimatedConfidence(0);
      const timer = setTimeout(() => {
        setAnimatedConfidence(item.confidence);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [item]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  if (!item) return null;

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'watchdog':
        return 'text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/50';
      case 'reconciler':
        return 'text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/50';
      case 'extractor':
        return 'text-sky-800 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/50';
      default:
        return 'text-orange-800 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container: slides from right on desktop, bottom sheet on mobile */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0">
        <div 
          className="w-screen max-w-xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:border-t max-sm:border-l-0 animate-drawer-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50 dark:bg-[#0b1120]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                  {item.id}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold uppercase border ${getAgentColor(item.agent)}`}>
                  {item.agent} agent
                </span>
                {item.loadId && (
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {item.loadId}
                  </span>
                )}
                {item.truckId && (
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {item.truckId}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {item.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Dollar Amount & Summary Highlight */}
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-gradient-to-r dark:from-orange-950/40 dark:to-slate-900 border border-orange-200 dark:border-orange-500/30 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-orange-700 dark:text-orange-400 font-semibold">
                  Money at Risk
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-orange-600 dark:text-orange-400 tabular-nums mt-0.5">
                  {item.amountFormatted}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Confidence Score</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {item.confidence}%
                </div>
              </div>
            </div>

            {/* Confidence Progress Meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  AI Document Confidence
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{item.confidence}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-orange-500 transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${animatedConfidence}%` }}
                />
              </div>
            </div>

            {/* Document Evidence Viewer (Collapsible Dropdown) */}
            <div className="space-y-2">
              <div 
                onClick={() => setIsDocOpen(!isDocOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                  Source Document Proof
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={item.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 transition font-mono mr-2 font-semibold"
                  >
                    <span>Full Asset</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {isDocOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </div>

              {/* Vector Document Frame */}
              {isDocOpen && (
                <div className="animate-in fade-in duration-150 space-y-1.5">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-black/60 p-2 overflow-hidden shadow-inner flex items-center justify-center">
                    <img 
                      src={item.evidenceUrl} 
                      alt={item.evidenceTitle}
                      className="max-h-64 w-auto object-contain rounded border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 text-center">
                    {item.evidenceTitle}
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Fields Table with Problem Highlighting (Collapsible Dropdown) */}
            <div className="space-y-2">
              <div 
                onClick={() => setIsFieldsOpen(!isFieldsOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Verified Data & Discrepancies ({item.fields.length})
                </div>
                {isFieldsOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </div>

              {isFieldsOpen && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800/80 bg-slate-50 dark:bg-[#0b1120] overflow-hidden animate-in fade-in duration-150">
                  {item.fields.map((field, idx) => {
                    const isProblem = field.isProblem || item.problemFields.includes(field.label);

                    return (
                      <div 
                        key={idx}
                        className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 transition-all ${
                          isProblem 
                            ? 'bg-orange-100 dark:bg-orange-950/25 border border-orange-300 dark:border-orange-500/50 rounded-lg animate-problem-pulse shadow-xs shadow-orange-500/10' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isProblem && (
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          )}
                          <span className={`font-mono ${isProblem ? 'text-orange-800 dark:text-orange-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {field.label}
                          </span>
                        </div>
                        <div className={`font-mono text-right sm:max-w-[60%] truncate ${
                          isProblem ? 'text-orange-950 dark:text-orange-200 font-bold' : 'text-slate-800 dark:text-slate-200 font-semibold'
                        }`}>
                          {field.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommended Action & Notes (Collapsible Dropdown) */}
            <div className="space-y-2">
              <div 
                onClick={() => setIsActionOpen(!isActionOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-400 font-semibold">
                  Recommended Fix
                </div>
                {isActionOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </div>

              {isActionOpen && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-orange-600 dark:text-orange-400 font-bold">
                      Action to take
                    </div>
                    <div className="text-xs text-slate-800 dark:text-white leading-relaxed">
                      {item.suggestedAction}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                    <span className="text-slate-500 font-semibold block mb-0.5">Why it matters:</span>
                    {item.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 min-h-[44px] transition flex items-center justify-center"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                if (onResolve) onResolve(item.id);
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 text-black flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/20 min-h-[44px] active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Fix & Reconcile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

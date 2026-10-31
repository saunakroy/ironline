import React from 'react';
import { PlantedProblem } from '../types';
import { X, CheckCircle2, ShieldAlert, ArrowRight, ExternalLink, Clock, MapPin, DollarSign, FileText } from 'lucide-react';

interface EvidenceModalProps {
  problem: PlantedProblem | null;
  onClose: () => void;
  onResolve: (id: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ problem, onClose, onResolve }) => {
  if (!problem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 border-b border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {problem.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{problem.title}</h3>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Agent: {problem.agentResponsible}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Load: <span className="font-mono text-slate-200">{problem.loadId || 'N/A'}</span> • Truck: <span className="text-slate-200">{problem.truckId || 'N/A'}</span> • Driver: <span className="text-slate-200">{problem.driver || 'N/A'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Key Impact Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">Financial Impact</div>
                <div className="text-xl font-bold text-amber-400">{problem.impactFormatted}</div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 max-w-xs">
              Discrepancy reconciled automatically across unstructured inputs
            </div>
          </div>

          {/* Side-by-side or Structured Evidence */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" />
              Cross-Document Reconciliation Evidence
            </h4>

            {problem.evidence.type === 'comparison' && problem.evidence.docA && problem.evidence.docB && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doc A */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {problem.evidence.docA.badge}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">
                        {problem.evidence.docA.source}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mb-3">
                      {problem.evidence.docA.title}
                    </div>

                    {problem.evidence.docA.extractedTime && (
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        {problem.evidence.docA.extractedTime}
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wide mb-1">OCR Extracted Clause:</span>
                      "{problem.evidence.docA.highlightText}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Source: Verified Raw Attachment</span>
                    <span className="text-sky-400 flex items-center gap-1 hover:underline cursor-pointer">
                      View file <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Doc B */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {problem.evidence.docB.badge}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">
                        {problem.evidence.docB.source}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mb-3">
                      {problem.evidence.docB.title}
                    </div>

                    {problem.evidence.docB.extractedTime && (
                      <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-950/30 border border-purple-800/40 px-2.5 py-1.5 rounded-lg mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        {problem.evidence.docB.extractedTime}
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wide mb-1">Contract Term:</span>
                      "{problem.evidence.docB.highlightText}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Source: Broker Rate Contract</span>
                    <span className="text-purple-400 flex items-center gap-1 hover:underline cursor-pointer">
                      View file <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {problem.evidence.type === 'telematics' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-red-900/30 space-y-4">
                <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  TELEMATICS & GEOLOCATION ANOMALY DETECTED BY WATCHDOG AGENT
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> Card Swipe Geolocation
                    </div>
                    <div className="text-sm font-bold text-white">Amarillo, Texas</div>
                    <div className="text-xs font-mono text-amber-400 mt-1">14:15 CST — Love's Travel Stop #411</div>
                    <div className="text-xs text-slate-400 mt-2 font-mono">Amount: $800.73 (138.2 gal)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" /> Samsara GPS Real-Time Location
                    </div>
                    <div className="text-sm font-bold text-white">Kansas City, Missouri</div>
                    <div className="text-xs font-mono text-sky-400 mt-1">14:15 CST — I-35 Milepost 18</div>
                    <div className="text-xs text-slate-400 mt-2 font-mono">Telemetry Speed: 62 mph</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-red-950/20 border border-red-800/30 text-xs text-red-300">
                  <strong className="text-white">Analysis:</strong> Kansas City to Amarillo is 580 miles. A vehicle cannot physically traverse 580 miles in under 3 hours without exceeding 193 mph. High confidence of cloned fuel card or manual entry fraud.
                </div>
              </div>
            )}

            {problem.evidence.type === 'document' && problem.evidence.docA && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {problem.evidence.docA.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{problem.evidence.docA.source}</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{problem.evidence.docA.title}</div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                  "{problem.evidence.docA.highlightText}"
                </div>
              </div>
            )}
          </div>

          {/* Agent Reconciliation Reasoning */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Agent Audit Summary & Reasoning
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {problem.evidence.notes}
            </p>
          </div>

          {/* Action Callout */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/30">
            <div className="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-1">
              Recommended Resolution
            </div>
            <p className="text-xs text-slate-200 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {problem.suggestedAction}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 p-6 bg-slate-900/95 border-t border-slate-800 backdrop-blur flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                alert(`Exported formal dispute packet with evidence for ${problem.id}`);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
            >
              Export Dispute PDF
            </button>
            <button
              onClick={() => {
                onResolve(problem.id);
                onClose();
              }}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Fix & Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

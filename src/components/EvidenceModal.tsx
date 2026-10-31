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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {problem.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{problem.title}</h3>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  Agent: {problem.agentResponsible}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Load: <span className="font-mono font-medium text-slate-700">{problem.loadId || 'N/A'}</span> • Truck: <span className="text-slate-700 font-medium">{problem.truckId || 'N/A'}</span> • Driver: <span className="text-slate-700 font-medium">{problem.driver || 'N/A'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Impact Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-800/80 uppercase tracking-wider">Financial Impact</div>
                <div className="text-xl font-bold text-amber-900 font-mono">{problem.impactFormatted}</div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600 hidden sm:block">
              Identified via cross-document agent reconciliation
            </div>
          </div>

          {/* Evidence Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Document Evidence & Verification
            </h4>

            {problem.evidence.type === 'comparison' && problem.evidence.docA && problem.evidence.docB && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doc A */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        {problem.evidence.docA.badge}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[140px]">
                        {problem.evidence.docA.source}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-2">
                      {problem.evidence.docA.title}
                    </div>

                    {problem.evidence.docA.extractedTime && (
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg mb-3">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {problem.evidence.docA.extractedTime}
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">OCR Timestamp:</span>
                      "{problem.evidence.docA.highlightText}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Source: Driver Upload</span>
                    <span className="text-blue-600 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                      View full file <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Doc B */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                        {problem.evidence.docB.badge}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[140px]">
                        {problem.evidence.docB.source}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-2">
                      {problem.evidence.docB.title}
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 mt-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Contract Clause:</span>
                      "{problem.evidence.docB.highlightText}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Source: Broker Rate Contract</span>
                    <span className="text-purple-600 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                      View full file <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {problem.evidence.type === 'telematics' && (
              <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-3">
                <div className="flex items-center gap-2 text-red-700 text-xs font-bold uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Telematics vs. Card Location Anomaly
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-red-100 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" /> Card Swipe Location
                    </div>
                    <div className="text-sm font-bold text-slate-900">Amarillo, Texas</div>
                    <div className="text-xs font-mono text-slate-600 mt-0.5">14:15 CST — Love's Travel Stop</div>
                    <div className="text-xs font-mono font-semibold text-red-600 mt-1">Amount: $800.73 (138.2 gal)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" /> Samsara GPS Telematics
                    </div>
                    <div className="text-sm font-bold text-slate-900">Kansas City, Missouri</div>
                    <div className="text-xs font-mono text-slate-600 mt-0.5">14:15 CST — I-35 Milepost 18</div>
                    <div className="text-xs font-mono font-semibold text-blue-600 mt-1">Speed: 62 mph</div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-red-100">
                  <strong className="text-slate-900">Watchdog Analysis:</strong> Distance between Kansas City and Amarillo is 580 miles. A truck cannot travel 580 miles in under 3 hours. Suspected card cloning.
                </div>
              </div>
            )}

            {problem.evidence.type === 'document' && problem.evidence.docA && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {problem.evidence.docA.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{problem.evidence.docA.source}</span>
                </div>
                <div className="text-sm font-bold text-slate-800">{problem.evidence.docA.title}</div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700">
                  "{problem.evidence.docA.highlightText}"
                </div>
              </div>
            )}
          </div>

          {/* Audit Notes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Reconciliation Details
            </div>
            <p className="text-xs text-slate-700 font-mono leading-relaxed">
              {problem.evidence.notes}
            </p>
          </div>

          {/* Recommended Action */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Recommended Fix
            </div>
            <p className="text-xs text-blue-950 flex items-center gap-2 font-medium">
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {problem.suggestedAction}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-5 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResolve(problem.id);
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Fix & Reconcile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

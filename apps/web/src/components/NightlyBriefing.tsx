import React, { useState } from 'react';
import { PlantedProblem } from '../types';
import { CheckCircle, FileSearch, ArrowUpRight, DollarSign, ChevronDown, ChevronUp, Sparkles, Filter } from 'lucide-react';
import { EvidenceModal } from './EvidenceModal';

interface NightlyBriefingProps {
  problems: PlantedProblem[];
  onResolveProblem: (id: string) => void;
}

export const NightlyBriefing: React.FC<NightlyBriefingProps> = ({ problems, onResolveProblem }) => {
  const [selectedProblem, setSelectedProblem] = useState<PlantedProblem | null>(null);
  const [showAllProblems, setShowAllProblems] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const tonightProblems = problems.filter(p => p.isTonightBriefing);
  const backlogProblems = problems.filter(p => !p.isTonightBriefing);

  // Compute live total at risk
  const tonightTotal = tonightProblems.reduce((sum, p) => sum + (p.impactAmount || 0), 0);

  const displayedProblems = (showAllProblems ? problems : tonightProblems).filter(p => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-700/70 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-red-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-800/40">
                End-of-Day Alarm • 18:00 EST Reconcile Complete
              </span>
              <span className="text-xs font-mono text-slate-400">
                Oct 31, 2026
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              5 Critical Items Need Your Attention Tonight
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-document agents checked rate confirmations, BOL photos, driver texts, and fuel cards against telematics. Here are the discrepancies threatening your margin before settlement.
            </p>
          </div>

          {/* Big Dollar Flag Stat */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-5 shrink-0 flex items-center gap-5 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Total Flagged Tonight
              </div>
              <div className="text-3xl font-black font-mono text-amber-400">
                ${tonightTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 5 of 5 backed by document proof
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-700/50">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Unbilled Detention</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">+$162.50</div>
            <div className="text-[10px] text-slate-500">BOL 4.5 hrs vs 2 hr free</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Rate Mismatch</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">+$300.00</div>
            <div className="text-[10px] text-slate-500">Draft $1,380 vs Signed $1,680</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Unreimbursed Lumper</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">+$175.00</div>
            <div className="text-[10px] text-slate-500">Capstone Dallas Cold receipt</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Fuel Card Fraud</div>
            <div className="text-lg font-bold font-mono text-red-400 mt-0.5">$800.73</div>
            <div className="text-[10px] text-slate-500">Amarillo vs KC 3 hrs apart</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Duplicate Receipt</div>
            <div className="text-lg font-bold font-mono text-red-400 mt-0.5">$1,250.43</div>
            <div className="text-[10px] text-slate-500">Pilot Flying J double entry</div>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filter Category:</span>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Categories ({displayedProblems.length})</option>
            <option value="detention">Detention</option>
            <option value="billing">Billing & Invoicing</option>
            <option value="fuel">Fuel & Expenses</option>
            <option value="lumper">Lumper</option>
            <option value="compliance">Safety & Compliance</option>
          </select>
        </div>

        <button
          onClick={() => setShowAllProblems(!showAllProblems)}
          className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 py-1 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
        >
          {showAllProblems ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show Only Tonight's Top 5
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> View All 12 Planted Problems ({backlogProblems.length} more in backlog)
            </>
          )}
        </button>
      </div>

      {/* Cards Grid */}
      <div className="space-y-4">
        {displayedProblems.map((problem) => (
          <div 
            key={problem.id}
            className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:border-slate-600 bg-slate-900/80 ${
              problem.isTonightBriefing 
                ? 'border-slate-700/80 shadow-md' 
                : 'border-slate-800/60 opacity-90'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {problem.id}
                  </span>
                  
                  <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                    problem.severity === 'critical'
                      ? 'bg-red-950/50 text-red-400 border border-red-800/40'
                      : 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                  }`}>
                    {problem.severity === 'critical' ? 'High Risk' : 'Attention'}
                  </span>

                  <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Agent: {problem.agentResponsible}
                  </span>

                  {problem.loadId && (
                    <span className="text-xs font-mono text-slate-400">
                      Load: <strong className="text-slate-200">{problem.loadId}</strong>
                    </span>
                  )}
                  {problem.truckId && (
                    <span className="text-xs text-slate-400">
                      • {problem.truckId}
                    </span>
                  )}
                  {problem.driver && (
                    <span className="text-xs text-slate-400">
                      • Driver: {problem.driver}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  {problem.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  {problem.description}
                </p>
              </div>

              {/* Right side: Amount & Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">At Stake</div>
                  <div className="text-lg font-black font-mono text-amber-400">
                    {problem.impactFormatted}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProblem(problem)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    Inspect Proof
                  </button>
                  <button
                    onClick={() => onResolveProblem(problem.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Preview */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Recommended Action:</span>
                <span className="text-slate-300">{problem.suggestedAction}</span>
              </div>
              <span 
                onClick={() => setSelectedProblem(problem)}
                className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                Evidence details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <EvidenceModal 
        problem={selectedProblem} 
        onClose={() => setSelectedProblem(null)} 
        onResolve={onResolveProblem}
      />
    </div>
  );
};

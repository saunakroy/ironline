import React, { useState } from 'react';
import { DriverProfile, PlantedProblem, LoadItem, FleetKPIs } from '../types';
import { 
  TrendingUp, 
  Fuel, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  FileSearch, 
  AlertCircle, 
  ShieldAlert, 
  Send, 
  Receipt, 
  Sparkles
} from 'lucide-react';
import { EvidenceModal } from './EvidenceModal';

interface MaintainerDashboardProps {
  drivers: DriverProfile[];
  problems: PlantedProblem[];
  loads: LoadItem[];
  kpis: FleetKPIs;
  onResolveProblem: (id: string) => void;
  onSelectDriverForTruckerMode?: (driver: DriverProfile) => void;
}

export const MaintainerDashboard: React.FC<MaintainerDashboardProps> = ({
  drivers,
  problems,
  loads,
  kpis,
  onResolveProblem,
  onSelectDriverForTruckerMode
}) => {
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>('DRV-104');
  const [selectedProblemForProof, setSelectedProblemForProof] = useState<PlantedProblem | null>(null);
  const [showBacklog, setShowBacklog] = useState<boolean>(false);
  const [toolActionNotice, setToolActionNotice] = useState<string | null>(null);

  const tonightProblems = problems.filter(p => p.isTonightBriefing);
  const backlogProblems = problems.filter(p => !p.isTonightBriefing);
  const totalTonightAtStake = tonightProblems.reduce((sum, p) => sum + (p.impactAmount || 0), 0);

  const handleRunToolAction = (actionName: string, driverName: string) => {
    setToolActionNotice(`✓ Executed "${actionName}" for ${driverName}`);
    setTimeout(() => setToolActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notice */}
      {toolActionNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {toolActionNotice}
        </div>
      )}

      {/* 4 Clean Fleet Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Revenue / Mile</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${kpis.revenuePerMile.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            +$0.40/mi vs 2025 benchmark
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Fuel Cost / Mile</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${kpis.fuelCostPerMile.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            4 active trucks fuel synced
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Open Receivables</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${kpis.openReceivablesTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {kpis.overdueReceivablesCount} invoices overdue
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Unbilled Detention</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            -${kpis.unbilledDetentionLoss.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Recoverable via signed BOLs
          </div>
        </div>
      </div>

      {/* SECTION 1: DRIVERS DASHBOARD (Name, Stats, Expands into Tools) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Fleet Drivers & Active Equipment
            </h2>
            <p className="text-xs text-slate-500">
              Expand any driver card to inspect their live load, reconcile documents, and access tools.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            4 Trucks En Route
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drivers.map((driver) => {
            const isExpanded = expandedDriverId === driver.id;
            const driverLoad = loads.find(l => l.id === driver.currentLoadId);
            const driverProblem = problems.find(p => p.driver === driver.name || p.truckId === driver.truckId);

            return (
              <div 
                key={driver.id} 
                className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm ${
                  isExpanded ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Driver Summary Card */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={driver.avatar} 
                      alt={driver.name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{driver.name}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          driver.status === 'Driving' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          driver.status === 'Loading / Dock' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {driver.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {driver.truckId} • {driver.phone} • Fuel {driver.fuelCardNumber}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedDriverId(isExpanded ? null : driver.id)}
                    className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Driver Stats Pill Row */}
                <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Today's Run</div>
                    <div className="text-sm font-bold font-mono text-slate-900">{driver.todayMiles} mi</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Current Load</div>
                    <div className="text-sm font-bold font-mono text-blue-600 truncate">
                      {driver.currentLoadId || 'None'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Audit Status</div>
                    <div className="text-sm font-bold truncate">
                      {driverProblem ? (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> 1 Flag
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Clean
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE TOOLS ACCORDION */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl space-y-4 animate-in fade-in duration-150">
                    {/* Assigned Load Details */}
                    {driverLoad && (
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span className="uppercase tracking-wider font-mono">Assigned Load {driverLoad.id}</span>
                          <span className="text-emerald-700 font-mono font-bold">${driverLoad.agreedRate.toFixed(2)}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {driverLoad.origin} → {driverLoad.destination}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Broker: {driverLoad.broker} • Status: {driverLoad.status}
                        </div>
                      </div>
                    )}

                    {/* Problem Alert if applicable */}
                    {driverProblem && (
                      <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            {driverProblem.title}
                          </div>
                          <div className="text-xs font-mono font-semibold text-amber-700">
                            {driverProblem.impactFormatted}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedProblemForProof(driverProblem)}
                          className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl transition shadow-xs whitespace-nowrap"
                        >
                          Inspect Proof
                        </button>
                      </div>
                    )}

                    {/* Driver Action Tools */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Driver Action Tools
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleRunToolAction('Detention Reconciler', driver.name)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition flex items-center gap-2 group shadow-xs"
                        >
                          <Clock className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">Detention Audit</div>
                            <div className="text-[10px] text-slate-500">BOL vs 2hr free</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleRunToolAction('Fuel Card Telematics Check', driver.name)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-2 group shadow-xs"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">Fuel Watchdog</div>
                            <div className="text-[10px] text-slate-500">Audit {driver.fuelCardNumber}</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleRunToolAction('SMS Prompt for POD', driver.name)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-400 text-left transition flex items-center gap-2 group shadow-xs"
                        >
                          <Send className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">Prompt POD Photo</div>
                            <div className="text-[10px] text-slate-500">Send driver SMS</div>
                          </div>
                        </button>

                        <button
                          onClick={() => onSelectDriverForTruckerMode && onSelectDriverForTruckerMode(driver)}
                          className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-left transition flex items-center gap-2 group shadow-xs"
                        >
                          <Receipt className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-blue-900">Switch to Driver UI</div>
                            <div className="text-[10px] text-blue-700">Open mobile upload view</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DECLUTTERED NIGHTLY BRIEFING (Focused & Clean) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Nightly End-of-Day Reconciliation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Agents cross-checked all rate confirmations, BOL photos, and fuel transactions at 18:00 EST.
            </p>
          </div>

          <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-500 font-mono">Flagged Tonight</div>
              <div className="text-lg font-black font-mono text-slate-900">
                ${totalTonightAtStake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Clean, Non-overwhelming Priority Cards */}
        <div className="divide-y divide-slate-100">
          {tonightProblems.map((problem) => (
            <div key={problem.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-slate-100 text-slate-700">
                    {problem.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {problem.driver || problem.truckId || 'Fleet-wide'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    via {problem.agentResponsible} agent
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {problem.title}
                </div>

                <div className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                  {problem.description}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <div className="text-sm font-bold font-mono text-slate-900">
                  {problem.impactFormatted}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProblemForProof(problem)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1"
                  >
                    <FileSearch className="w-3.5 h-3.5" /> Proof
                  </button>
                  <button
                    onClick={() => onResolveProblem(problem.id)}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Reconcile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Backlog Toggle (Keeps the page clean) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 py-1 transition"
          >
            {showBacklog ? (
              <>
                <ChevronUp className="w-4 h-4" /> Hide Backlog Items
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> View {backlogProblems.length} Additional Backlog Flags
              </>
            )}
          </button>
        </div>

        {showBacklog && (
          <div className="space-y-3 pt-3 animate-in fade-in">
            {backlogProblems.map((problem) => (
              <div key={problem.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{problem.id}: {problem.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{problem.suggestedAction}</div>
                </div>
                <div className="font-mono font-bold text-slate-800">{problem.impactFormatted}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proof Inspection Modal */}
      <EvidenceModal
        problem={selectedProblemForProof}
        onClose={() => setSelectedProblemForProof(null)}
        onResolve={onResolveProblem}
      />
    </div>
  );
};

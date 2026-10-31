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
  Sparkles,
  Users,
  DollarSign,
  Smartphone
} from 'lucide-react';
import { EvidenceModal } from './EvidenceModal';

interface OwnerDashboardProps {
  drivers: DriverProfile[];
  problems: PlantedProblem[];
  loads: LoadItem[];
  kpis: FleetKPIs;
  onResolveProblem: (id: string) => void;
  onSelectDriverForTruckerMode?: (driver: DriverProfile) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
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
    <div className="space-y-7 pb-16">
      {/* Toast Notice */}
      {toolActionNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {toolActionNotice}
        </div>
      )}

      {/* Simplified Header 1: Fleet Overview Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Fleet Overview</span>
            <span className="text-xs font-bold text-slate-500 font-normal">
              (Financial & Operational Health)
            </span>
          </h2>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            4 Trucks Synced
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Revenue / Mile</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              ${kpis.revenuePerMile.toFixed(2)}
            </div>
            <div className="text-xs font-bold text-emerald-700 mt-1">
              +$0.40/mi vs industry benchmark
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Fuel Cost / Mile</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Fuel className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              ${kpis.fuelCostPerMile.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Diesel index: $5.79/gal
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Open Receivables</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              ${kpis.openReceivablesTotal.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-amber-700 mt-1">
              {kpis.overdueReceivablesCount} invoices overdue (&gt;30d)
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Unbilled Detention</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
              -${kpis.unbilledDetentionLoss.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-rose-700 mt-1">
              Recoverable via signed BOLs
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Header 2: Drivers & Equipment (Name, Stats, Expands into Tools) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Drivers & Equipment</span>
            </h2>
            <p className="text-sm text-slate-500">
              Select any driver to review their load, audit paperwork, or run fleet tools.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
            4 Trucks Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {drivers.map((driver) => {
            const isExpanded = expandedDriverId === driver.id;
            const driverLoad = loads.find(l => l.id === driver.currentLoadId);
            const driverProblem = problems.find(p => p.driver === driver.name || p.truckId === driver.truckId);

            return (
              <div 
                key={driver.id} 
                className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs ${
                  isExpanded ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Driver Card Header */}
                <div 
                  onClick={() => setExpandedDriverId(isExpanded ? null : driver.id)}
                  className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={driver.avatar} 
                      alt={driver.name} 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{driver.name}</h3>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                          driver.status === 'Driving' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          driver.status === 'Loading / Dock' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {driver.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {driver.truckId} • {driver.phone} • {driver.fuelCardNumber}
                      </p>
                    </div>
                  </div>

                  <button
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Driver Stats Row */}
                <div className="px-5 sm:px-6 pb-5 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Miles</div>
                    <div className="text-base sm:text-lg font-black font-mono text-slate-900 mt-0.5">{driver.todayMiles} mi</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Load ID</div>
                    <div className="text-base sm:text-lg font-black font-mono text-blue-600 truncate mt-0.5">
                      {driver.currentLoadId || 'None'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Status</div>
                    <div className="text-base sm:text-lg font-bold truncate mt-0.5">
                      {driverProblem ? (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> 1 Flag
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Clean
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE TOOLS ACCORDION */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50/70 rounded-b-3xl space-y-4 animate-in fade-in duration-150">
                    {/* Assigned Load Details */}
                    {driverLoad && (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                          <span className="font-mono uppercase">Assigned Load {driverLoad.id}</span>
                          <span className="text-emerald-700 font-mono font-bold text-sm">${driverLoad.agreedRate.toFixed(2)}</span>
                        </div>
                        <div className="text-base font-bold text-slate-900">
                          {driverLoad.origin} → {driverLoad.destination}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          Broker: <strong>{driverLoad.broker}</strong> • Status: {driverLoad.status}
                        </div>
                      </div>
                    )}

                    {/* Discrepancy Flag Banner */}
                    {driverProblem && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            {driverProblem.title}
                          </div>
                          <div className="text-xs font-mono font-bold text-amber-800">
                            Impact: {driverProblem.impactFormatted}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedProblemForProof(driverProblem)}
                          className="px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <FileSearch className="w-3.5 h-3.5 text-blue-600" />
                          Inspect Proof
                        </button>
                      </div>
                    )}

                    {/* Expandable Action Tools */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                        Driver Action Tools
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => handleRunToolAction('Detention Reconciler', driver.name)}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 text-left transition flex items-center gap-3 group shadow-xs active:scale-98"
                        >
                          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">Detention Audit</div>
                            <div className="text-xs text-slate-500 font-medium">BOL vs 2hr free</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleRunToolAction('Fuel Watchdog', driver.name)}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3 group shadow-xs active:scale-98"
                        >
                          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">Fuel Watchdog</div>
                            <div className="text-xs text-slate-500 font-medium">Audit {driver.fuelCardNumber}</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleRunToolAction('Send Driver SMS Prompt', driver.name)}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 text-left transition flex items-center gap-3 group shadow-xs active:scale-98"
                        >
                          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                            <Send className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">Prompt POD Photo</div>
                            <div className="text-xs text-slate-500 font-medium">Send SMS to driver</div>
                          </div>
                        </button>

                        <button
                          onClick={() => onSelectDriverForTruckerMode && onSelectDriverForTruckerMode(driver)}
                          className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-left transition flex items-center gap-3 group shadow-xs active:scale-98"
                        >
                          <div className="p-2 rounded-xl bg-blue-600 text-white group-hover:scale-110 transition-transform">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-blue-950">Switch to Driver UI</div>
                            <div className="text-xs text-blue-700 font-medium">Open mobile view</div>
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

      {/* Simplified Header 3: Nightly End-of-Day Reconciliation */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Nightly Reconciliation
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Cross-checked rate confirmations, BOL timestamps, and fuel receipts at 18:00 EST.
            </p>
          </div>

          <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 flex items-center gap-3.5 self-start sm:self-auto">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <div>
              <div className="text-xs font-bold uppercase text-slate-500 font-mono">Flagged Tonight</div>
              <div className="text-xl font-black font-mono text-slate-900">
                ${totalTonightAtStake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Clean Priority Cards */}
        <div className="divide-y divide-slate-100">
          {tonightProblems.map((problem) => (
            <div key={problem.id} className="py-4.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {problem.id}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {problem.driver || problem.truckId || 'Fleet-wide'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    via {problem.agentResponsible} agent
                  </span>
                </div>

                <div className="text-base font-bold text-slate-900">
                  {problem.title}
                </div>

                <div className="text-sm text-slate-600 line-clamp-2 max-w-2xl">
                  {problem.description}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <div className="text-base sm:text-lg font-black font-mono text-slate-900">
                  {problem.impactFormatted}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProblemForProof(problem)}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition flex items-center gap-1.5"
                  >
                    <FileSearch className="w-4 h-4 text-blue-600" /> Proof
                  </button>
                  <button
                    onClick={() => onResolveProblem(problem.id)}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Reconcile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Backlog Accordion Toggle */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 py-1 transition"
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
              <div key={problem.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-bold text-slate-900">{problem.id}: {problem.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{problem.suggestedAction}</div>
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

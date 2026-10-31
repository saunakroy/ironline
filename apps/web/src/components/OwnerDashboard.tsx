import React, { useState } from 'react';
import { DriverProfile, PlantedProblem, LoadItem, FleetKPIs } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldAlert, 
  Send, 
  Sparkles,
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
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
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
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      {toolActionNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toolActionNotice}</span>
        </div>
      )}

      {/* 1. Minimalist Metric Strip */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500">Revenue / Mile</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${kpis.revenuePerMile.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-600 font-medium">+$0.40 vs benchmark</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <div className="text-xs font-semibold text-slate-500">Fuel Cost / Mile</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${kpis.fuelCostPerMile.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">4 trucks fuel synced</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <div className="text-xs font-semibold text-slate-500">Open Receivables</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${kpis.openReceivablesTotal.toLocaleString()}
            </div>
            <div className="text-xs text-amber-600 font-medium">{kpis.overdueReceivablesCount} invoices overdue</div>
          </div>

          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <div className="text-xs font-semibold text-slate-500">Unbilled Detention</div>
            <div className="text-2xl font-bold font-mono text-rose-600">
              -${kpis.unbilledDetentionLoss.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">Recoverable on BOLs</div>
          </div>
        </div>
      </div>

      {/* 2. Nightly Action Items (Primary Focus for Owner) */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Action Items Tonight
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated reconciliation across documents and telematics
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">At Risk</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              ${totalTonightAtStake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Minimal Item List */}
        <div className="divide-y divide-slate-100">
          {tonightProblems.map((problem) => (
            <div 
              key={problem.id} 
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {problem.id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {problem.truckId || problem.driver || 'Fleet'}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  {problem.title}
                </div>

                <div className="text-xs text-slate-500 max-w-xl line-clamp-1">
                  {problem.suggestedAction}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-sm font-bold font-mono text-slate-900 sm:text-right">
                  {problem.impactFormatted}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProblemForProof(problem)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  >
                    Proof
                  </button>
                  <button
                    onClick={() => onResolveProblem(problem.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle Backlog Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 py-1 transition"
          >
            {showBacklog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showBacklog ? 'Hide archive' : `View ${backlogProblems.length} backlog flags`}</span>
          </button>

          {showBacklog && (
            <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 animate-in fade-in">
              {backlogProblems.map((problem) => (
                <div key={problem.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="text-slate-700">
                    <strong className="text-slate-900">{problem.id}:</strong> {problem.title}
                  </div>
                  <div className="font-mono font-medium text-slate-600">{problem.impactFormatted}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Fleet Drivers (Clean Horizontal Rows with Subtle Drawer) */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Fleet Trucks & Drivers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active assignments and driver tools
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            4 Trucks
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {drivers.map((driver) => {
            const isExpanded = expandedDriverId === driver.id;
            const driverLoad = loads.find(l => l.id === driver.currentLoadId);
            const driverProblem = problems.find(p => p.driver === driver.name || p.truckId === driver.truckId);

            return (
              <div key={driver.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                {/* Driver Row */}
                <div 
                  onClick={() => setExpandedDriverId(isExpanded ? null : driver.id)}
                  className="flex items-center justify-between gap-4 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={driver.avatar} 
                      alt={driver.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {driver.name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {driver.truckId}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            driver.status === 'Driving' ? 'bg-blue-500' :
                            driver.status === 'Loading / Dock' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          {driver.status}
                        </span>
                      </div>
                      
                      {driverLoad && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{driverLoad.origin} → {driverLoad.destination}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700 font-medium">${driverLoad.agreedRate.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-bold text-slate-900">{driver.todayMiles} mi</div>
                      <div className="text-[11px] text-slate-400">
                        {driverProblem ? (
                          <span className="text-amber-600 font-medium">1 Flag</span>
                        ) : (
                          <span className="text-emerald-600">Clean</span>
                        )}
                      </div>
                    </div>

                    <button className="text-slate-400 group-hover:text-slate-700 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Minimalist Expanded Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 rounded-xl space-y-3 animate-in fade-in duration-150">
                    {driverProblem && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-center justify-between text-xs">
                        <div className="text-amber-900 font-medium">
                          <strong>Flag:</strong> {driverProblem.title} ({driverProblem.impactFormatted})
                        </div>
                        <button
                          onClick={() => setSelectedProblemForProof(driverProblem)}
                          className="text-xs font-bold text-amber-800 hover:underline"
                        >
                          View Proof →
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleRunToolAction('Detention Audit', driver.name)}
                        className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-left transition flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800">Detention Audit</span>
                      </button>

                      <button
                        onClick={() => handleRunToolAction('Fuel Check', driver.name)}
                        className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-left transition flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800">Fuel Check</span>
                      </button>

                      <button
                        onClick={() => handleRunToolAction('Prompt POD', driver.name)}
                        className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-left transition flex items-center gap-2"
                      >
                        <Send className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800">Prompt POD</span>
                      </button>

                      <button
                        onClick={() => onSelectDriverForTruckerMode && onSelectDriverForTruckerMode(driver)}
                        className="p-2.5 bg-white border border-blue-200 hover:bg-blue-50/50 rounded-lg text-left transition flex items-center gap-2"
                      >
                        <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-700">View as Driver</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

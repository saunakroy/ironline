import React, { useState } from 'react';
import { FleetKPIs, LoadItem } from '../types';
import { TrendingUp, Fuel, Clock, Map, Search, AlertCircle, CheckCircle2, Shield, ArrowUpRight } from 'lucide-react';

interface FleetDashboardProps {
  kpis: FleetKPIs;
  loads: LoadItem[];
  onSelectLoad?: (loadId: string) => void;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({ kpis, loads, onSelectLoad }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLoads = loads.filter((load) => {
    const matchesSearch = 
      load.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.broker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'discrepancy') return matchesSearch && load.hasDiscrepancy;
    return matchesSearch && load.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* 5 Fixed KPI Cards from Onboarding Spec */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Revenue per mile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Revenue / Mile</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ${kpis.revenuePerMile.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            +17.3% vs $2.336 avg benchmark
          </div>
        </div>

        {/* KPI 2: Fuel cost per mile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Fuel Cost / Mile</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ${kpis.fuelCostPerMile.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">
            Priced at $5.79/gal diesel
          </div>
        </div>

        {/* KPI 3: Open Receivables & Aging */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Open Receivables</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ${kpis.openReceivablesTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {kpis.overdueReceivablesCount} invoices &gt;30d past due
          </div>
        </div>

        {/* KPI 4: Detention Billed vs Incurred */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Detention Gap</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-red-400">
            -${kpis.unbilledDetentionLoss.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Incurred unbilled dwell time
          </div>
        </div>

        {/* KPI 5: IFTA Miles Preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">IFTA Miles (Oct)</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Map className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {kpis.monthlyIftaMiles.toLocaleString()} mi
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            OH (42%) • IN (28%) • TX (18%)
          </div>
        </div>
      </div>

      {/* Durable Actors & Real-Time Sync Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Terse Durable Actors Engine Active
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                5 State Machines Live
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Each load maintains persistent state across server restarts. Scheduled nightly alarms fire at 18:00 EST.
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right font-mono text-xs text-slate-400">
          Sync Status: <span className="text-emerald-400">Persistent</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search load, broker, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition ${
                statusFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Loads ({loads.length})
            </button>
            <button
              onClick={() => setStatusFilter('discrepancy')}
              className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'discrepancy'
                  ? 'bg-red-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Discrepancies ({loads.filter(l => l.hasDiscrepancy).length})
            </button>
            <button
              onClick={() => setStatusFilter('Delivered')}
              className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition ${
                statusFilter === 'Delivered'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Loads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Load ID</th>
                <th className="py-3 px-4">Broker / Lane</th>
                <th className="py-3 px-4">Truck & Driver</th>
                <th className="py-3 px-4">Contract vs Invoiced</th>
                <th className="py-3 px-4">Durable Actor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLoads.map((load) => (
                <tr key={load.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {load.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{load.broker}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{load.origin} → {load.destination}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-300">{load.truck}</div>
                    <div className="text-[11px] text-slate-500">{load.driver}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <div className="text-slate-200">
                      Rate: ${load.agreedRate.toFixed(2)}
                    </div>
                    {load.invoicedRate && (
                      <div className={`text-[11px] font-bold ${
                        load.invoicedRate < load.agreedRate 
                          ? 'text-red-400' 
                          : load.invoicedRate > load.agreedRate 
                          ? 'text-emerald-400' 
                          : 'text-slate-400'
                      }`}>
                        Inv: ${load.invoicedRate.toFixed(2)}
                        {load.invoicedRate < load.agreedRate && ' (Underbilled!)'}
                        {load.invoicedRate > load.agreedRate && ' (Detention added)'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] bg-slate-950 text-sky-400 border border-sky-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      {load.durableActorState.state}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Alarm: {load.durableActorState.scheduledReconcile}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                      load.status === 'Paid' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                      load.status === 'Delivered' ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' :
                      load.status === 'Missing Docs' ? 'bg-red-950/60 text-red-400 border border-red-800/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {load.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                      {load.status === 'Missing Docs' && <AlertCircle className="w-3 h-3" />}
                      {load.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectLoad && onSelectLoad(load.id)}
                      className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
                    >
                      Audit <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

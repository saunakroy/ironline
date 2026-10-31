import React, { useState } from 'react';
import { FleetKPIs } from '../types';
import { 
  TrendingUp, 
  Fuel, 
  Clock, 
  AlertCircle, 
  Map, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';

interface DashboardTabProps {
  kpis: FleetKPIs;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ kpis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const demoLoads = [
    {
      id: 'LD-4091',
      broker: 'Apex Freight Logistics',
      lane: 'Columbus, OH → Atlanta, GA',
      truck: 'Truck 104',
      driver: 'Marcus Vance',
      rate: '$2,450.00',
      status: 'Loading / Dock',
      actor: 'Active (Detention Timer)',
      hasAlert: true
    },
    {
      id: 'LD-4088',
      broker: 'CH Robinson',
      lane: 'Chicago, IL → Dallas, TX',
      truck: 'Truck 101',
      driver: 'Dave Kowalski',
      rate: '$1,680.00',
      status: 'In Transit',
      actor: 'Rate Con Reconciled',
      hasAlert: true
    },
    {
      id: 'LD-4093',
      broker: 'TQL Logistics',
      lane: 'Indianapolis, IN → Dallas, TX',
      truck: 'Truck 103',
      driver: 'Elena Rostova',
      rate: '$2,800.00',
      status: 'Delivered',
      actor: 'Lumper Ingestion',
      hasAlert: true
    },
    {
      id: 'LD-4085',
      broker: 'Coyote Logistics',
      lane: 'Kansas City, MO → Denver, CO',
      truck: 'Truck 102',
      driver: 'Ben Miller',
      rate: '$1,920.00',
      status: 'In Transit',
      actor: 'Geo-Velocity Guard',
      hasAlert: true
    },
    {
      id: 'LD-4082',
      broker: 'Landstar Ranger',
      lane: 'Cincinnati, OH → Louisville, KY',
      truck: 'Truck 105',
      driver: 'Sam Jenkins',
      rate: '$1,150.00',
      status: 'Delivered',
      actor: 'Ready to Invoice',
      hasAlert: false
    }
  ];

  const filteredLoads = demoLoads.filter((load) => {
    const matchesSearch = 
      load.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.broker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.lane.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.driver.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'alert') return matchesSearch && load.hasAlert;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 5 FIXED KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Revenue per mile */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Revenue / Mile</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              ${kpis.revenuePerMile.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+17.3% vs benchmark</span>
            </div>
          </div>
          {/* Mini SVG Sparkline */}
          <div className="h-6 w-full pt-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0,20 Q 20,18 40,12 T 70,6 T 100,2"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2: Fuel cost per mile */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Fuel Cost / Mile</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              ${kpis.fuelCostPerMile.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-amber-400">
              <span>Avg $5.79/gal diesel</span>
            </div>
          </div>
          {/* Mini Sparkline */}
          <div className="h-6 w-full pt-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0,8 Q 25,14 50,10 T 80,18 T 100,12"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 3: Open Receivables & Aging */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Open Receivables</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              ${kpis.openReceivablesTotal.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span>{kpis.overdueReceivablesCount} invoices &gt;30d</span>
            </div>
          </div>

          {/* Stacked Aging Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-slate-800 flex overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: '75.6%' }} title="<30d: $32,450" />
              <div className="bg-amber-500 h-full" style={{ width: '17.7%' }} title="31-60d: $7,590" />
              <div className="bg-red-500 h-full" style={{ width: '6.7%' }} title=">60d: $2,850" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>&lt;30d 76%</span>
              <span>31-60d 18%</span>
              <span className="text-red-400">&gt;60d 7%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Detention Billed vs Incurred */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Detention Leakage</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-red-400 tabular-nums">
              -${kpis.unbilledDetentionLoss.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-red-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Unbilled dwell time</span>
            </div>
          </div>
          {/* Recovery Note */}
          <div className="text-[10px] text-slate-500 font-mono">
            P1 adds +$162.50 to recovery
          </div>
        </div>

        {/* KPI 5: Miles by state (IFTA preview) */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">IFTA Miles (Oct)</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Map className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {kpis.monthlyIftaMiles.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              4 states logged via telematics
            </div>
          </div>
          {/* Mini State Breakdown */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <span className="text-orange-400">OH 39%</span>
            <span>·</span>
            <span className="text-sky-400">IN 28%</span>
            <span>·</span>
            <span className="text-purple-400">IL 18%</span>
            <span>·</span>
            <span className="text-emerald-400">KY 15%</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-[#0b1120]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search loads by ID, broker, driver, or lane..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-orange-500 text-black font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            All Loads ({demoLoads.length})
          </button>
          <button
            onClick={() => setStatusFilter('alert')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
              statusFilter === 'alert'
                ? 'bg-orange-500 text-black font-bold'
                : 'text-orange-400 hover:text-orange-300 bg-orange-950/20 border border-orange-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Needs Attention (4)
          </button>
        </div>
      </div>

      {/* ACTIVE LOADS TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-400" />
              <span>Active Loads & Terse Durable Actors</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live actor processes reconciling individual load state machines
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5 Actors Live</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1120] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Load ID</th>
                <th className="p-3.5">Broker & Lane</th>
                <th className="p-3.5">Truck & Driver</th>
                <th className="p-3.5">Agreed Rate</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Durable Actor State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredLoads.map((load) => (
                <tr key={load.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-bold text-orange-400">{load.id}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{load.broker}</div>
                    <div className="text-slate-400 text-[11px]">{load.lane}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-200">{load.truck}</div>
                    <div className="text-slate-500 text-[11px]">{load.driver}</div>
                  </td>
                  <td className="p-3.5 text-white font-bold tabular-nums">{load.rate}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {load.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1.5 w-fit ${
                      load.hasAlert
                        ? 'bg-amber-950/30 text-amber-400 border-amber-800/40'
                        : 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {load.actor}
                    </span>
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

import React from 'react';
import { ActiveTab } from '../types';
import { Truck, LayoutDashboard, Cpu, Home, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unresolvedCount: number;
  agentCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  unresolvedCount,
  agentCount = 4
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b14]/95 backdrop-blur-md">
      {/* Slim Top Status Strip */}
      <div className="w-full bg-[#0b1120] border-b border-slate-800/80 px-4 py-1.5 text-[11px] font-mono text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-300">
              <strong className="text-white font-semibold">{agentCount} AI agents online</strong> · 12 shipments monitored · next audit 6:00 pm
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500 text-[10px]">
            <span>Actor Engine: <span className="text-emerald-400 font-semibold">Active</span></span>
            <span>·</span>
            <span>Latency: 42ms</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/20">
            <Truck className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white font-mono">IRONLINE</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden xs:block">
              Fleet Back-Office AI
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-[#0f172a] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange('home')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 sm:gap-2 min-h-[38px] ${
              activeTab === 'home'
                ? 'bg-orange-500 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
            {unresolvedCount > 0 && activeTab !== 'home' && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 sm:gap-2 min-h-[38px] ${
              activeTab === 'dashboard'
                ? 'bg-orange-500 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('agents')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 sm:gap-2 min-h-[38px] relative ${
              activeTab === 'agents'
                ? 'bg-orange-500 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agents</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
            </span>
          </button>
        </nav>

        {/* Right side status / security tag */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Audit Log Synced</span>
        </div>
      </div>
    </header>
  );
};

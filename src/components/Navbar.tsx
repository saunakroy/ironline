import React from 'react';
import { Truck, Bell, FileText, BarChart3, Terminal, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: 'briefing' | 'upload' | 'dashboard';
  onTabChange: (tab: 'briefing' | 'upload' | 'dashboard') => void;
  isAgentStreamOpen: boolean;
  onToggleAgentStream: () => void;
  unresolvedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  isAgentStreamOpen,
  onToggleAgentStream,
  unresolvedCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Truck className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-mono">IRONLINE</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                YC Haunted Hacks
              </span>
            </div>
            <div className="text-[11px] text-slate-400 -mt-0.5 font-medium hidden sm:block">
              Fleet Back-Office Autonomous Agents
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange('briefing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              currentTab === 'briefing'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Nightly Briefing</span>
            {unresolvedCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                currentTab === 'briefing' ? 'bg-slate-950 text-amber-400' : 'bg-red-500 text-white'
              }`}>
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('upload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              currentTab === 'upload'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Intake & Extraction</span>
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              currentTab === 'dashboard'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Fleet KPIs & Loads</span>
          </button>
        </nav>

        {/* Right Side Sponsors & Agent Relay Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Terse Actors</span>
          </div>

          <button
            onClick={onToggleAgentStream}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border flex items-center gap-2 transition ${
              isAgentStreamOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Agent Relay</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
};

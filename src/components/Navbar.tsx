import React from 'react';
import { UserRole } from '../types';
import { Truck, Terminal, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isAgentStreamOpen: boolean;
  onToggleAgentStream: () => void;
  unresolvedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  isAgentStreamOpen,
  onToggleAgentStream,
  unresolvedCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Truck className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-900 font-mono">IRONLINE</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
                YC Haunted Hacks
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium hidden md:block">
              Fleet Back-Office Autonomous Agents
            </div>
          </div>
        </div>

        {/* ROLE SWITCHER: Trucker View vs Maintainer View */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
          <button
            onClick={() => onRoleChange('trucker')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentRole === 'trucker'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🚛</span>
            <span>Trucker View</span>
          </button>

          <button
            onClick={() => onRoleChange('maintainer')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
              currentRole === 'maintainer'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👔</span>
            <span>Maintainer</span>
            {unresolvedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-emerald-700 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Terse Actors</span>
          </div>

          <button
            onClick={onToggleAgentStream}
            className={`p-2 sm:px-3 sm:py-1.5 text-xs font-mono font-semibold rounded-xl border flex items-center gap-2 transition ${
              isAgentStreamOpen
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
            title="Agent Relay Live Stream"
          >
            <Terminal className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Relay Stream</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
};

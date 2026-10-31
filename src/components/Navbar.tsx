import React from 'react';
import { UserRole } from '../types';
import { Truck, Terminal, ShieldCheck, Users, Wrench } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Simplified Brand Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Truck className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 font-mono">IRONLINE</span>
            </div>
            <div className="text-xs text-slate-500 font-semibold hidden sm:block">
              Fleet Back-Office AI
            </div>
          </div>
        </div>

        {/* Simplified Role Switcher (Larger & Touch-Friendly) */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => onRoleChange('trucker')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              currentRole === 'trucker'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Driver View</span>
          </button>

          <button
            onClick={() => onRoleChange('maintainer')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 relative ${
              currentRole === 'maintainer'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Maintainer</span>
            {unresolvedCount > 0 && (
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Durable Actors Live</span>
          </div>

          <button
            onClick={onToggleAgentStream}
            className={`p-2.5 sm:px-4 sm:py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition ${
              isAgentStreamOpen
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
            title="Agent Relay Live Stream"
          >
            <Terminal className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Agent Relay</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
};

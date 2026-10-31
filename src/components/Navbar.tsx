import React from 'react';
import { ActiveTab, UserRole, DriverSession } from '../types';
import { Truck, LayoutDashboard, Cpu, Home, Smartphone } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unresolvedCount: number;
  agentCount?: number;
  currentRole: UserRole;
  activeDriver: DriverSession;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  unresolvedCount,
  agentCount = 4,
  currentRole,
  activeDriver,
  onOpenLoginModal
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand with Cool Radar Sweep Effect */}
        <div 
          onClick={onOpenLoginModal}
          className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
          title="Ironline Fleet Terminal - Click to switch profile"
        >
          <div className="relative">
            {/* Rotating radar aura behind the logo */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500/40 via-sky-400/20 to-orange-500/40 blur-xs animate-radar-sweep opacity-75 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/50 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-wider text-white font-mono group-hover:text-orange-400 transition-colors">
                IRONLINE
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden xs:block">
              Fleet Back-Office AI
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Available in Owner mode; simplified in Trucker mode) */}
        {currentRole === 'owner' ? (
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
        ) : (
          <div className="flex items-center gap-2 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-sky-500/30 text-xs font-mono text-sky-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="font-bold">In-Cab Mode Active</span>
          </div>
        )}

        {/* Right side interactive Profile / Login Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLoginModal}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition border card-hover-glow min-h-[40px] ${
              currentRole === 'owner'
                ? 'bg-orange-950/30 text-orange-300 border-orange-500/40 hover:bg-orange-950/50'
                : 'bg-sky-950/30 text-sky-300 border-sky-500/40 hover:bg-sky-950/50'
            }`}
            title="Terminal Login / Switch Role"
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              currentRole === 'owner' ? 'bg-orange-400' : 'bg-sky-400'
            }`} />
            <span className="hidden sm:inline">
              {currentRole === 'owner' ? 'Owner: Marcus V.' : `Cab: ${activeDriver.name.split(' ')[0]} (${activeDriver.truckId})`}
            </span>
            <span className="sm:hidden font-bold">
              {currentRole === 'owner' ? 'Owner' : 'Cab'}
            </span>
            <span className="text-[10px] font-bold opacity-75">Login / Switch ▾</span>
          </button>
        </div>
      </div>
    </header>
  );
};


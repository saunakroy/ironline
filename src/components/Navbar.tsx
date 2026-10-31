import React, { useState } from 'react';
import { ActiveTab, UserRole, DriverSession, ThemeMode } from '../types';
import { 
  Truck, 
  LayoutDashboard, 
  Cpu, 
  Home, 
  Smartphone, 
  ChevronDown, 
  Building2, 
  ShieldCheck, 
  KeyRound,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unresolvedCount: number;
  agentCount?: number;
  currentRole: UserRole;
  activeDriver: DriverSession;
  demoDrivers?: DriverSession[];
  onSelectRole: (role: UserRole, driver?: DriverSession) => void;
  onOpenLoginModal?: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  unresolvedCount,
  agentCount = 4,
  currentRole,
  activeDriver,
  demoDrivers = [],
  onSelectRole,
  onOpenLoginModal,
  theme,
  onToggleTheme
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md">
      {/* Slim Top Status Strip */}
      <div className="w-full bg-slate-50 dark:bg-[#0b1120] border-b border-slate-200 dark:border-slate-800/80 px-4 py-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white font-semibold">{agentCount} AI agents online</strong> · 12 shipments monitored · next audit 6:00 pm
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500 text-[10px]">
            <span>Actor Engine: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span></span>
            <span>·</span>
            <span>Latency: 42ms</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand with Cool Radar Sweep Effect */}
        <div 
          onClick={() => onTabChange('home')}
          className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
          title="Ironline Fleet Command"
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
              <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white font-mono group-hover:text-orange-500 transition-colors">
                IRONLINE
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden xs:block">
              Fleet Back-Office AI
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Available in Owner mode; simplified in Trucker mode) */}
        {currentRole === 'owner' ? (
          <nav className="flex items-center bg-slate-100 dark:bg-[#0f172a] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onTabChange('home')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 sm:gap-2 min-h-[38px] ${
                activeTab === 'home'
                  ? 'bg-orange-500 text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
              {unresolvedCount > 0 && activeTab !== 'home' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30">
                  {unresolvedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 sm:gap-2 min-h-[38px] ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('agents')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 sm:gap-2 min-h-[38px] relative ${
                activeTab === 'agents'
                  ? 'bg-orange-500 text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          <div className="flex items-center gap-2 bg-sky-50 dark:bg-[#0f172a] px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-500/30 text-xs font-mono text-sky-700 dark:text-sky-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="font-bold">In-Cab Mode Active</span>
          </div>
        )}

        {/* Profile & Theme Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Theme Toggle (Sun / Moon) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 min-h-[40px] min-w-[40px] flex items-center justify-center select-none"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
            )}
          </button>

          {/* Profile Picture & Account Menu (Replacing Login / Logout) */}
          <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 transition-all select-none group min-h-[44px]"
            aria-label="User Profile Menu"
            aria-expanded={isProfileOpen}
          >
            {/* The Profile Picture Avatar */}
            <div className="relative shrink-0">
              <div 
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-black text-xs sm:text-sm border transition-all duration-200 group-hover:scale-105 shadow-md ${
                  currentRole === 'owner'
                    ? 'bg-gradient-to-br from-orange-100 to-amber-200 text-orange-800 border-orange-300 dark:from-orange-500/25 dark:via-slate-900 dark:to-[#070b14] dark:text-orange-400 dark:border-orange-500/50 shadow-orange-500/10 dark:shadow-orange-500/20'
                    : 'bg-gradient-to-br from-sky-100 to-blue-200 text-sky-800 border-sky-300 dark:from-sky-500/25 dark:via-slate-900 dark:to-[#070b14] dark:text-sky-400 dark:border-sky-500/50 shadow-sky-500/10 dark:shadow-sky-500/20'
                }`}
              >
                {currentRole === 'owner' ? (
                  <span>MV</span>
                ) : (
                  <span>{activeDriver.name.split(' ').map((n) => n[0]).join('')}</span>
                )}
              </div>

              {/* Glowing active online beacon on avatar */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#070b14]" />
              </span>
            </div>

            {/* Profile identity text (desktop & tablet) */}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                <span>{currentRole === 'owner' ? 'Marcus Vance' : activeDriver.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-orange-500' : ''}`} />
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                {currentRole === 'owner' ? 'Fleet Owner · Admin' : `Driver · ${activeDriver.truckId}`}
              </div>
            </div>
          </button>

          {/* Profile Dropdown Panel */}
          {isProfileOpen && (
            <>
              {/* Backdrop dismiss */}
              <div 
                className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-xs"
                onClick={() => setIsProfileOpen(false)}
              />

              <div 
                className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/90 p-4 space-y-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Large Profile Avatar */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-black text-sm border shrink-0 ${
                    currentRole === 'owner'
                      ? 'bg-gradient-to-br from-orange-100 to-amber-200 text-orange-800 border-orange-300 dark:from-orange-500/30 dark:to-slate-900 dark:text-orange-400 dark:border-orange-500/60 shadow-lg shadow-orange-500/10 dark:shadow-orange-500/20'
                      : 'bg-gradient-to-br from-sky-100 to-blue-200 text-sky-800 border-sky-300 dark:from-sky-500/30 dark:to-slate-900 dark:text-sky-400 dark:border-sky-500/60 shadow-lg shadow-sky-500/10 dark:shadow-sky-500/20'
                  }`}>
                    {currentRole === 'owner' ? 'MV' : activeDriver.name.split(' ').map((n) => n[0]).join('')}
                  </div>

                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {currentRole === 'owner' ? 'Marcus Vance' : activeDriver.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {currentRole === 'owner' ? 'marcus@ironlinefreight.com' : `${activeDriver.truckId} · Card ending ${activeDriver.cardLast4 || '4412'}`}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{currentRole === 'owner' ? 'Fleet Operations Admin' : 'Active In-Cab Driver'}</span>
                    </div>
                  </div>
                </div>

                {/* Carrier Details */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Carrier:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">Ironline Freight LLC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>USDOT:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">#3918241 (OH)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fleet Size:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">4 Trucks Online</span>
                  </div>
                </div>

                {/* Role Switcher Action */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Switch Active View
                  </div>

                  {currentRole === 'owner' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRole('trucker');
                        setIsProfileOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-950/40 text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                            Switch to In-Cab Driver View
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            1-tap camera upload & dock timer
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRole('owner');
                        setIsProfileOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                            Switch to Fleet Owner View
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            Nightly audit briefing ($2,689)
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Driver Profile Switcher (if demo drivers available) */}
                {demoDrivers && demoDrivers.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Switch Active Driver
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {demoDrivers.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            onSelectRole('trucker', d);
                            setIsProfileOpen(false);
                          }}
                          className={`p-1.5 rounded-lg text-center text-[10px] font-mono transition border ${
                            currentRole === 'trucker' && activeDriver.id === d.id
                              ? 'border-sky-500 bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="truncate font-semibold">{d.name.split(' ')[0]}</div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{d.truckId}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Theme Mode Toggle row in profile menu */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                    {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
                    <span>Theme: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="px-2 py-1 rounded-md text-[10px] font-bold uppercase transition bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    Switch to {theme === 'light' ? 'Dark' : 'Light'}
                  </button>
                </div>

                {/* Optional NFC Terminal Scanner trigger */}
                {onOpenLoginModal && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenLoginModal();
                      }}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition flex items-center gap-1.5 font-semibold"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Scan Keycard / Terminal</span>
                    </button>
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                      Air-Gap OK
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </header>
  );
};


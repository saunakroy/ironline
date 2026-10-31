import React, { useState } from 'react';
import { UserRole, DriverSession } from '../types';
import { 
  X, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  Building2, 
  ArrowRight,
  Fingerprint
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole, driver?: DriverSession) => void;
  demoDrivers: DriverSession[];
  activeDriver: DriverSession;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  demoDrivers,
  activeDriver
}) => {
  const [selectedDriver, setSelectedDriver] = useState<DriverSession>(activeDriver);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulateBiometricLogin = (role: UserRole) => {
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      onSelectRole(role, role === 'trucker' ? selectedDriver : undefined);
      onClose();
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Laser Scan line overlay over the viewport backdrop */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        onClick={onClose} 
      />

      <div 
        className="w-full max-w-lg bg-white dark:bg-[#0b1120] border border-orange-300 dark:border-orange-500/40 rounded-3xl shadow-2xl shadow-slate-900/20 dark:shadow-orange-950/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cybernetic laser scanner line running across modal */}
        <div className="animate-laser-scan" />

        {/* Top Status Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-orange-600 dark:text-orange-400 uppercase">
                  Terminal Authentication
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Ironline Fleet Access
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Biometric Scanner Banner */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14] p-4 text-center relative overflow-hidden">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 animate-biometric-pulse">
                  {isScanning ? (
                    <Sparkles className="w-6 h-6 animate-spin text-orange-600 dark:text-orange-400" />
                  ) : (
                    <Fingerprint className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  NFC
                </span>
              </div>

              <div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {isScanning ? 'Verifying Encrypted Fleet Credential...' : 'One-Tap Role Authorization'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Instant switch between Fleet Command Deck and In-Cab Driver View
                </div>
              </div>
            </div>
          </div>

          {/* Role Choice 1: Fleet Owner Command */}
          <div 
            onClick={() => handleSimulateBiometricLogin('owner')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all card-hover-glow relative shadow-xs dark:shadow-none ${
              currentRole === 'owner'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0f172a]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Fleet Owner / Manager</span>
                    {currentRole === 'owner' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500 text-black">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Access nightly decision audit ($2,689 at stake), 1-click broker reconciliation, fleet KPIs, and live AI agent relays.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-orange-600 dark:text-orange-400">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Account: Marcus Vance Carrier</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All 4 Trucks Synced
              </span>
            </div>
          </div>

          {/* Role Choice 2: Truck Driver In-Cab Mode */}
          <div 
            onClick={() => handleSimulateBiometricLogin('trucker')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all card-hover-glow relative shadow-xs dark:shadow-none ${
              currentRole === 'trucker'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0f172a]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Truck Driver (In-Cab Mode)</span>
                    {currentRole === 'trucker' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500 text-black">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Zero-typing mobile portal: 1-tap camera upload for delivery receipts, fuel slips, and unloading cash fees.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-sky-600 dark:text-sky-400">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Driver Profile Switcher */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Select In-Cab Driver:</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">{selectedDriver.truckId}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoDrivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDriver(d)}
                    className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-mono transition border ${
                      selectedDriver.id === d.id
                        ? 'border-sky-500 bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="truncate font-semibold">{d.name.split(' ')[0]}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{d.truckId}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14] flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Driver-Broker Air-Gap Enforced</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

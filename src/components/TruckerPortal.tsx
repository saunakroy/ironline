import React, { useState } from 'react';
import { DriverSession, ProcessedFile } from '../types';
import { 
  Camera, 
  Fuel, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  Building2
} from 'lucide-react';

interface TruckerPortalProps {
  driver: DriverSession;
  onSwitchToOwner: () => void;
  onOpenLoginModal: () => void;
  onDriverUpload: (docName: string, docType: string, keyFields: Record<string, string>) => void;
  recentFiles: ProcessedFile[];
}

export const TruckerPortal: React.FC<TruckerPortalProps> = ({
  driver,
  onSwitchToOwner,
  onOpenLoginModal,
  onDriverUpload,
  recentFiles
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  const handleSimulateCapture = (type: 'BOL' | 'Fuel' | 'Lumper' | 'DVIR') => {
    setIsUploading(true);

    setTimeout(() => {
      let docName = '';
      let docType = '';
      let keyFields: Record<string, string> = {};

      if (type === 'BOL') {
        docName = `Delivery_Receipt_${driver.truckId.replace(' ', '')}.jpg`;
        docType = 'Delivery Receipt';
        keyFields = {
          'Warehouse Arrival': '07:40 AM',
          'Warehouse Departure': '12:10 PM',
          'Dock Wait Time': '4.5 hrs total',
          'Delay Claim': '2.5 hrs unbilled ($162.50)'
        };
      } else if (type === 'Fuel') {
        docName = `Pilot_Diesel_Receipt_${driver.cardLast4}.png`;
        docType = 'Fuel Receipt';
        keyFields = {
          'Gas Station': 'Pilot Travel Center #391',
          'Fuel Card': `Card ending in ${driver.cardLast4}`,
          'Total Charged': '$648.50',
          'Verification': 'GPS match confirmed'
        };
      } else if (type === 'Lumper') {
        docName = `Cash_Unload_Slip_${driver.currentLoadId}.jpg`;
        docType = 'Unload Slip';
        keyFields = {
          'Facility': 'Capstone Logistics Cold Storage',
          'Unload Fee': '$175.00 cash',
          'Reimbursement': 'Auto-added to customer invoice'
        };
      } else {
        docName = `Safety_Inspection_${driver.truckId}.pdf`;
        docType = 'Safety Report';
        keyFields = {
          'Inspection': 'Tires, Air Brakes & Lights OK',
          'Federal DOT Status': 'Compliant',
          'Sign-Off': driver.name
        };
      }

      onDriverUpload(docName, docType, keyFields);
      setIsUploading(false);
      setUploadToast(`✓ ${docType} snapped & verified by Dispatch AI!`);
      setTimeout(() => setUploadToast(null), 3500);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {uploadToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white border border-emerald-500/50 text-xs sm:text-sm font-mono font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* Driver Header & Fast Switcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                {driver.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30">
                {driver.truckId}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              <span>{driver.route}</span>
              <span>·</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">{driver.currentLoadId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenLoginModal}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
          >
            Switch Driver
          </button>
          <button
            onClick={onSwitchToOwner}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black flex items-center justify-center gap-1.5 transition shadow-md shadow-orange-500/20"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Switch to Owner</span>
          </button>
        </div>
      </div>

      {/* The Dispatcher Air-Gap Card */}
      <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong className="text-emerald-800 dark:text-emerald-400 font-semibold font-mono uppercase block mb-0.5">
            Dispatcher Air-Gap Active
          </strong>
          You never need to argue with the broker. Just snap your paper slips here. Our autonomous AI dispatch agent matches your timestamps and bills the broker directly.
        </div>
      </div>

      {/* 4 Large 1-Tap Camera Action Cards (≥56px touch target for truckers) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Quick In-Cab Capture (Zero Typing)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Tap button to snap photo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Delivery Receipt (BOL) */}
          <button
            onClick={() => handleSimulateCapture('BOL')}
            disabled={isUploading}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/60 bg-white dark:bg-[#0f172a] hover:bg-orange-50 dark:hover:bg-orange-950/15 text-left transition flex items-start justify-between min-h-[110px] group active:scale-98 relative card-hover-glow shadow-xs dark:shadow-none"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  Delivery Receipt (BOL)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Take photo of signed warehouse arrival & departure stamps.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-orange-700 dark:text-orange-400 border border-slate-200 dark:border-slate-700 shrink-0">
              1-Tap
            </span>
          </button>

          {/* Card 2: Fuel Receipt */}
          <button
            onClick={() => handleSimulateCapture('Fuel')}
            disabled={isUploading}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 bg-white dark:bg-[#0f172a] hover:bg-amber-50 dark:hover:bg-amber-950/15 text-left transition flex items-start justify-between min-h-[110px] group active:scale-98 relative card-hover-glow shadow-xs dark:shadow-none"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Fuel className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Diesel Fuel Receipt
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Snap pump ticket to match fuel card swipe and GPS location.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shrink-0">
              1-Tap
            </span>
          </button>

          {/* Card 3: Unload Fee (Lumper) */}
          <button
            onClick={() => handleSimulateCapture('Lumper')}
            disabled={isUploading}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 bg-white dark:bg-[#0f172a] hover:bg-purple-50 dark:hover:bg-purple-950/15 text-left transition flex items-start justify-between min-h-[110px] group active:scale-98 relative card-hover-glow shadow-xs dark:shadow-none"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/15 border border-purple-300 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Warehouse Unloading Fee
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Snap $175 cash or check receipt to get automatically reimbursed.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-slate-200 dark:border-slate-700 shrink-0">
              1-Tap
            </span>
          </button>

          {/* Card 4: Safety Check (DVIR) */}
          <button
            onClick={() => handleSimulateCapture('DVIR')}
            disabled={isUploading}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-white dark:bg-[#0f172a] hover:bg-emerald-50 dark:hover:bg-emerald-950/15 text-left transition flex items-start justify-between min-h-[110px] group active:scale-98 relative card-hover-glow shadow-xs dark:shadow-none"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Pre-Trip Safety Signoff
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Daily vehicle inspection report (tires, air brakes, lights).
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shrink-0">
              1-Tap
            </span>
          </button>
        </div>

        {isUploading && (
          <div className="p-4 rounded-xl bg-sky-100 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-500/40 text-sky-800 dark:text-sky-300 text-xs font-mono font-bold flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-sky-500 dark:text-sky-400" />
            <span>AI Extractor reading document timestamps & clauses...</span>
          </div>
        )}
      </div>

      {/* Active Shipment Live Status */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 space-y-3 shadow-xs dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Current Shipment Dock Monitor
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
            GPS Live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Load ID</div>
            <div className="text-sm font-bold font-mono text-orange-600 dark:text-orange-400 mt-0.5">{driver.currentLoadId}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Dock Check-In</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">07:40 AM</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Total Dock Wait</div>
            <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">4.5 Hours</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Unbilled Delay</div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">+$162.50</div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 space-y-3 shadow-xs dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Recent Submissions from this Cab ({recentFiles.length})
            </h3>
          </div>
        </div>

        {recentFiles.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
            No paperwork snapped today yet. Tap any button above to snap a receipt.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {recentFiles.slice(0, 4).map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-mono font-semibold text-slate-900 dark:text-white truncate">{f.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{f.docType || f.type} · {f.uploadedAt}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Reconciled</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

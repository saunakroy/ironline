import React, { useState } from 'react';
import { DriverProfile, ExtractedDocument, LoadItem } from '../types';
import { Camera, Fuel, Receipt, CheckCircle, Clock, Phone, ShieldCheck, Sparkles } from 'lucide-react';

interface TruckerPortalProps {
  drivers: DriverProfile[];
  currentDriver: DriverProfile;
  onSelectDriver: (driver: DriverProfile) => void;
  activeLoad?: LoadItem;
  recentDocuments: ExtractedDocument[];
  onUploadDocument: (doc: ExtractedDocument) => void;
}

export const TruckerPortal: React.FC<TruckerPortalProps> = ({
  drivers,
  currentDriver,
  onSelectDriver,
  activeLoad,
  recentDocuments,
  onUploadDocument
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  const handleSimulateMobileCapture = (docType: 'BOL' | 'Fuel Receipt' | 'Lumper' | 'DVIR') => {
    setIsUploading(true);
    setTimeout(() => {
      const id = `DOC-${Math.floor(100 + Math.random() * 900)}`;
      let newDoc: ExtractedDocument;

      if (docType === 'BOL') {
        newDoc = {
          id,
          filename: `Photo_BOL_${currentDriver.truckId.replace(' ', '')}.jpg`,
          fileType: 'jpg',
          docClassification: 'BOL',
          confidenceScore: 97,
          needsReview: false,
          uploadedAt: 'Just now',
          loadRef: currentDriver.currentLoadId,
          driverName: currentDriver.name,
          extractedFields: {
            'BOL #': 'BOL-8849102',
            'Shipper': 'Great Lakes Cold Storage',
            'Check-In': '07:40 AM',
            'Check-Out': '12:10 PM',
            'Detention Billed': '2.5 hrs ($162.50)'
          }
        };
      } else if (docType === 'Fuel Receipt') {
        newDoc = {
          id,
          filename: `Fuel_Receipt_${currentDriver.fuelCardNumber.replace('#', '')}.jpg`,
          fileType: 'jpg',
          docClassification: 'Fuel Receipt',
          confidenceScore: 94,
          needsReview: false,
          uploadedAt: 'Just now',
          driverName: currentDriver.name,
          extractedFields: {
            'Location': 'Love\'s Travel Stop',
            'Fuel Card': currentDriver.fuelCardNumber,
            'Gallons': '112.4 gal',
            'Total': '$648.50'
          }
        };
      } else if (docType === 'Lumper') {
        newDoc = {
          id,
          filename: `Lumper_ColdStorage_${currentDriver.truckId}.jpg`,
          fileType: 'jpg',
          docClassification: 'Lumper',
          confidenceScore: 93,
          needsReview: false,
          uploadedAt: 'Just now',
          loadRef: currentDriver.currentLoadId,
          driverName: currentDriver.name,
          extractedFields: {
            'Vendor': 'Capstone Logistics',
            'Fee Amount': '$175.00',
            'Pass-Through': 'Added to Broker Invoice'
          }
        };
      } else {
        newDoc = {
          id,
          filename: `DVIR_PreTrip_${currentDriver.truckId}.pdf`,
          fileType: 'pdf',
          docClassification: 'DVIR',
          confidenceScore: 98,
          needsReview: false,
          uploadedAt: 'Just now',
          driverName: currentDriver.name,
          extractedFields: {
            'Truck': currentDriver.truckId,
            'Brakes': 'Certified Good',
            'Tires': 'Inspected 100psi',
            'Status': 'Road Ready'
          }
        };
      }

      onUploadDocument(newDoc);
      setIsUploading(false);
      setUploadSuccessToast(`✓ ${docType} successfully scanned and reconciled by Agent!`);
      setTimeout(() => setUploadSuccessToast(null), 3500);
    }, 700);
  };

  const driverDocs = recentDocuments.filter(d => !d.driverName || d.driverName === currentDriver.name);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Toast */}
      {uploadSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          {uploadSuccessToast}
        </div>
      )}

      {/* Driver Switcher Bar (For Demo & Multi-driver fleets) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Active Driver:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {drivers.map(drv => (
            <button
              key={drv.id}
              onClick={() => onSelectDriver(drv)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                currentDriver.id === drv.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {drv.name} ({drv.truckId})
            </button>
          ))}
        </div>
      </div>

      {/* Driver Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={currentDriver.avatar} 
              alt={currentDriver.name} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentDriver.name}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentDriver.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {currentDriver.truckId} • Assigned {currentDriver.fuelCardNumber} • {currentDriver.phone}
              </p>
            </div>
          </div>

          <a 
            href={`tel:${currentDriver.phone}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
          >
            <Phone className="w-3.5 h-3.5" /> Call Dispatch
          </a>
        </div>

        {/* Quick Driver Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Today's Miles</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{currentDriver.todayMiles} mi</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Current Load</div>
            <div className="text-lg font-bold font-mono text-blue-600 mt-0.5">{currentDriver.currentLoadId || 'None'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Uploads Today</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{driverDocs.length} files</div>
          </div>
        </div>
      </div>

      {/* Active Load & Live Dock Wait Time Clock */}
      {activeLoad && (
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-3xl p-6 border border-blue-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider font-mono">
                Active Freight Load • {activeLoad.id}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-full border border-blue-200">
              Rate: ${activeLoad.agreedRate.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-900">
                {activeLoad.origin} → {activeLoad.destination}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                Broker: {activeLoad.broker}
              </div>
            </div>

            {currentDriver.detentionTimer && (
              <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dock Detention Clock</div>
                  <div className="text-sm font-bold font-mono text-amber-600">
                    {currentDriver.detentionTimer.elapsedHours}h on site (2.5h billable)
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    +$162.50 auto-calculated
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Big 1-Tap Document Upload / Camera Grid (Touch & iPad Optimized) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Instant Document Upload</span>
            <span className="text-xs font-normal text-slate-500 font-sans">
              (Snap a phone photo — AI reconciles instantly)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            No forms or manual typing. Our agents extract the timestamps, PO numbers, and amounts automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Action 1: BOL / POD Photo */}
          <button
            onClick={() => handleSimulateMobileCapture('BOL')}
            disabled={isUploading}
            className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-left transition flex flex-col justify-between h-36 relative active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">Snap BOL / POD</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Check in/out stamp</div>
            </div>
          </button>

          {/* Action 2: Fuel Receipt */}
          <button
            onClick={() => handleSimulateMobileCapture('Fuel Receipt')}
            disabled={isUploading}
            className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 text-left transition flex flex-col justify-between h-36 relative active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-amber-700">Fuel Receipt</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Diesel pump receipt</div>
            </div>
          </button>

          {/* Action 3: Lumper Fee */}
          <button
            onClick={() => handleSimulateMobileCapture('Lumper')}
            disabled={isUploading}
            className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/40 text-left transition flex flex-col justify-between h-36 relative active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-purple-700">Lumper Fee</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Unload reimbursement</div>
            </div>
          </button>

          {/* Action 4: DVIR Inspection */}
          <button
            onClick={() => handleSimulateMobileCapture('DVIR')}
            disabled={isUploading}
            className="group p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 text-left transition flex flex-col justify-between h-36 relative active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">DVIR Inspect</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Safety signoff</div>
            </div>
          </button>
        </div>

        {isUploading && (
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            AI Extractor reading timestamps and matching to {currentDriver.currentLoadId}...
          </div>
        )}
      </div>

      {/* Driver Recent Uploads History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Submissions for {currentDriver.name}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {driverDocs.length} items
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {driverDocs.map(doc => (
            <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                  doc.docClassification === 'BOL' ? 'bg-blue-100 text-blue-700' :
                  doc.docClassification === 'Fuel Receipt' ? 'bg-amber-100 text-amber-700' :
                  doc.docClassification === 'Lumper' ? 'bg-purple-100 text-purple-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {doc.docClassification.slice(0, 3)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{doc.filename}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{doc.uploadedAt}</span>
                    {doc.loadRef && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-blue-600 font-semibold">{doc.loadRef}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Reconciled
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

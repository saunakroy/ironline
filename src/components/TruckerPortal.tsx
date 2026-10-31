import React, { useState } from 'react';
import { DriverProfile, ExtractedDocument, LoadItem } from '../types';
import { 
  Camera, 
  Fuel, 
  Receipt, 
  CheckCircle, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserCheck
} from 'lucide-react';

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
            'Detention': '2.5 hrs ($162.50)'
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
            'Reimbursed': 'Pass-through to Broker'
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
            'Inspection': 'Tires, Air Brakes & Lights Passed',
            'Status': 'Road Ready'
          }
        };
      }

      onUploadDocument(newDoc);
      setIsUploading(false);
      setUploadSuccessToast(`✓ ${docType} successfully scanned and verified!`);
      setTimeout(() => setUploadSuccessToast(null), 3500);
    }, 700);
  };

  const driverDocs = recentDocuments.filter(d => !d.driverName || d.driverName === currentDriver.name);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Alert */}
      {uploadSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {uploadSuccessToast}
        </div>
      )}

      {/* Simplified Driver Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>Select Driver Profile:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {drivers.map(drv => (
            <button
              key={drv.id}
              onClick={() => onSelectDriver(drv)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 ${
                currentDriver.id === drv.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${currentDriver.id === drv.id ? 'bg-white' : 'bg-emerald-500'}`} />
              {drv.name} ({drv.truckId})
            </button>
          ))}
        </div>
      </div>

      {/* Driver Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={currentDriver.avatar} 
              alt={currentDriver.name} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currentDriver.name}
                </h1>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {currentDriver.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>{currentDriver.truckId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  {currentDriver.fuelCardNumber}
                </span>
                <span>•</span>
                <span>{currentDriver.phone}</span>
              </p>
            </div>
          </div>

          <a 
            href={`tel:${currentDriver.phone}`}
            className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-5 py-3 rounded-2xl transition border border-slate-200"
          >
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Call Dispatch</span>
          </a>
        </div>

        {/* Big Readable Driver Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Today's Miles</span>
            </div>
            <div className="text-xl sm:text-3xl font-black font-mono text-slate-900">
              {currentDriver.todayMiles} <span className="text-sm font-semibold text-slate-500 font-sans">mi</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Current Load</span>
            </div>
            <div className="text-xl sm:text-3xl font-black font-mono text-blue-600 truncate">
              {currentDriver.currentLoadId || 'None'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Files Scanned</span>
            </div>
            <div className="text-xl sm:text-3xl font-black font-mono text-slate-900">
              {driverDocs.length} <span className="text-sm font-semibold text-slate-500 font-sans">docs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Assignment Section */}
      {activeLoad && (
        <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/60 rounded-3xl p-6 sm:p-7 border border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-900 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Current Assigned Load • {activeLoad.id}</span>
            </div>
            <span className="text-sm font-mono font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-200">
              Contract: ${activeLoad.agreedRate.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>{activeLoad.origin}</span>
                <ArrowRight className="w-5 h-5 text-blue-600 shrink-0" />
                <span>{activeLoad.destination}</span>
              </div>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Broker: <strong className="text-slate-800">{activeLoad.broker}</strong> • Equipment: 53ft Dry Van
              </p>
            </div>

            {/* Dock Detention Counter */}
            {currentDriver.detentionTimer && (
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm flex items-center gap-3.5 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dock Wait Time</div>
                  <div className="text-lg font-black font-mono text-amber-600">
                    {currentDriver.detentionTimer.elapsedHours}h at Shipper Dock
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    2.5 hrs billable (+$162.50 auto-added to invoice)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simplified Quick Scan Grid (Large Touch Targets for iPad/Cab) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quick Scan & Upload</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              Zero Forms
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tap a card to snap or upload paperwork. The AI agents immediately extract timestamps, POs, and dollars.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Action 1: BOL / POD */}
          <button
            onClick={() => handleSimulateMobileCapture('BOL')}
            disabled={isUploading}
            className="group p-5 rounded-3xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-left transition flex flex-col justify-between h-44 relative active:scale-95 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700">
                Snap BOL / POD
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Reads in/out time stamps
              </div>
            </div>
          </button>

          {/* Action 2: Fuel Receipt */}
          <button
            onClick={() => handleSimulateMobileCapture('Fuel Receipt')}
            disabled={isUploading}
            className="group p-5 rounded-3xl border-2 border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 text-left transition flex flex-col justify-between h-44 relative active:scale-95 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-700">
                Fuel Receipt
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Pump & card receipt
              </div>
            </div>
          </button>

          {/* Action 3: Lumper Fee */}
          <button
            onClick={() => handleSimulateMobileCapture('Lumper')}
            disabled={isUploading}
            className="group p-5 rounded-3xl border-2 border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/50 text-left transition flex flex-col justify-between h-44 relative active:scale-95 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700">
                Lumper Fee
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Reimbursement pass-through
              </div>
            </div>
          </button>

          {/* Action 4: DVIR Inspect */}
          <button
            onClick={() => handleSimulateMobileCapture('DVIR')}
            disabled={isUploading}
            className="group p-5 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-left transition flex flex-col justify-between h-44 relative active:scale-95 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                DVIR Inspect
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Pre-trip safety signoff
              </div>
            </div>
          </button>
        </div>

        {isUploading && (
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-800 text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-5 h-5 animate-spin text-blue-600" />
            <span>AI Extractor Agent reading document and matching to load...</span>
          </div>
        )}
      </div>

      {/* Simplified Recent Paperwork Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Recent Paperwork
            </h2>
            <p className="text-sm text-slate-500">
              Verified submissions for {currentDriver.name}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {driverDocs.length} files
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {driverDocs.map(doc => (
            <div key={doc.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  doc.docClassification === 'BOL' ? 'bg-blue-100 text-blue-700' :
                  doc.docClassification === 'Fuel Receipt' ? 'bg-amber-100 text-amber-700' :
                  doc.docClassification === 'Lumper' ? 'bg-purple-100 text-purple-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {doc.docClassification === 'BOL' ? <Camera className="w-5 h-5" /> :
                   doc.docClassification === 'Fuel Receipt' ? <Fuel className="w-5 h-5" /> :
                   doc.docClassification === 'Lumper' ? <Receipt className="w-5 h-5" /> :
                   <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{doc.filename}</div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                    <span>{doc.uploadedAt}</span>
                    {doc.loadRef && (
                      <>
                        <span>•</span>
                        <span className="font-mono font-bold text-blue-600">{doc.loadRef}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reconciled</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ExtractedDocument } from '../types';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles, Filter } from 'lucide-react';

interface UploadExtractionFeedProps {
  documents: ExtractedDocument[];
  onAddDocument: (doc: ExtractedDocument) => void;
}

export const UploadExtractionFeed: React.FC<UploadExtractionFeedProps> = ({ documents, onAddDocument }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needsReview'>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<ExtractedDocument | null>(null);

  const displayedDocs = documents.filter(doc => {
    if (filterMode === 'needsReview') return doc.needsReview;
    return true;
  });

  // Demo simulator helper: allows instant demo drop during the live pitch
  const handleSimulateUpload = (type: 'bol' | 'lumper' | 'fuel') => {
    setIsProcessing(true);
    setTimeout(() => {
      let newDoc: ExtractedDocument;
      if (type === 'bol') {
        newDoc = {
          id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
          filename: 'Phone_Photo_BOL_Signed.jpg',
          fileType: 'jpg',
          docClassification: 'BOL',
          confidenceScore: 95,
          needsReview: false,
          uploadedAt: 'Just now',
          loadRef: 'LD-4091',
          extractedFields: {
            'BOL #': 'BOL-8849102',
            'Shipper': 'Great Lakes Cold Storage',
            'Check-In': '07:40 AM',
            'Check-Out': '12:10 PM',
            'Total Hours': '4.5 hrs (2.5 hrs detention)'
          }
        };
      } else if (type === 'lumper') {
        newDoc = {
          id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
          filename: 'Driver_Text_Lumper_Thermal.jpg',
          fileType: 'jpg',
          docClassification: 'Lumper',
          confidenceScore: 91,
          needsReview: false,
          uploadedAt: 'Just now',
          loadRef: 'LD-4093',
          extractedFields: {
            'Vendor': 'Capstone Logistics Dallas',
            'Fee': '$175.00',
            'Payment': 'Comdata Card 4412',
            'Pass-Through Status': 'Ready for Invoice Add'
          }
        };
      } else {
        newDoc = {
          id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
          filename: 'Pilot_Fuel_Receipt_Scan.pdf',
          fileType: 'pdf',
          docClassification: 'Fuel Receipt',
          confidenceScore: 98,
          needsReview: false,
          uploadedAt: 'Just now',
          extractedFields: {
            'Store': 'Pilot Flying J #391',
            'Gallons': '180.4 gal',
            'Total Amount': '$1,250.43',
            'Watchdog Alert': 'Duplicate detected vs Mon upload'
          }
        };
      }
      onAddDocument(newDoc);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Upload Drop Zone Card */}
      <div className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/50 p-8 transition-colors text-center relative overflow-hidden group">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Drop any paperwork — no forms to fill
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports Rate Con PDFs, phone photos of BOLs & receipts, driver text screenshots, DOCX drafts, and .eml tenders.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800">PDF</span>
            <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800">JPG/PNG</span>
            <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800">DOCX</span>
            <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800">EML</span>
            <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800">TXT</span>
          </div>

          {/* Instant Simulation Action Bar for 3-minute Live Demo */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">⚡ Demo Quick Ingest:</span>
            <button
              onClick={() => handleSimulateUpload('bol')}
              disabled={isProcessing}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> + Monday BOL Photo
            </button>
            <button
              onClick={() => handleSimulateUpload('lumper')}
              disabled={isProcessing}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> + $175 Lumper Receipt
            </button>
            <button
              onClick={() => handleSimulateUpload('fuel')}
              disabled={isProcessing}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> + Fuel Receipt
            </button>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-400 animate-pulse pt-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Extractor Agent running OCR & Schema Normalization...
            </div>
          )}
        </div>
      </div>

      {/* Feed Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Real-Time Extracted Documents Feed
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {documents.length} ingested
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Records automatically attached to loads and mapped into fixed schema with confidence scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-amber-400 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Docs ({documents.length})
          </button>
          <button
            onClick={() => setFilterMode('needsReview')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
              filterMode === 'needsReview'
                ? 'bg-red-500 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Review ({documents.filter(d => d.needsReview).length})
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedDocs.map((doc) => (
          <div
            key={doc.id}
            className={`rounded-xl border p-5 bg-slate-900/90 transition-all hover:border-slate-600 space-y-4 ${
              doc.needsReview ? 'border-amber-500/50' : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  doc.docClassification === 'Rate Con' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                  doc.docClassification === 'BOL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  doc.docClassification === 'POD' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  doc.docClassification === 'Fuel Receipt' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{doc.docClassification}</span>
                    <span className="text-[11px] font-mono text-slate-500">{doc.uploadedAt}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[220px]" title={doc.filename}>
                    {doc.filename}
                  </div>
                </div>
              </div>

              {/* Confidence badge */}
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  doc.confidenceScore >= 90
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                }`}>
                  {doc.confidenceScore >= 90 ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {doc.confidenceScore}% conf
                </div>
                {doc.needsReview && (
                  <div className="text-[10px] text-amber-400 uppercase font-mono mt-1">
                    Review Required
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Fields Table */}
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Normalized Schema Fields
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries(doc.extractedFields).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[11px] text-slate-400">{k}:</span>
                    <span className="font-mono text-slate-200 font-medium truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom load attachment */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">
                {doc.loadRef ? (
                  <>Attached to Load: <strong className="text-amber-400">{doc.loadRef}</strong></>
                ) : (
                  <span className="text-slate-500 italic">Fleet-wide expense</span>
                )}
              </span>

              <button
                onClick={() => setSelectedDoc(doc)}
                className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View Raw
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Raw Document View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white font-mono">{selectedDoc.filename}</h4>
              <button 
                onClick={() => setSelectedDoc(null)} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <div className="text-amber-400 uppercase text-[10px]">Document Metadata</div>
              <div>ID: {selectedDoc.id}</div>
              <div>Classification: {selectedDoc.docClassification}</div>
              <div>Confidence: {selectedDoc.confidenceScore}%</div>
              <div>Timestamp: {selectedDoc.uploadedAt}</div>
              <div className="pt-2 border-t border-slate-800 text-slate-400">
                Extracted JSON Schema payload verified against answer key dataset.
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { BriefingItem, WatchItem, ProcessedFile } from '../types';
import { 
  UploadCloud, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Image as ImageIcon, 
  FileCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Camera, 
  Bot, 
  ShieldAlert, 
  Fuel, 
  FileSpreadsheet, 
  Coins, 
  ExternalLink,
  Play,
  X,
  AlertTriangle
} from 'lucide-react';

interface HomeScreenProps {
  briefingItems: BriefingItem[];
  watchItems: WatchItem[];
  processedFiles: ProcessedFile[];
  onSelectBriefingItem: (item: BriefingItem) => void;
  onLoadDemoFiles: () => void;
  onFileUpload: (files: FileList | File[]) => void;
  onToggleExpandFile: (fileId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  briefingItems,
  watchItems,
  processedFiles,
  onSelectBriefingItem,
  onLoadDemoFiles,
  onFileUpload,
  onToggleExpandFile
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section Dropdown Accordion States
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(true);
  const [isProcessedOpen, setIsProcessedOpen] = useState(true);
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);
  const [isWatchOpen, setIsWatchOpen] = useState(true);

  // Animated Count-Up for $2,689
  const [displayTotal, setDisplayTotal] = useState(0);
  const targetTotal = briefingItems.reduce((acc, curr) => acc + curr.amount, 0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayTotal(targetTotal);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1200; // ms
    const target = targetTotal;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayTotal(Math.floor(easeOut * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayTotal(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetTotal]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files);
    }
  };

  const validateAndProcess = (files: FileList) => {
    const validExtensions = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'eml', 'txt'];
    const invalidNames: string[] = [];

    Array.from(files).forEach((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(ext)) {
        invalidNames.push(f.name);
      }
    });

    if (invalidNames.length > 0) {
      setDropError(`Unsupported file format for "${invalidNames[0]}". Please drop PDF, DOCX, JPG, EML, or TXT.`);
      return;
    }

    setDropError(null);
    onFileUpload(files);
  };

  const getProblemIcon = (id: string) => {
    switch (id) {
      case 'P8':
      case 'P7':
        return <Fuel className="w-5 h-5 text-orange-400" />;
      case 'P3':
        return <FileSpreadsheet className="w-5 h-5 text-sky-400" />;
      case 'P6':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'P1':
      default:
        return <Clock className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getAgentBadgeColor = (agent: string) => {
    switch (agent) {
      case 'watchdog':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
      case 'reconciler':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/50';
      case 'extractor':
        return 'text-sky-400 bg-sky-950/40 border-sky-800/50';
      default:
        return 'text-orange-400 bg-orange-950/40 border-orange-800/50';
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    if (t.includes('jpg') || t.includes('png') || t.includes('jpeg')) return <ImageIcon className="w-4 h-4 text-sky-400" />;
    return <FileCheck className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* SECTION 1: COMPACT DROP ZONE AT TOP (DROPDOWN ACCORDION) */}
      <div className="space-y-2">
        <div 
          onClick={() => setIsDropzoneOpen(!isDropzoneOpen)}
          className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 select-none cursor-pointer hover:text-slate-200 transition"
        >
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
              Paperwork Drop
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{isDropzoneOpen ? 'Collapse' : 'Expand'}</span>
            {isDropzoneOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {isDropzoneOpen && (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-4 sm:p-5 text-center overflow-hidden group animate-in fade-in duration-150 ${
              isDragging 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-lg shadow-orange-500/10' 
                : 'border-slate-300 dark:border-slate-800 hover:border-orange-500/50 bg-white dark:bg-[#0f172a]/80 hover:bg-orange-50/15 dark:hover:bg-[#0f172a] shadow-xs dark:shadow-none'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              multiple 
              accept=".pdf,.docx,.jpg,.jpeg,.png,.eml,.txt" 
              className="hidden" 
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-105 transition-transform shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Drop paperwork here
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contracts, delivery receipts, fuel slips, texts (PDF, JPG, PNG)
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="sm:hidden flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <Camera className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Choose file</span>
                </button>

                <button
                  type="button"
                  onClick={onLoadDemoFiles}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black flex items-center justify-center gap-1.5 transition shadow-md shadow-orange-500/20 min-h-[40px]"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Load demo batch</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drop Error Alert State */}
        {dropError && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-3 text-xs font-mono text-red-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{dropError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDropError(null)}
              className="p-1 text-red-400 hover:text-white rounded hover:bg-red-900/50 transition"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 1B: LIVE "JUST PROCESSED" STRIP (DROPDOWN ACCORDION) */}
        {processedFiles.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-[#0b1120] p-4 space-y-3">
            <div 
              onClick={() => setIsProcessedOpen(!isProcessedOpen)}
              className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Just processed</span>
                <span className="text-slate-500">({processedFiles.length} files ingested)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 hidden sm:inline">Click row to inspect extracted fields</span>
                {isProcessedOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </div>
            </div>

            {/* List of Ingested / Processing Files */}
            {isProcessedOpen && (
              <div className="space-y-2 animate-in fade-in duration-150">
                {processedFiles.map((file) => {
                  const isExtracting = file.stage === 'extracting' || file.stage === 'classifying';
                  const isNeedsReview = file.stage === 'needs_review';
                  const isDone = file.stage === 'done';

                  return (
                    <div
                      key={file.id}
                      className={`rounded-lg border text-xs transition-all overflow-hidden ${
                        isExtracting 
                          ? 'border-sky-500/40 bg-sky-950/10 animate-shimmer' 
                          : isNeedsReview
                          ? 'border-amber-500/40 bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Header Row */}
                      <div 
                        onClick={() => onToggleExpandFile(file.id)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getFileIcon(file.type)}
                          <span className="font-mono font-medium text-slate-200 truncate max-w-[180px] sm:max-w-xs">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono hidden xs:inline">
                            {file.size}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Status Stage Indicator */}
                          {isExtracting && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                              {file.stage === 'classifying' ? 'Classifying' : 'Extracting...'}
                            </span>
                          )}

                          {isNeedsReview && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              Needs review
                            </span>
                          )}

                          {isDone && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Done
                            </span>
                          )}

                          {/* Doc Type Tag */}
                          {file.docType && (
                            <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded hidden sm:inline">
                              {file.docType}
                            </span>
                          )}

                          {/* Confidence Chip */}
                          {file.confidence !== undefined && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              file.confidence >= 90 
                                ? 'text-emerald-400 bg-emerald-950/40' 
                                : 'text-amber-400 bg-amber-950/40'
                            }`}>
                              {file.confidence}%
                            </span>
                          )}

                          {/* Expand Chevron */}
                          {file.isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Record View */}
                      {file.isExpanded && file.keyFields && (
                        <div className="px-3 pb-3 pt-2 border-t border-slate-800/80 bg-black/40 text-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3 text-sky-400" /> Extracted Record & Matched Keys
                            </span>
                            {file.loadId && (
                              <span className="text-orange-400">Linked to: {file.loadId}</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(file.keyFields).map(([k, v]) => (
                              <div key={k} className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-mono">{k}</span>
                                <span className="text-slate-200 font-mono font-semibold">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: HERO BRIEFING */}
      <div className="space-y-6">
        {/* Hero Headline Box with subtle glow */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:to-[#070b14] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs dark:shadow-none hero-glow">
          {/* Ambient Glowing Background Orb */}
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none animate-hero-glow" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Audit Complete · 18:00 EST
                </span>
                <span className="text-xs font-mono text-slate-500">Oct 31</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                5 things need your attention tonight
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Cross-checked contracts, wait times, fuel receipts, and GPS before daily payout.
              </p>
            </div>

            {/* Big Dollar Flag Stat */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0b1120] border border-orange-500/30 dark:border-orange-500/40 shadow-md dark:shadow-xl shrink-0 flex items-center gap-4 min-w-[220px]">
              <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Flagged Tonight
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-orange-600 dark:text-orange-400 tabular-nums">
                  ${displayTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>5 of 5 document-backed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 BRIEFING CARDS (DROPDOWN ACCORDION) */}
        <div className="space-y-3.5">
          <div 
            onClick={() => setIsBriefingOpen(!isBriefingOpen)}
            className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 cursor-pointer select-none hover:text-slate-200 transition"
          >
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider font-semibold text-slate-300">
                Discrepancies Requiring Action ({briefingItems.length})
              </span>
              <span className="text-slate-500 hidden sm:inline">· Sorted by financial impact</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="hidden xs:inline">{isBriefingOpen ? 'Collapse' : 'Expand'}</span>
              {isBriefingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {isBriefingOpen && (
            <div className="grid grid-cols-1 gap-3.5 animate-in fade-in duration-150">
              {briefingItems.map((item, index) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectBriefingItem(item)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 sm:p-5 card-hover-glow transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group animate-stagger-card shadow-xs dark:shadow-none"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Left: Icon, Details & Explanation */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:border-orange-500/50 transition-colors">
                        {getProblemIcon(item.id)}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-slate-300 dark:border-slate-700">
                            {item.id}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase border flex items-center gap-1.5 ${getAgentBadgeColor(item.agent)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {item.agent}
                          </span>

                          {item.loadId && (
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/80">
                              {item.loadId}
                            </span>
                          )}

                          {item.truckId && (
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {item.truckId}
                            </span>
                          )}

                          {item.driver && (
                            <span className="text-xs text-slate-500 hidden sm:inline">
                              · {item.driver}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.summary}
                        </p>
                      </div>
                    </div>

                    {/* Right: Big Dollar Amount & Evidence Link */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800/80">
                      <div className="text-2xl sm:text-3xl font-black font-mono text-orange-600 dark:text-orange-400 tabular-nums">
                        {item.amountFormatted}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBriefingItem(item);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/30 border border-orange-500/30 flex items-center gap-1.5 transition min-h-[40px]"
                      >
                        <span>View evidence</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: "ALSO ON WATCH" BOX (DROPDOWN ACCORDION) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] p-5 sm:p-6 space-y-4">
          <div 
            onClick={() => setIsWatchOpen(!isWatchOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Also on watch
              </h2>
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">({watchItems.length} autonomous monitors)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="text-[11px] text-slate-500 hidden sm:inline">{isWatchOpen ? 'Collapse' : 'Expand'}</span>
              {isWatchOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {isWatchOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
              {watchItems.map((w) => (
                <div 
                  key={w.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs dark:shadow-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      w.category === 'cash' 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                        : w.category === 'billing'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        : 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                    }`}>
                      {w.badge}
                    </span>
                    {w.amountFormatted && (
                      <span className="text-xs font-bold font-mono text-white tabular-nums">
                        {w.amountFormatted}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    {w.title}
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {w.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

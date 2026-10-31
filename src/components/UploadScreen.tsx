import { useState } from 'react'
import { seedUploads, type UploadFile, type UploadStatus } from '../data/uploads'

const STATUS_STYLES: Record<UploadStatus, string> = {
  extracting: 'bg-amber-400/10 text-amber-200/90 ring-amber-400/20',
  done: 'bg-emerald-400/10 text-emerald-200/90 ring-emerald-400/20',
  'needs review': 'bg-rose-400/10 text-rose-200/90 ring-rose-400/20',
}

export default function UploadScreen() {
  const [files, setFiles] = useState<UploadFile[]>(seedUploads)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length === 0) return
    const newFiles: UploadFile[] = dropped.map((f, i) => ({
      id: `drop-${Date.now()}-${i}`,
      name: f.name,
      kind: guessKind(f.name),
      size: formatSize(f.size),
      status: 'extracting',
    }))
    setFiles((prev) => [...newFiles, ...prev])
  }

  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-white/40">Paperwork intake</p>
        <h1 className="mt-1 text-[26px] font-bold text-white sm:text-3xl">Upload</h1>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`mt-5 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
          isDragOver ? 'border-slate-300 bg-white/[0.04]' : 'border-white/15 bg-white/[0.02]'
        }`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/40">
          <path
            d="M12 16V4M12 4L7 9M12 4L17 9M5 20H19"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm font-medium text-white/70">Drag and drop paperwork here</p>
        <p className="text-[12.5px] text-white/35">PDF, DOCX, JPG, EML, TXT</p>
        <label className="mt-2 cursor-pointer rounded-full bg-white/10 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/15">
          Browse files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? [])
              if (picked.length === 0) return
              const newFiles: UploadFile[] = picked.map((f, i) => ({
                id: `pick-${Date.now()}-${i}`,
                name: f.name,
                kind: guessKind(f.name),
                size: formatSize(f.size),
                status: 'extracting',
              }))
              setFiles((prev) => [...newFiles, ...prev])
            }}
          />
        </label>
      </div>

      <ul className="mt-5 space-y-2">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-white/60">
                {file.kind}
              </span>
              <div className="overflow-hidden">
                <p className="truncate text-[13.5px] font-medium text-white/85">{file.name}</p>
                <p className="text-[12px] text-white/40">{file.size}</p>
              </div>
            </div>
            <span
              className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[file.status]}`}
            >
              {file.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function guessKind(name: string): UploadFile['kind'] {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'PDF'
  if (ext === 'docx' || ext === 'doc') return 'DOCX'
  if (ext === 'eml') return 'EML'
  if (ext === 'txt') return 'TXT'
  return 'JPG'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

import { useState } from 'react'
import { driverLoads } from '../data/driverLoads'
import { profiles } from '../data/people'
import { seedUploads, type UploadFile } from '../data/uploads'

const STATUS_STYLES: Record<UploadFile['status'], string> = {
  extracting: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
  'needs review': 'bg-rose-100 text-rose-700',
}

export default function DriverHome({ onBack }: { onBack: () => void }) {
  const profile = profiles.driver
  const [files, setFiles] = useState<UploadFile[]>(seedUploads.slice(0, 2))
  const [isDragOver, setIsDragOver] = useState(false)

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    if (picked.length === 0) return
    const newFiles: UploadFile[] = picked.map((f, i) => ({
      id: `drv-${Date.now()}-${i}`,
      name: f.name,
      kind: 'JPG',
      size: f.size < 1024 * 1024 ? `${Math.round(f.size / 1024)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'extracting',
    }))
    setFiles((prev) => [...newFiles, ...prev])
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Switch person"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M10 2L4 8l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-[15px] font-semibold text-slate-900">{profile.name}</p>
          <p className="text-[12.5px] text-slate-500">{profile.subtitle}</p>
        </div>
      </div>

      <div className="px-4 pb-10 pt-5 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">Upload paperwork</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Rate cons, BOLs, receipts, texts — snap a photo or pick a file.</p>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            addFiles(e.dataTransfer.files)
          }}
          className={`mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-12 text-center transition-colors ${
            isDragOver ? 'border-slate-400 bg-slate-100' : 'border-slate-300 bg-white'
          }`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-slate-400">
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9M5 20H19"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <label className="w-full max-w-xs cursor-pointer rounded-full bg-slate-900 px-5 py-3.5 text-center text-[15px] font-semibold text-white active:bg-slate-700">
            Take photo or choose file
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.docx,.eml,.txt"
              capture="environment"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
          <p className="text-[12px] text-slate-400">PDF, photo, email, or text file</p>
        </div>

        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3"
              >
                <div className="overflow-hidden">
                  <p className="truncate text-[13.5px] font-medium text-slate-800">{file.name}</p>
                  <p className="text-[12px] text-slate-400">{file.size}</p>
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${STATUS_STYLES[file.status]}`}
                >
                  {file.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-8 text-sm font-semibold text-slate-700">My loads</h2>
        <ul className="mt-3 space-y-2">
          {driverLoads.map((load) => (
            <li
              key={load.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3"
            >
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">
                  Load {load.loadId} <span className="font-normal text-slate-400">&middot; {load.route}</span>
                </p>
                {load.missing && <p className="mt-0.5 text-[12px] text-rose-600">Missing: {load.missing}</p>}
              </div>
              <span
                className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  load.status === 'all set' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {load.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function StatusStrip() {
  return (
    <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.015] px-4 py-1.5 text-[11.5px] text-white/40 sm:px-6">
      <span className="relative flex h-1.5 w-1.5 flex-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="truncate">4 agents online &middot; 12 load actors running &middot; next reconcile 6:00 pm</span>
    </div>
  )
}

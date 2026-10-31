import { profiles, type Role } from '../data/people'

export default function RoleHome({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="flex min-h-screen flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-center text-[13px] font-medium text-white/40">Ironline</p>
        <h1 className="mt-1 text-center text-2xl font-bold text-white">Who&apos;s checking in?</h1>

        <div className="mt-8 space-y-3">
          {Object.values(profiles).map((profile) => (
            <button
              key={profile.role}
              type="button"
              onClick={() => onSelect(profile.role)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-left transition-colors active:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/80">
                  {profile.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">{profile.name}</p>
                  <p className="text-[12.5px] text-white/45">{profile.subtitle}</p>
                </div>
              </div>
              <div className="flex-none text-right">
                <p className="text-lg font-bold tabular-nums text-white">{profile.stat}</p>
                <p className="text-[11px] text-white/40">{profile.statLabel}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-[12px] text-white/30">Tap a name to open their tools</p>
      </div>
    </div>
  )
}

import { agentMessages } from '../data/agents'
import AgentBadge from './AgentBadge'

export default function AgentsScreen() {
  return (
    <div className="px-4 pb-8 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-white/40">Agent Relay &middot; live feed</p>
        <h1 className="mt-1 text-[26px] font-bold text-white sm:text-3xl">Agents</h1>
        <p className="mt-2 text-sm text-white/50">
          Every night the agents check documents against each other before the briefing goes out.
        </p>
      </header>

      <ul className="mt-5 space-y-3">
        {agentMessages.map((msg) => (
          <li key={msg.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/50">
                <AgentBadge agent={msg.from} />
                <span className="text-white/30">&rarr;</span>
                <span className="text-white/60">{msg.to}</span>
              </div>
              <span className="flex-none text-[11.5px] text-white/35">{msg.time}</span>
            </div>
            <p className="mt-2 text-[13.5px] leading-snug text-white/80">{msg.message}</p>
            {msg.loadId && (
              <span className="mt-2 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
                Load {msg.loadId}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { agentMessages } from '../data/agents'
import { useTypewriter } from '../lib/useTypewriter'
import AgentBadge from './AgentBadge'

function MessageRow({
  message,
  active,
  onDone,
  reduced,
}: {
  message: (typeof agentMessages)[number]
  active: boolean
  onDone: () => void
  reduced: boolean
}) {
  const typed = useTypewriter(message.message, active && !reduced, onDone)
  const text = reduced ? message.message : typed
  const isTyping = !reduced && active && typed.length < message.message.length

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: active ? 1 : 0.25, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/50">
          <AgentBadge agent={message.from} tone="colored" live={active} />
          <ArrowRight size={12} className="text-white/25" />
          <span className="text-white/60">{message.to}</span>
        </div>
        <span className="flex-none text-[11.5px] text-white/35">{message.time}</span>
      </div>
      <p className="mt-2 min-h-[2.5em] text-[13.5px] leading-snug text-white/80">
        {text}
        {isTyping && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-white/50 align-middle" />}
      </p>
      {message.loadId && (active || reduced) && (
        <span className="mt-2 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
          Load {message.loadId}
        </span>
      )}
    </motion.li>
  )
}

export default function AgentsScreen() {
  const reduced = !!useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(reduced ? agentMessages.length - 1 : 0)

  useEffect(() => {
    if (reduced) setActiveIndex(agentMessages.length - 1)
  }, [reduced])

  const advance = (i: number) => {
    setTimeout(() => setActiveIndex((cur) => Math.max(cur, i + 1)), 350)
  }

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
        {agentMessages.map((msg, i) => (
          <MessageRow
            key={msg.id}
            message={msg}
            active={i <= activeIndex}
            onDone={() => advance(i)}
            reduced={reduced}
          />
        ))}
      </ul>
    </div>
  )
}

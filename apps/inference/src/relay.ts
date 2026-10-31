// Relay hub: every agent-to-agent message goes through here, so the UI can show the agents coordinating.
// Transport is local HTTP for now. To move onto Agent Relay, implement `Transport` with its SDK and
// keep the topics/payloads unchanged.
import { randomUUID } from "node:crypto"

import type { RelayMessage } from "@fleet/data/shared"

type Handler = (msg: RelayMessage) => Promise<unknown>

export interface Transport {
    deliver(msg: RelayMessage, handler: Handler | undefined): Promise<unknown>
}

const localTransport: Transport = { deliver: async (msg, handler) => (handler ? handler(msg) : null) }

export class RelayHub {
    private feed: RelayMessage[] = []
    private listeners = new Set<(m: RelayMessage) => void>()
    private handlers = new Map<string, Handler>()

    constructor(private transport: Transport = localTransport) {}

    /** Register the agent that consumes a topic. */
    on(topic: RelayMessage["topic"], handler: Handler) {
        this.handlers.set(topic, handler)
    }

    async publish(input: Omit<RelayMessage, "id" | "at">): Promise<{ message: RelayMessage; delivery: unknown }> {
        const message: RelayMessage = { ...input, id: randomUUID(), at: new Date().toISOString() }
        this.record(message)
        const delivery = await this.transport.deliver(message, this.handlers.get(message.topic))
        return { message, delivery }
    }

    log(from: string, to: string, payload: unknown, traceId?: string) {
        this.record({ id: randomUUID(), at: new Date().toISOString(), topic: "log", from, to, payload, traceId })
    }

    recent(limit = 200) {
        return this.feed.slice(-limit)
    }

    subscribe(fn: (m: RelayMessage) => void) {
        this.listeners.add(fn)
        return () => this.listeners.delete(fn)
    }

    private record(m: RelayMessage) {
        this.feed.push(m)
        if (this.feed.length > 1000) this.feed.shift()
        for (const l of this.listeners) l(m)
    }
}

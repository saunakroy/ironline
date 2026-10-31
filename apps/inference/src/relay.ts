// Relay hub: every agent-to-agent message goes through here, so the UI can show the agents coordinating.
// Transport selects in-process delivery or the Agent Relay network while preserving the same handlers.
import { randomUUID } from "node:crypto"

import type { RelayMessage } from "@fleet/data/shared"

export type Handler = (msg: RelayMessage) => Promise<unknown>

export interface Transport {
    accept?(msg: RelayMessage): void
    message?(id: string): RelayMessage | undefined
    deliver(msg: RelayMessage, handler: Handler | undefined): Promise<unknown>
    start?(hub: RelayHub): Promise<void>
    close?(): Promise<void>
}

const localTransport: Transport = { deliver: async (msg, handler) => (handler ? handler(msg) : null) }

export class RelayHub {
    private feed: RelayMessage[] = []
    private listeners = new Set<(m: RelayMessage) => void>()
    private handlers = new Map<string, Handler>()
    private recorded = new Set<string>()

    constructor(private transport: Transport = localTransport) {}

    /** Register the agent that consumes a topic. */
    on(topic: RelayMessage["topic"], handler: Handler) {
        this.handlers.set(topic, handler)
    }

    async start() { await this.transport.start?.(this) }
    async close() { await this.transport.close?.() }
    message(id: string) { return this.transport.message?.(id) ?? this.feed.find(message => message.id === id) }

    /** Receive from the network without publishing the message again. */
    async dispatch(message: RelayMessage): Promise<unknown> {
        this.record(message)
        return this.handlers.get(message.topic)?.(message) ?? null
    }

    publish(input: Omit<RelayMessage, "id" | "at"> & { id?: string }): Promise<{ message: RelayMessage; delivery: unknown }> {
        const message: RelayMessage = { ...input, id: input.id ?? randomUUID(), at: new Date().toISOString() }
        this.transport.accept?.(message)
        this.record(message)
        return this.transport.deliver(message, this.handlers.get(message.topic)).then(delivery => ({ message, delivery }))
    }

    async log(from: string, to: string, payload: unknown) {
        await this.publish({ topic: "log", from, to, payload })
    }

    recent(limit = 200) {
        return this.feed.slice(-limit)
    }

    subscribe(fn: (m: RelayMessage) => void) {
        this.listeners.add(fn)
        return () => this.listeners.delete(fn)
    }

    private record(m: RelayMessage) {
        if (this.recorded.has(m.id)) return
        this.recorded.add(m.id)
        this.feed.push(m)
        if (this.feed.length > 1000) this.recorded.delete(this.feed.shift()!.id)
        for (const l of this.listeners) l(m)
    }
}

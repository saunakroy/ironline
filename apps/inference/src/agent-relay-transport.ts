import { AgentRelay, type RelayAgentClient, type RelayMessage as NetworkMessage } from "@agent-relay/sdk"
import { join } from "node:path"
import type { RelayMessage } from "@fleet/data/shared"
import type { RelayHub, Transport } from "./relay.js"
import { RELAY_DIR, ROLES, readCredentials, type Role } from "./relay-config.js"
import { CHANNEL, envelopeSchema, receiverRole, senderRole, summarize, validateSender } from "./relay-protocol.js"
import { RelayStore } from "./relay-store.js"

/** Narrow SDK boundary, injectable for tests. Both realtime and REST catch-up use the same receiver. */
export interface RelayNetwork {
    send(role: Role, message: RelayMessage, parentId?: string): Promise<string>
    get(role: Role, id: string): Promise<NetworkMessage>
    receipt(role: Role, parentId: string, id: string, value: unknown): Promise<string>
    listen(handler: (message: NetworkMessage) => Promise<void>): () => void
    close(): Promise<void>
}

export async function connectRelay(): Promise<RelayNetwork> {
    const credentials = await readCredentials()
    const relay = new AgentRelay({ agentToken: credentials.tokens["data-server"], baseUrl: credentials.baseUrl,
        retryPolicy: { maxRetries: 1 },
        onError: () => console.warn("Relay connection interrupted; pending deliveries will retry.") })
    const clients = new Map<Role, RelayAgentClient>()
    for (const role of ROLES) {
        const client = await relay.workspace.reconnect({ apiToken: credentials.tokens[role] })
        if (client.name !== role) throw new Error("Relay token belongs to the wrong participant")
        // Channel memberships were persisted by relay:setup; avoid redundant mutations on every restart.
        clients.set(role, client)
    }
    return {
        async send(role, message, parentId) {
            const input = { text: summarize(message), idempotencyKey: message.id, metadata: { fleet: message } }
            const client = clients.get(role)!
            const result = parentId
                ? await client.reply({ ...input, messageId: parentId })
                : await client.sendMessage({ ...input, to: `#${CHANNEL[message.topic]}` })
            return result.messageId
        },
        get: (role, id) => clients.get(role)!.messages.get(id),
        async receipt(role, parentId, id, value) {
            return (await clients.get(role)!.reply({ messageId: parentId, text: `Completed ${id}`,
                idempotencyKey: `result:${id}`, metadata: { fleetResult: { id, value: value ?? null } } })).messageId
        },
        listen(handler) {
            const off = relay.addListener("message.created", ({ message }) => handler(message))
            const offReply = relay.addListener("thread.reply", ({ message }) => handler(message))
            return () => { off(); offReply() }
        },
        close: () => relay.events.disconnect()
    }
}

export class AgentRelayTransport implements Transport {
    private hub?: RelayHub
    private network?: RelayNetwork
    private off?: () => void
    private timer?: ReturnType<typeof setInterval>
    private deliveries = new Map<string, Promise<unknown>>()
    private processing = new Map<string, Promise<unknown>>()
    private companies = new Map<string, Promise<unknown>>()
    private recovering = false
    private closed = false

    constructor(
        private store = new RelayStore(join(RELAY_DIR, "deliveries.sqlite")),
        private connect: () => Promise<RelayNetwork> = connectRelay,
        private timeoutMs = 60_000
    ) {}

    async start(hub: RelayHub) {
        this.hub = hub
        this.network = await this.connect()
        this.off = this.network.listen(async message => {
            try { await this.inbound(message) }
            catch { console.warn("Relay delivery failed; retained for retry.") }
        })
        this.timer = setInterval(() => void this.recover(), 5_000)
        void this.recover()
    }

    accept(message: RelayMessage) {
        validateSender(message)
        this.store.enqueue(envelopeSchema.parse(message) as RelayMessage)
    }
    message(id: string) { return this.store.message(id) }

    async deliver(input: RelayMessage): Promise<unknown> {
        if (!this.network || !this.hub || this.closed) throw new Error("Relay transport is not running")
        const message = envelopeSchema.parse(input) as RelayMessage
        validateSender(message)
        const saved = this.store.enqueue(message)
        let delivery = this.deliveries.get(saved.id)
        if (!delivery) {
            delivery = this.sendAndReceive(saved).finally(() => this.deliveries.delete(saved.id))
            this.deliveries.set(saved.id, delivery)
        }
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
            return await Promise.race([delivery, new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error("Relay delivery timed out; request retained for retry")), this.timeoutMs)
            })])
        } finally { clearTimeout(timer) }
    }

    private async sendAndReceive(message: RelayMessage) {
        let id = this.store.relayId(message.id)
        if (!id) {
            // Only briefings reply in the findings thread; enrichment has its own channel.
            const parent = message.topic === "briefing.ready" && message.inReplyTo ? this.store.relayId(message.inReplyTo) : undefined
            id = await this.network!.send(senderRole(message.from), message, parent)
            this.store.sent(message.id, id)
        }
        // REST catch-up also handles a send accepted just before a disconnect or process restart.
        // Never execute the original local payload: consume the persisted Relay record as the recipient.
        const received = await this.network!.get(receiverRole(message), id)
        const receivedEnvelope = envelopeSchema.safeParse(received.metadata?.fleet)
        if (!receivedEnvelope.success || receivedEnvelope.data.id !== message.id) throw new Error("Invalid Relay message record")
        const value = await this.inbound(received)
        this.store.complete(message.id)
        return value
    }

    private async inbound(networkMessage: NetworkMessage): Promise<unknown> {
        if (!networkMessage.metadata?.fleet) return null // includes our completion receipts
        const message = envelopeSchema.parse(networkMessage.metadata.fleet) as RelayMessage
        validateSender(message)
        if (networkMessage.from.name !== senderRole(message.from)) throw new Error("Relay sender does not match envelope")
        if (networkMessage.channel?.name && networkMessage.channel.name !== CHANNEL[message.topic]) throw new Error("Unexpected Relay channel")
        this.store.enqueue(message)
        this.store.sent(message.id, networkMessage.messageId)
        let running = this.processing.get(message.id)
        if (running) return running
        running = this.process(message, networkMessage.messageId).finally(() => this.processing.delete(message.id))
        this.processing.set(message.id, running)
        return running
    }

    private async process(message: RelayMessage, parentId: string) {
        const prior = this.store.result(message.id)
        // A late echo does not need another receipt round trip after completion was verified.
        if (prior && this.store.completed(message.id)) return prior.value
        let value: unknown
        if (prior) value = prior.value
        else {
            const work = () => this.hub!.dispatch(message)
            if (message.topic === "doc.extracted") {
                const companyId = (message.payload as { companyId: string }).companyId
                const previous = this.companies.get(companyId) ?? Promise.resolve()
                const task = previous.catch(() => {}).then(work)
                this.companies.set(companyId, task)
                try { value = await task }
                finally { if (this.companies.get(companyId) === task) this.companies.delete(companyId) }
            } else value = await work()
            this.store.handled(message.id, value)
        }
        // Completion is an actual response from the receiving identity, not the send acknowledgment.
        if (["doc.extracted", "findings.ready", "enrichment.requested"].includes(message.topic)) {
            const receiptId = await this.network!.receipt(receiverRole(message), parentId, message.id, value)
            const receipt = await this.network!.get(senderRole(message.from), receiptId)
            const result = receipt.metadata?.fleetResult as { id?: string; value?: unknown } | undefined
            if (receipt.from.name !== receiverRole(message) || result?.id !== message.id) throw new Error("Invalid Relay completion receipt")
            value = result.value
        }
        this.store.complete(message.id)
        return value ?? null
    }

    private async recover() {
        if (this.recovering || this.closed) return
        this.recovering = true
        try {
            for (const message of this.store.pending()) {
                if (this.closed) break
                try { await this.deliver(message) }
                catch { break } // preserve pending order while the network/data server is down
            }
        } finally { this.recovering = false }
    }

    async close() {
        this.closed = true
        clearInterval(this.timer)
        this.off?.()
        await this.network?.close()
        await Promise.allSettled([...this.deliveries.values(), ...this.processing.values()])
        this.store.close()
    }
}

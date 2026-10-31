import { afterEach, expect, test } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { RelayMessage } from "@fleet/data/shared"
import type { RelayMessage as NetworkMessage } from "@agent-relay/sdk"
import { AgentRelayTransport, type RelayNetwork } from "../src/agent-relay-transport.js"
import { registerAgents } from "../src/agents.js"
import { RelayHub } from "../src/relay.js"
import { RelayStore } from "../src/relay-store.js"
import { CHANNEL } from "../src/relay-protocol.js"
import type { Role } from "../src/relay-config.js"

class FakeNetwork implements RelayNetwork {
    messages = new Map<string, NetworkMessage>()
    sends: RelayMessage[] = []
    receipts = 0
    fail = false
    tamper = false
    handler?: (message: NetworkMessage) => Promise<void>
    async send(role: Role, message: RelayMessage) {
        if (this.fail) throw new Error("offline")
        const id = `network:${message.id}`
        this.sends.push(message)
        this.messages.set(id, { id, messageId: id, text: "", from: { name: this.tamper ? "outsider" : role },
            channel: { name: CHANNEL[message.topic] }, metadata: { fleet: structuredClone(message) } })
        return id
    }
    async get(_role: Role, id: string) { return structuredClone(this.messages.get(id)!) }
    async receipt(role: Role, _parentId: string, id: string, value: unknown) {
        this.receipts++
        const messageId = `receipt:${id}`
        this.messages.set(messageId, { id: messageId, messageId, text: "", from: { name: role }, metadata: { fleetResult: { id, value } } })
        return messageId
    }
    listen(handler: (message: NetworkMessage) => Promise<void>) { this.handler = handler; return () => { this.handler = undefined } }
    async close() {}
}

const cleanup: (() => Promise<unknown>)[] = []
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close() })
function make(network = new FakeNetwork(), path = ":memory:") {
    const transport = new AgentRelayTransport(new RelayStore(path), async () => network, 1000)
    const hub = new RelayHub(transport)
    cleanup.push(() => hub.close())
    return { hub, network }
}
const doc = (id: string) => ({ id, topic: "doc.extracted" as const, from: "intake-agent", to: "company:test",
    payload: { companyId: "test", doc: { file: `${id}.pdf`, kind: "rate_confirmation" }, cached: true } })

test("document publish waits for recipient routing and returns the result, not acceptance", async () => {
    const { hub, network } = make()
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    hub.on("doc.extracted", async () => { await gate; return [{ loadIds: ["IRN-1"] }] })
    await hub.start()
    let finished = false
    const pending = hub.publish(doc("a")).then(result => { finished = true; return result })
    await Bun.sleep(10)
    expect(finished).toBe(false)
    release()
    expect((await pending).delivery).toEqual([{ loadIds: ["IRN-1"] }])
    expect(network.receipts).toBe(1)
})

test("duplicate delivery and realtime echo execute once and appear once in feed", async () => {
    const { hub, network } = make()
    let calls = 0
    hub.on("doc.extracted", async () => { calls++; await Bun.sleep(5); return ["routed"] })
    await hub.start()
    const [first, second] = await Promise.all([hub.publish(doc("same")), hub.publish(doc("same"))])
    await network.handler!(network.messages.get("network:same")!)
    expect(first.delivery).toEqual(second.delivery)
    expect(calls).toBe(1)
    expect(hub.recent()).toHaveLength(1)
    expect(network.receipts).toBe(1)
})

test("documents for one company are processed serially", async () => {
    const { hub } = make()
    const order: string[] = []
    hub.on("doc.extracted", async msg => { order.push(`start:${msg.id}`); await Bun.sleep(5); order.push(`end:${msg.id}`) })
    await hub.start()
    await Promise.all([hub.publish(doc("first")), hub.publish(doc("second"))])
    expect(order).toEqual(["start:first", "end:first", "start:second", "end:second"])
})

test("failed delivery remains pending and recovers from disk after restart", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "fleet-relay-test-")), "journal.sqlite")
    const network = new FakeNetwork()
    network.fail = true
    const first = make(network, path)
    await first.hub.start()
    await expect(first.hub.publish(doc("recover"))).rejects.toThrow("offline")
    await cleanup.pop()!()
    network.fail = false
    const second = make(network, path)
    let calls = 0
    second.hub.on("doc.extracted", async () => { calls++; return ["recovered"] })
    await second.hub.start()
    expect((await second.hub.publish(doc("recover"))).delivery).toEqual(["recovered"])
    expect(calls).toBe(1)
})

test("completed handler is not rerun after process restart", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "fleet-relay-test-")), "journal.sqlite")
    const network = new FakeNetwork()
    const first = make(network, path)
    first.hub.on("doc.extracted", async () => ["stored"])
    await first.hub.start()
    await first.hub.publish(doc("done"))
    await cleanup.pop()!()
    const second = make(network, path)
    second.hub.on("doc.extracted", async () => { throw new Error("must not rerun") })
    await second.hub.start()
    expect((await second.hub.publish(doc("done"))).delivery).toEqual(["stored"])
})

test("spoofed sender and reused ID with different content are rejected", async () => {
    const { hub, network } = make()
    network.tamper = true
    let calls = 0
    hub.on("doc.extracted", async () => { calls++ })
    await hub.start()
    await expect(hub.publish(doc("spoof"))).rejects.toThrow("sender")
    expect(calls).toBe(0)
    expect(() => hub.publish({ ...doc("spoof"), to: "company:other" })).toThrow("different content")
})

test("handler errors fail the caller and remain retryable", async () => {
    const { hub } = make()
    hub.on("doc.extracted", async () => { throw new Error("data unavailable") })
    await hub.start()
    await expect(hub.publish(doc("retry"))).rejects.toThrow("data unavailable")
    hub.on("doc.extracted", async () => ["ok"])
    expect((await hub.publish(doc("retry"))).delivery).toEqual(["ok"])
})

test("a persisted provider record missing its fleet envelope cannot count as delivery", async () => {
    const { hub, network } = make()
    const read = network.get.bind(network)
    network.get = async (role, id) => ({ ...await read(role, id), metadata: undefined })
    let calls = 0
    hub.on("doc.extracted", async () => { calls++ })
    await hub.start()
    await expect(hub.publish(doc("malformed"))).rejects.toThrow("Invalid Relay message record")
    expect(calls).toBe(0)
})

test("findings request enrichment over Relay, publish one threaded briefing, and persist it", async () => {
    const { hub, network } = make()
    let persisted: unknown
    const server = Bun.serve({ port: 0, async fetch(req) {
        persisted = await req.json()
        return Response.json({ ok: true })
    } })
    cleanup.push(async () => { server.stop(true) })
    registerAgents(hub, server.url.href.replace(/\/$/, ""), {
        weeklyDiesel: async () => ({ period: "2026-10-26", pricePerGallon: 6.5, source: "fallback" as const }),
        writeBriefing: async input => ({ asOf: input.asOf, findings: input.findings, totalAtRisk: input.totalAtRisk,
            text: `Diesel ${input.diesel!.pricePerGallon}`, generatedAt: new Date().toISOString() })
    })
    await hub.start()
    const result = await hub.publish({ id: "check", topic: "findings.ready", from: "company:test", to: "briefer",
        payload: { companyId: "test", asOf: "2026-10-30", findings: [], totalAtRisk: 0 } })
    expect(result.delivery).toEqual({ briefing: persisted })
    expect(network.sends.map(m => m.topic)).toEqual(["findings.ready", "enrichment.requested", "enrichment", "briefing.ready"])
    expect(network.sends.find(m => m.topic === "briefing.ready")?.inReplyTo).toBe("check")
})

test("local mode retains the same document return contract", async () => {
    const hub = new RelayHub()
    hub.on("doc.extracted", async () => ["local"])
    expect((await hub.publish(doc("local"))).delivery).toEqual(["local"])
})

test("retry after briefing persistence failure reuses the generated briefing", async () => {
    const { hub } = make()
    let fail = true
    let generations = 0
    const server = Bun.serve({ port: 0, fetch: () => fail ? new Response("down", { status: 503 }) : Response.json({ ok: true }) })
    cleanup.push(async () => { server.stop(true) })
    registerAgents(hub, server.url.href.replace(/\/$/, ""), {
        weeklyDiesel: async () => ({ period: "2026-10-26", pricePerGallon: 6.5, source: "fallback" as const }),
        writeBriefing: async input => { generations++; return { asOf: input.asOf, findings: input.findings, totalAtRisk: 0,
            text: `Generation ${generations}`, generatedAt: new Date().toISOString() } }
    })
    await hub.start()
    const request = { id: "persist-retry", topic: "findings.ready" as const, from: "data-server", to: "briefer",
        payload: { companyId: "test", asOf: "2026-10-30", findings: [], totalAtRisk: 0 } }
    await expect(hub.publish(request)).rejects.toThrow("503")
    fail = false
    expect((await hub.publish(request)).delivery).toMatchObject({ briefing: { text: "Generation 1" } })
    expect(generations).toBe(1)
})

test("request timeout rejects instead of reporting successful delivery", async () => {
    const network = new FakeNetwork()
    const hub = new RelayHub(new AgentRelayTransport(new RelayStore(":memory:"), async () => network, 5))
    cleanup.push(() => hub.close())
    hub.on("doc.extracted", async () => { await Bun.sleep(20); return ["late"] })
    await hub.start()
    await expect(hub.publish(doc("timeout"))).rejects.toThrow("timed out")
    await Bun.sleep(25)
    expect((await hub.publish(doc("timeout"))).delivery).toEqual(["late"])
})

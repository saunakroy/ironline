import { expect, mock, test } from "bun:test"
import { copyFileSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const calls: any[] = []
mock.module("ai", () => ({
    generateObject: async (args: any) => {
        calls.push(args)
        return { object: { kind: "unknown", rate: null, loadedMiles: null, events: [] } }
    }
}))
const { extractFile } = await import("../src/extract.js")

test("an upload saved without an extension is still sent as an image", async () => {
    // Mirrors multer: the bytes sit at a random name, the original name only comes as displayName.
    const tmp = join(mkdtempSync(join(tmpdir(), "extract-")), "e5572bd39be44b68982a5f13998301df")
    copyFileSync(join(import.meta.dir, "../../../data/fleet_demo/inbox/2026-10-30/IMG_20261030_091547.jpg"), tmp)
    await extractFile(tmp, { displayName: "IMG_20261030_091547.jpg" })
    const parts = calls.at(-1).messages[0].content
    expect(parts.some((p: any) => p.type === "image" && p.mediaType === "image/jpeg")).toBe(true)
    expect(parts.filter((p: any) => p.type === "text")).toHaveLength(1)
})

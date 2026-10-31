// bun run extract <file> [<file>...] — print what the Intake agent extracts (no data server needed).
import { extractFile } from "./extract.js"

for (const path of process.argv.slice(2)) {
    const t = Date.now()
    const doc = await extractFile(path)
    console.log(`\n== ${path} (${((Date.now() - t) / 1000).toFixed(1)}s)`)
    console.log(JSON.stringify(doc, (_k, v) => (v === null || (Array.isArray(v) && !v.length) ? undefined : v), 2))
}

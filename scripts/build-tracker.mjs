// Minifies tracker/tracker.js (the readable source) into public/tracker.js (what sites load)
import { readFileSync, writeFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { transformSync } from "esbuild"

const source = readFileSync("tracker/tracker.js", "utf8")
const { code } = transformSync(source, { minify: true, target: "es2018" })
const banner = "/* Housecount tracker. Readable source: tracker/tracker.js */\n"
writeFileSync("public/tracker.js", banner + code)

console.log(`tracker: ${source.length} bytes source, ${code.length} minified, ${gzipSync(code, { level: 9 }).length} gzipped`)

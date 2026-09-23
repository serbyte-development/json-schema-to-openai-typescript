import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { listToolsThroughOfficialClient } from "./mcp-probe.js"
import { PROBE_TOOLS } from "./tools.js"

const fixturePath = resolve("fixtures/connector-discovery/before.json")
const mode = process.argv[2] ?? "--stdout"

const tools = await listToolsThroughOfficialClient(
  PROBE_TOOLS,
  "openai-json-schema-probe-verify",
)
if (tools.length !== PROBE_TOOLS.length) {
  throw new Error(
    `Expected ${PROBE_TOOLS.length} tools, received ${tools.length}`,
  )
}

const serialized = `${JSON.stringify(tools, null, 2)}\n`
switch (mode) {
  case "--write":
    writeFileSync(fixturePath, serialized)
    break
  case "--check":
    assert.equal(readFileSync(fixturePath, "utf8"), serialized)
    break
  case "--stdout":
    process.stdout.write(serialized)
    break
  default:
    throw new Error(`Unknown mode: ${mode}`)
}

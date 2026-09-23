import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { listToolsThroughOfficialClient } from "../mcp.js"
import { CONVERSION_CASES } from "./cases.js"

const fixturePath = resolve("fixtures/conversion/mcp-tools.json")
const mode = process.argv[2] ?? "--stdout"

const tools = await listToolsThroughOfficialClient(
  CONVERSION_CASES,
  "openai-json-schema-conversion-capture",
)
if (tools.length !== CONVERSION_CASES.length) {
  throw new Error(
    `Expected ${CONVERSION_CASES.length} tools, received ${tools.length}`,
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

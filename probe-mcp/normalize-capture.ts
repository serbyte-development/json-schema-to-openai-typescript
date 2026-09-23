import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  normalizeConnectorDiscoveryCapture,
  serializeNormalizedConnectorDiscovery,
} from "../src/connector-capture.js"

const connectorPrefix = "mcp__test_openai_typescript__"
const rawPath = resolve("fixtures/connector-discovery/after.md")
const normalizedPath = resolve("fixtures/connector-discovery/normalized.json")
const mode = process.argv[2] ?? "--check"

const normalized = serializeNormalizedConnectorDiscovery(
  normalizeConnectorDiscoveryCapture(
    readFileSync(rawPath, "utf8"),
    connectorPrefix,
  ),
)

switch (mode) {
  case "--write":
    writeFileSync(normalizedPath, normalized)
    break
  case "--check":
    assert.equal(readFileSync(normalizedPath, "utf8"), normalized)
    break
  case "--stdout":
    process.stdout.write(normalized)
    break
  default:
    throw new Error(`Unknown mode: ${mode}`)
}

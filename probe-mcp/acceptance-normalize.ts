import assert from "node:assert/strict"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  normalizeConnectorDiscoveryCapture,
  serializeNormalizedConnectorDiscovery,
} from "./connector-capture.js"

interface OpenAIObservation {
  connectorPrefix: string
  connectorError?: string
}

const afterPath = resolve("fixtures/acceptance/after.md")
const observationPath = resolve("fixtures/acceptance/openai-observation.json")
const normalizedPath = resolve("fixtures/acceptance/normalized.json")
const mode = process.argv[2] ?? "--check"

if (!existsSync(afterPath) || !existsSync(observationPath)) {
  if (mode === "--check") process.exit(0)
  throw new Error(
    "OpenAI acceptance capture is pending. Capture after.md and openai-observation.json first.",
  )
}

const observation = JSON.parse(
  readFileSync(observationPath, "utf8"),
) as OpenAIObservation
const normalizedTools = observation.connectorError
  ? []
  : normalizeConnectorDiscoveryCapture(
      readFileSync(afterPath, "utf8"),
      observation.connectorPrefix,
    )
const names = normalizedTools.map((tool) => tool.name)
assert.equal(
  new Set(names).size,
  names.length,
  "Duplicate acceptance capture tool names",
)
const normalized = serializeNormalizedConnectorDiscovery(normalizedTools)

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

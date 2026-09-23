import assert from "node:assert/strict"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  normalizeConnectorDiscoveryCapture,
  serializeNormalizedConnectorDiscovery,
} from "../capture/parse-signatures.js"

interface OpenAIObservation {
  connectorPrefix: string
  connectorError?: string
}

const afterPath = resolve("fixtures/ingestion/openai-signatures.md")
const observationPath = resolve("fixtures/ingestion/openai-observation.json")
const normalizedPath = resolve("fixtures/ingestion/normalized.json")
const mode = process.argv[2] ?? "--check"

if (!existsSync(afterPath) || !existsSync(observationPath)) {
  if (mode === "--check") process.exit(0)
  throw new Error(
    "OpenAI ingestion capture is pending. Capture openai-signatures.md and openai-observation.json first.",
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
  "Duplicate ingestion capture tool names",
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

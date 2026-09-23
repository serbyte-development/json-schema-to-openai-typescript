import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import type { JsonSchema } from "../../src/index.js"
import { inspectSchema } from "../../src/validator.js"
import { listToolsThroughOfficialClient } from "../mcp.js"
import { INGESTION_CASES, MCP_TRANSPORT_CASES } from "./cases.js"

interface SchemaInspection {
  metaSchemaValid: boolean
  compileStatus:
    | "ok"
    | "invalid-schema"
    | "unresolved-ref"
    | "invalid-regex"
    | "compile-error"
  metaSchemaErrors: string[]
  compileError?: string
}

interface IngestionInspection {
  name: string
  input: SchemaInspection
  output?: SchemaInspection
}

interface TransportInspection {
  name: string
  acceptedByOfficialClient: boolean
  error?: string
}

const beforePath = resolve("fixtures/ingestion/mcp-tools.json")
const validityPath = resolve("fixtures/ingestion/json-schema-validity.json")
const transportPath = resolve("fixtures/ingestion/mcp-transport.json")
const mode = process.argv[2] ?? "--check"

async function inspectTransportCase(
  testCase: (typeof MCP_TRANSPORT_CASES)[number],
): Promise<TransportInspection> {
  try {
    await listToolsThroughOfficialClient(
      [testCase.tool],
      "openai-json-schema-transport-check",
    )
    return { name: testCase.name, acceptedByOfficialClient: true }
  } catch (error) {
    return {
      name: testCase.name,
      acceptedByOfficialClient: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const tools = await listToolsThroughOfficialClient(
  INGESTION_CASES,
  "openai-json-schema-ingestion-check",
)
assert.equal(tools.length, INGESTION_CASES.length)

const before = `${JSON.stringify(tools, null, 2)}\n`
const inspections: IngestionInspection[] = tools.map((tool) => ({
  name: tool.name,
  input: serializeInspection(inspectSchema(tool.inputSchema as JsonSchema)),
  ...(tool.outputSchema
    ? {
        output: serializeInspection(
          inspectSchema(tool.outputSchema as JsonSchema),
        ),
      }
    : {}),
}))
const validity = `${JSON.stringify(inspections, null, 2)}\n`
const transport = `${JSON.stringify(
  await Promise.all(MCP_TRANSPORT_CASES.map(inspectTransportCase)),
  null,
  2,
)}\n`

function serializeInspection(
  inspection: ReturnType<typeof inspectSchema>,
): SchemaInspection {
  return {
    metaSchemaValid: inspection.metaSchemaValid,
    compileStatus: inspection.compileStatus,
    metaSchemaErrors: inspection.metaSchemaErrors.map(
      (error) =>
        `${error.instancePath || "/"} ${error.keyword}: ${error.message ?? "invalid"}`,
    ),
    ...(inspection.compileError
      ? { compileError: inspection.compileError }
      : {}),
  }
}

switch (mode) {
  case "--write":
    writeFileSync(beforePath, before)
    writeFileSync(validityPath, validity)
    writeFileSync(transportPath, transport)
    break
  case "--check":
    assert.equal(readFileSync(beforePath, "utf8"), before)
    assert.equal(readFileSync(validityPath, "utf8"), validity)
    assert.equal(readFileSync(transportPath, "utf8"), transport)
    break
  case "--stdout":
    process.stdout.write(
      JSON.stringify(
        {
          validity: JSON.parse(validity),
          transport: JSON.parse(transport),
        },
        null,
        2,
      ),
    )
    break
  default:
    throw new Error(`Unknown mode: ${mode}`)
}

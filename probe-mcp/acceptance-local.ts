import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js"

import type { JsonSchema } from "../src/index.js"
import { ACCEPTANCE_TOOLS, MCP_TRANSPORT_PROBES } from "./acceptance-tools.js"
import { listToolsThroughOfficialClient } from "./mcp-probe.js"

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

interface AcceptanceInspection {
  name: string
  input: SchemaInspection
  output?: SchemaInspection
}

interface TransportInspection {
  name: string
  acceptedByOfficialClient: boolean
  error?: string
}

const beforePath = resolve("fixtures/acceptance/before.json")
const validityPath = resolve("fixtures/acceptance/local-validity.json")
const transportPath = resolve("fixtures/acceptance/mcp-transport.json")
const mode = process.argv[2] ?? "--check"

async function inspectTransportProbe(
  probe: (typeof MCP_TRANSPORT_PROBES)[number],
): Promise<TransportInspection> {
  try {
    await listToolsThroughOfficialClient(
      [probe.tool],
      "openai-json-schema-transport-probe",
    )
    return { name: probe.name, acceptedByOfficialClient: true }
  } catch (error) {
    return {
      name: probe.name,
      acceptedByOfficialClient: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function inspectSchema(schema: JsonSchema): SchemaInspection {
  const ajv = new Ajv2020({ strict: false, validateFormats: false })
  const metaSchemaValid = ajv.validateSchema(schema)
  const metaSchemaErrors = (ajv.errors ?? []).map(
    (error: ErrorObject) =>
      `${error.instancePath || "/"} ${error.keyword}: ${error.message ?? "invalid"}`,
  )

  if (!metaSchemaValid) {
    return {
      metaSchemaValid: false,
      compileStatus: "invalid-schema",
      metaSchemaErrors,
    }
  }

  try {
    ajv.compile(schema)
    return { metaSchemaValid: true, compileStatus: "ok", metaSchemaErrors }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const lower = message.toLowerCase()
    const compileStatus = lower.includes("can't resolve reference")
      ? "unresolved-ref"
      : lower.includes("invalid regular expression") ||
          lower.includes("invalid pattern")
        ? "invalid-regex"
        : "compile-error"
    return {
      metaSchemaValid: true,
      compileStatus,
      metaSchemaErrors,
      compileError: message,
    }
  }
}

const tools = await listToolsThroughOfficialClient(
  ACCEPTANCE_TOOLS,
  "openai-json-schema-acceptance-local",
)
assert.equal(tools.length, ACCEPTANCE_TOOLS.length)

const before = `${JSON.stringify(tools, null, 2)}\n`
const inspections: AcceptanceInspection[] = tools.map((tool) => ({
  name: tool.name,
  input: inspectSchema(tool.inputSchema as JsonSchema),
  ...(tool.outputSchema
    ? { output: inspectSchema(tool.outputSchema as JsonSchema) }
    : {}),
}))
const validity = `${JSON.stringify(inspections, null, 2)}\n`
const transport = `${JSON.stringify(
  await Promise.all(MCP_TRANSPORT_PROBES.map(inspectTransportProbe)),
  null,
  2,
)}\n`

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

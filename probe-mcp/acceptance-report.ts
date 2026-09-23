import assert from "node:assert/strict"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import type { McpToolDefinition } from "../src/index.js"
import type { NormalizedConnectorTool } from "./connector-capture.js"

interface SchemaInspection {
  metaSchemaValid: boolean
  compileStatus: string
}

interface AcceptanceInspection {
  name: string
  input: SchemaInspection
  output?: SchemaInspection
}

interface CallObservation {
  name: string
  ok: boolean
  error?: string
}

interface OpenAIObservation {
  connectorPrefix: string
  connectorError?: string
  calls?: CallObservation[]
}

interface OpenAIRejection {
  name: string
  error: string
}

const beforePath = resolve("fixtures/acceptance/before.json")
const validityPath = resolve("fixtures/acceptance/local-validity.json")
const transportPath = resolve("fixtures/acceptance/mcp-transport.json")
const observationPath = resolve("fixtures/acceptance/openai-observation.json")
const rejectionsPath = resolve("fixtures/acceptance/openai-rejections.json")
const normalizedPath = resolve("fixtures/acceptance/normalized.json")
const reportPath = resolve("fixtures/acceptance/report.md")
const mode = process.argv[2] ?? "--check"

const tools = JSON.parse(
  readFileSync(beforePath, "utf8"),
) as McpToolDefinition[]
const validity = JSON.parse(
  readFileSync(validityPath, "utf8"),
) as AcceptanceInspection[]
const transport = JSON.parse(readFileSync(transportPath, "utf8")) as Array<{
  name: string
  acceptedByOfficialClient: boolean
  error?: string
}>
const validityByName = new Map(validity.map((item) => [item.name, item]))

const hasObservation = existsSync(observationPath)
const observation = hasObservation
  ? (JSON.parse(readFileSync(observationPath, "utf8")) as OpenAIObservation)
  : undefined
const normalized =
  observation && !observation.connectorError && existsSync(normalizedPath)
    ? (JSON.parse(
        readFileSync(normalizedPath, "utf8"),
      ) as NormalizedConnectorTool[])
    : []
const normalizedByName = new Map(normalized.map((item) => [item.name, item]))
const rejections = existsSync(rejectionsPath)
  ? (JSON.parse(readFileSync(rejectionsPath, "utf8")) as OpenAIRejection[])
  : []
const rejectionByName = new Map(rejections.map((item) => [item.name, item]))
const callByName = new Map(
  (observation?.calls ?? []).map((item) => [item.name, item]),
)

const rows = tools.map((tool) => {
  const local = validityByName.get(tool.name)
  assert.ok(local, `Missing local validity record for ${tool.name}`)
  const target = tool.outputSchema ? "output" : "input"
  const schema = target === "output" ? local.output : local.input
  assert.ok(schema, `Missing ${target} validity for ${tool.name}`)
  const rejection = rejectionByName.get(tool.name)
  const openai = rejection
    ? "rejected"
    : normalizedByName.has(tool.name)
      ? "visible"
      : observation?.connectorError
        ? "connector failed"
        : !observation
          ? "pending"
          : "not presented"
  const rendered = normalizedByName.get(tool.name)
  const call = callByName.get(tool.name)
  return `| \`${tool.name}\` | ${target} | ${schema.metaSchemaValid ? "valid" : "invalid"} | ${schema.compileStatus} | ${openai} | ${call ? (call.ok ? "call ok" : "call failed") : "not tested"} | ${rendered ? `\`${escapeCell(target === "output" ? rendered.output : rendered.input)}\`` : ""} |`
})

const content = `# OpenAI JSON Schema Acceptance Report

This report separates local JSON Schema 2020-12 validity from observed OpenAI connector behavior. A schema can be meta-schema-valid yet unresolved or uncompilable, and OpenAI may accept, omit, degrade, or reject it independently.

OpenAI observation: ${observation ? (observation.connectorError ? `connector failed: ${observation.connectorError}` : `captured with prefix \`${observation.connectorPrefix}\``) : "pending connector refresh/capture"}

## MCP transport boundary

| Probe | Official MCP client |
| --- | --- |
${transport.map((item) => `| \`${item.name}\` | ${item.acceptedByOfficialClient ? "accepted" : "rejected"} |`).join("\n")}

These cases establish what reaches OpenAI at all. Rejected MCP transport shapes are not included in the OpenAI acceptance connector because one invalid \`tools/list\` result can invalidate the entire connector response.

## JSON Schema and OpenAI boundary

| Probe | Target | 2020-12 meta-schema | Local compile | OpenAI registry | Callability | Observed rendering |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Interpretation

- **valid / invalid** is determined locally with Ajv's JSON Schema 2020-12 meta-schema.
- **Local compile** additionally catches unresolved local references and malformed regular expressions where possible.
- **visible** means OpenAI exposed the tool in the connector registry.
- **rejected** means OpenAI explicitly rejected that tool schema during connector refresh.
- **not presented** means that tool was not part of the connector surface used for the captured OpenAI observation.
- **connector failed** means the acceptance connector could not be ingested as a usable tool surface.
- **call ok / call failed** records whether Code Mode could invoke the exposed connector tool with an empty argument object. The probe server itself intentionally accepts all calls so failures before the server are evidence about the connector/tool layer.
`

switch (mode) {
  case "--write":
    writeFileSync(reportPath, content)
    break
  case "--check":
    assert.equal(readFileSync(reportPath, "utf8"), content)
    break
  case "--stdout":
    process.stdout.write(content)
    break
  default:
    throw new Error(`Unknown mode: ${mode}`)
}

function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", "<br>")
}

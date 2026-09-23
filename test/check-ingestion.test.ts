import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

import {
  type McpToolDefinition,
  renderInputSchema,
  renderOutputSchema,
} from "../src/index.js"

const mcpToolsPath = resolve("fixtures/ingestion/mcp-tools.json")
const validityPath = resolve("fixtures/ingestion/json-schema-validity.json")
const transportPath = resolve("fixtures/ingestion/mcp-transport.json")
const normalizedPath = resolve("fixtures/ingestion/normalized.json")

test("separates JSON Schema validity from MCP transport ingestion", () => {
  const tools = JSON.parse(readFileSync(mcpToolsPath, "utf8")) as Array<{
    name: string
    inputSchema: unknown
  }>
  const validity = JSON.parse(readFileSync(validityPath, "utf8")) as Array<{
    name: string
    input: { metaSchemaValid: boolean; compileStatus: string }
    output?: { metaSchemaValid: boolean; compileStatus: string }
  }>
  const transport = JSON.parse(readFileSync(transportPath, "utf8")) as Array<{
    name: string
    acceptedByOfficialClient: boolean
  }>

  assert.equal(tools.length, validity.length)
  assert.equal(
    tools.every((tool) => tool.inputSchema !== undefined),
    true,
  )
  assert.equal(
    transport.find((item) => item.name === "transport_valid_object_input")
      ?.acceptedByOfficialClient,
    true,
  )
  for (const name of [
    "transport_string_root_input",
    "transport_array_root_input",
    "transport_missing_root_type",
    "transport_union_root_type",
  ]) {
    assert.equal(
      transport.find((item) => item.name === name)?.acceptedByOfficialClient,
      false,
      name,
    )
  }

  assert.equal(
    validity.find((item) => item.name === "input_valid_baseline")?.input
      .metaSchemaValid,
    true,
  )
  assert.equal(
    validity.find((item) => item.name === "input_invalid_type_name")?.input
      .metaSchemaValid,
    false,
  )
  assert.equal(
    validity.find((item) => item.name === "input_unresolved_ref")?.input
      .compileStatus,
    "unresolved-ref",
  )
  assert.equal(
    validity.find((item) => item.name === "input_invalid_pattern_syntax")?.input
      .compileStatus,
    "invalid-regex",
  )
})

test("matches every captured ingested schema conversion", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(readFileSync(normalizedPath, "utf8")) as Array<{
    name: string
    input: string
    output: string
  }>
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]))

  for (const expectedTool of expected) {
    const tool = toolsByName.get(expectedTool.name)
    assert.ok(tool, expectedTool.name)
    assert.equal(
      renderInputSchema(tool.inputSchema),
      expectedTool.input,
      `${expectedTool.name} input`,
    )
    if (tool.outputSchema) {
      assert.equal(
        renderOutputSchema(tool.outputSchema),
        expectedTool.output,
        `${expectedTool.name} output`,
      )
    }
  }
})

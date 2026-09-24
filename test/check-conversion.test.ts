import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"
import type { ListToolsResult as McpListToolsResult } from "@modelcontextprotocol/client"

import {
  type McpToolDefinition,
  renderInputSchema,
  renderJsonSchemaAsOpenAIOutputTypescript,
  renderJsonSchemaAsOpenAITypescript,
  renderOpenAIConnectorTypescript,
  renderOutputSchema,
  renderToolsList,
} from "../src/index.js"
import {
  normalizeConnectorDiscoveryCapture,
  serializeNormalizedConnectorDiscovery,
} from "../verify-openai/capture/parse-signatures.js"

const mcpToolsPath = resolve("fixtures/conversion/mcp-tools.json")
const openaiSignaturesPath = resolve("fixtures/conversion/openai-signatures.md")
const normalizedPath = resolve("fixtures/conversion/normalized.json")

test("captures the 76 conversion cases", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const signatures = readFileSync(openaiSignaturesPath, "utf8")

  assert.equal(tools.length, 76)
  assert.equal(
    tools.every(
      (tool) => typeof tool.name === "string" && tool.inputSchema !== undefined,
    ),
    true,
  )
  assert.equal((signatures.match(/```ts/g) ?? []).length, 76)
  assert.match(signatures, /mcp__test_openai_typescript__empty_object/)
  assert.match(signatures, /mcp__test_openai_typescript__output_schema/)
})

test("parses captured OpenAI signatures byte-for-byte", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const signatures = readFileSync(openaiSignaturesPath, "utf8")
  const expected = readFileSync(normalizedPath, "utf8")
  const normalized = normalizeConnectorDiscoveryCapture(
    signatures,
    "mcp__test_openai_typescript__",
  )

  assert.equal(serializeNormalizedConnectorDiscovery(normalized), expected)
  assert.deepEqual(
    normalized.map((tool) => tool.name),
    tools.map((tool) => tool.name),
  )
  assert.deepEqual(
    normalized.find((tool) => tool.name === "output_schema"),
    {
      name: "output_schema",
      input: "{ value: string }",
      output: "{ echoed: string, count?: integer }",
    },
  )
  assert.deepEqual(
    normalized.find((tool) => tool.name === "tool_meta_with_output"),
    {
      name: "tool_meta_with_output",
      input: "object",
      output: "{ value: string }",
    },
  )
})

test("matches every captured OpenAI input conversion", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(readFileSync(normalizedPath, "utf8")) as Array<{
    name: string
    input: string
    output: string
  }>
  const expectedByName = new Map(expected.map((tool) => [tool.name, tool]))

  for (const tool of tools) {
    assert.equal(
      renderInputSchema(tool.inputSchema),
      expectedByName.get(tool.name)?.input,
      tool.name,
    )
  }
})

test("matches every captured OpenAI output conversion", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(readFileSync(normalizedPath, "utf8")) as Array<{
    name: string
    input: string
    output: string
  }>
  const expectedByName = new Map(expected.map((tool) => [tool.name, tool]))

  for (const tool of tools) {
    if (!tool.outputSchema) continue
    assert.equal(
      renderOutputSchema(tool.outputSchema),
      expectedByName.get(tool.name)?.output,
      tool.name,
    )
  }
})

test("matches every captured OpenAI connector description", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const expectedDescriptions = readFileSync(openaiSignaturesPath, "utf8")

  assert.equal(
    renderToolsList({ tools }, "mcp__test_openai_typescript__"),
    expectedDescriptions,
  )
})

test("renders a connector signature without prose when a tool has no description", () => {
  assert.equal(
    renderToolsList(
      {
        tools: [
          {
            name: "undocumented",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      },
      "mcp__test__",
    ),
    "```ts\nmcp__test__undocumented(args: object): Promise<unknown>;\n```\n",
  )
})

test("requires the OpenAI MCP connector prefix shape", () => {
  assert.throws(
    () => renderToolsList({ tools: [] }, "test_openai_typescript"),
    /Expected an OpenAI MCP connector prefix/,
  )
})

test("accepts the MCP SDK tools/list result type directly", () => {
  const render = (result: McpListToolsResult) =>
    renderToolsList(result, "mcp__test_openai_typescript__")
  assert.equal(typeof render, "function")
})

test("keeps the 0.2.0 render names as deprecated aliases", () => {
  const schema = { type: "object" }
  assert.equal(
    renderJsonSchemaAsOpenAITypescript(schema),
    renderInputSchema(schema),
  )
  assert.equal(
    renderJsonSchemaAsOpenAIOutputTypescript(schema),
    renderOutputSchema(schema),
  )
  assert.equal(
    renderOpenAIConnectorTypescript([], "mcp__test__"),
    renderToolsList({ tools: [] }, "mcp__test__"),
  )
})

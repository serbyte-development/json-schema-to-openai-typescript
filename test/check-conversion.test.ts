import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

import {
  type McpToolDefinition,
  renderJsonSchemaAsOpenAIOutputTypescript,
  renderJsonSchemaAsOpenAITypescript,
  renderOpenAIConnectorTypescript,
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
      renderJsonSchemaAsOpenAITypescript(tool.inputSchema),
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
      renderJsonSchemaAsOpenAIOutputTypescript(tool.outputSchema),
      expectedByName.get(tool.name)?.output,
      tool.name,
    )
  }
})

test("matches every captured OpenAI connector signature", () => {
  const tools = JSON.parse(
    readFileSync(mcpToolsPath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(readFileSync(normalizedPath, "utf8")) as Array<{
    name: string
    input: string
    output: string
  }>
  const expectedSignatures = `${expected
    .map(
      (tool) =>
        `mcp__test_openai_typescript__${tool.name}(args: ${tool.input}): Promise<${tool.output}>;`,
    )
    .join("\n")}\n`

  assert.equal(
    renderOpenAIConnectorTypescript(tools, "mcp__test_openai_typescript__"),
    expectedSignatures,
  )
})

test("requires the OpenAI MCP connector prefix shape", () => {
  assert.throws(
    () => renderOpenAIConnectorTypescript([], "test_openai_typescript"),
    /Expected an OpenAI MCP connector prefix/,
  )
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

import {
  normalizeConnectorDiscoveryCapture,
  serializeNormalizedConnectorDiscovery,
} from "../src/connector-capture.js"
import {
  type McpToolDefinition,
  renderJsonSchemaAsOpenAIOutputTypescript,
  renderJsonSchemaAsOpenAITypescript,
  renderOpenAIConnectorTypescript,
} from "../src/index.js"

const connectorBeforePath = resolve("fixtures/connector-discovery/before.json")
const connectorAfterPath = resolve("fixtures/connector-discovery/after.md")
const connectorNormalizedPath = resolve(
  "fixtures/connector-discovery/normalized.json",
)
const acceptanceBeforePath = resolve("fixtures/acceptance/before.json")
const acceptanceValidityPath = resolve(
  "fixtures/acceptance/local-validity.json",
)
const acceptanceTransportPath = resolve(
  "fixtures/acceptance/mcp-transport.json",
)
const acceptanceNormalizedPath = resolve("fixtures/acceptance/normalized.json")

test("connector discovery fixture captures the 76-tool probe surface", () => {
  const before = JSON.parse(
    readFileSync(connectorBeforePath, "utf8"),
  ) as McpToolDefinition[]
  const after = readFileSync(connectorAfterPath, "utf8")

  assert.equal(before.length, 76)
  assert.equal(
    before.every(
      (tool) => typeof tool.name === "string" && tool.inputSchema !== undefined,
    ),
    true,
  )
  assert.equal((after.match(/```ts/g) ?? []).length, 76)
  assert.match(after, /mcp__test_openai_typescript__empty_object/)
  assert.match(after, /mcp__test_openai_typescript__output_schema/)
})

test("normalizes connector discovery schemas byte-for-byte", () => {
  const before = JSON.parse(
    readFileSync(connectorBeforePath, "utf8"),
  ) as McpToolDefinition[]
  const after = readFileSync(connectorAfterPath, "utf8")
  const expected = readFileSync(connectorNormalizedPath, "utf8")
  const normalized = normalizeConnectorDiscoveryCapture(
    after,
    "mcp__test_openai_typescript__",
  )

  assert.equal(serializeNormalizedConnectorDiscovery(normalized), expected)
  assert.deepEqual(
    normalized.map((tool) => tool.name),
    before.map((tool) => tool.name),
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

test("renders every captured connector input schema exactly", () => {
  const before = JSON.parse(
    readFileSync(connectorBeforePath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(
    readFileSync(connectorNormalizedPath, "utf8"),
  ) as Array<{ name: string; input: string; output: string }>
  const expectedByName = new Map(expected.map((tool) => [tool.name, tool]))

  for (const tool of before) {
    assert.equal(
      renderJsonSchemaAsOpenAITypescript(tool.inputSchema),
      expectedByName.get(tool.name)?.input,
      tool.name,
    )
  }
})

test("renders every captured connector output schema exactly", () => {
  const before = JSON.parse(
    readFileSync(connectorBeforePath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(
    readFileSync(connectorNormalizedPath, "utf8"),
  ) as Array<{ name: string; input: string; output: string }>
  const expectedByName = new Map(expected.map((tool) => [tool.name, tool]))

  for (const tool of before) {
    if (!tool.outputSchema) continue
    assert.equal(
      renderJsonSchemaAsOpenAIOutputTypescript(tool.outputSchema),
      expectedByName.get(tool.name)?.output,
      tool.name,
    )
  }
})

test("renders every captured connector signature exactly", () => {
  const before = JSON.parse(
    readFileSync(connectorBeforePath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(
    readFileSync(connectorNormalizedPath, "utf8"),
  ) as Array<{ name: string; input: string; output: string }>

  const expectedSignatures = `${expected
    .map(
      (tool) =>
        `mcp__test_openai_typescript__${tool.name}(args: ${tool.input}): Promise<${tool.output}>;`,
    )
    .join("\n")}\n`

  assert.equal(
    renderOpenAIConnectorTypescript(before, {
      prefix: "mcp__test_openai_typescript__",
    }),
    expectedSignatures,
  )
})

test("captures JSON Schema validity separately from MCP transport acceptance", () => {
  const before = JSON.parse(
    readFileSync(acceptanceBeforePath, "utf8"),
  ) as Array<{
    name: string
    inputSchema: unknown
  }>
  const validity = JSON.parse(
    readFileSync(acceptanceValidityPath, "utf8"),
  ) as Array<{
    name: string
    input: { metaSchemaValid: boolean; compileStatus: string }
    output?: { metaSchemaValid: boolean; compileStatus: string }
  }>
  const transport = JSON.parse(
    readFileSync(acceptanceTransportPath, "utf8"),
  ) as Array<{ name: string; acceptedByOfficialClient: boolean }>

  assert.equal(before.length, validity.length)
  assert.equal(
    before.every((tool) => tool.inputSchema !== undefined),
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

test("renders every captured acceptance schema exactly", () => {
  const before = JSON.parse(
    readFileSync(acceptanceBeforePath, "utf8"),
  ) as McpToolDefinition[]
  const expected = JSON.parse(
    readFileSync(acceptanceNormalizedPath, "utf8"),
  ) as Array<{ name: string; input: string; output: string }>
  const beforeByName = new Map(before.map((tool) => [tool.name, tool]))

  for (const expectedTool of expected) {
    const tool = beforeByName.get(expectedTool.name)
    assert.ok(tool, expectedTool.name)
    assert.equal(
      renderJsonSchemaAsOpenAITypescript(tool.inputSchema),
      expectedTool.input,
      `${expectedTool.name} input`,
    )
    if (tool.outputSchema) {
      assert.equal(
        renderJsonSchemaAsOpenAIOutputTypescript(tool.outputSchema),
        expectedTool.output,
        `${expectedTool.name} output`,
      )
    }
  }
})

test("supports Harmony baseline schema features", () => {
  const rendered = renderJsonSchemaAsOpenAITypescript({
    type: "object",
    properties: {
      value: {
        title: "VALUE",
        description: "A value.",
        examples: ["hello", "world"],
        oneOf: [
          { type: "string", default: "fallback" },
          { type: "number", nullable: true, description: "Numeric value." },
        ],
      },
      kind: {
        type: ["string", "null"],
      },
    },
  })

  assert.equal(
    rendered,
    `{
// VALUE
//
// Examples:
// - "hello"
// - "world"
// A value.
value?:
 | string // default: "fallback"
 | number | null // Numeric value.
,
kind?: string | null,
}`,
  )
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

import { type McpToolDefinition, validateToolsList } from "../src/index.js"
import { MCP_TRANSPORT_CASES } from "../verify-openai/check-ingestion/cases.js"

const tools = JSON.parse(
  readFileSync(resolve("fixtures/ingestion/mcp-tools.json"), "utf8"),
) as McpToolDefinition[]
const toolsByName = new Map(tools.map((tool) => [tool.name, tool]))

const observation = JSON.parse(
  readFileSync(resolve("fixtures/ingestion/openai-observation.json"), "utf8"),
) as { calls: Array<{ name: string; ok: boolean }> }
const rejections = JSON.parse(
  readFileSync(resolve("fixtures/ingestion/openai-rejections.json"), "utf8"),
) as Array<{ name: string }>

test("matches every captured OpenAI ingestion result", () => {
  for (const call of observation.calls) {
    const tool = toolsByName.get(call.name)
    assert.ok(tool, call.name)
    assert.equal(validateToolsList({ tools: [tool] }).valid, true, call.name)
  }

  for (const rejection of rejections) {
    const tool = toolsByName.get(rejection.name)
    assert.ok(tool, rejection.name)
    assert.equal(
      validateToolsList({ tools: [tool] }).valid,
      false,
      rejection.name,
    )
  }
})

test("reports accepted OpenAI degradation cases as warnings", () => {
  for (const [name, code] of [
    ["input_invalid_empty_enum", "compile_error"],
    ["input_unresolved_ref", "unresolved_ref"],
    ["output_invalid_pattern_syntax", "invalid_regex"],
    ["output_unresolved_ref", "unresolved_ref"],
  ] as const) {
    const tool = toolsByName.get(name)
    assert.ok(tool, name)
    const result = validateToolsList({ tools: [tool] })
    assert.equal(result.valid, true, name)
    assert.equal(result.tools[0]?.issues[0]?.severity, "warning", name)
    assert.equal(result.tools[0]?.issues[0]?.code, code, name)
  }
})

test("matches the MCP tools/list inputSchema root boundary", () => {
  for (const testCase of MCP_TRANSPORT_CASES) {
    const result = validateToolsList({
      tools: [testCase.tool as unknown as McpToolDefinition],
    })
    assert.equal(
      result.valid,
      testCase.name === "transport_valid_object_input",
      testCase.name,
    )
  }
})

test("identifies the invalid tool without invalidating valid tool results", () => {
  const good = toolsByName.get("input_valid_baseline")
  const bad = toolsByName.get("input_invalid_type_name")
  assert.ok(good)
  assert.ok(bad)

  const result = validateToolsList({ tools: [good, bad] })
  assert.equal(result.valid, false)
  assert.deepEqual(
    result.tools.map((tool) => [tool.name, tool.valid]),
    [
      ["input_valid_baseline", true],
      ["input_invalid_type_name", false],
    ],
  )
})

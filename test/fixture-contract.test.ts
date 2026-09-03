import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

import {
  renderJsonSchemaAsOpenAITypescript,
  renderOpenAITypescript,
  type McpToolDefinition,
} from "../src/index.js"

const beforePath = resolve("fixtures/before.json")
const afterPath = resolve("fixtures/after.ts")

test("captured before and after fixtures are present and coherent", () => {
  const before = JSON.parse(readFileSync(beforePath, "utf8")) as Array<{
    name?: unknown
    inputSchema?: unknown
  }>
  const after = readFileSync(afterPath, "utf8")

  assert.ok(Array.isArray(before))
  assert.ok(before.length > 0)
  assert.ok(before.every((tool) => typeof tool.name === "string" && tool.inputSchema !== undefined))
  assert.match(after, /type start_here =/)
  assert.match(after, /type submit_review =/)
})

test("renders the captured Shellby schema exactly like the observed OpenAI output", () => {
  const before = JSON.parse(readFileSync(beforePath, "utf8")) as McpToolDefinition[]
  const after = readFileSync(afterPath, "utf8")

  assert.equal(renderOpenAITypescript(before), after)
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

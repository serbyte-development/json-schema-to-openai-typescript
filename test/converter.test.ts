import assert from "node:assert/strict"
import test from "node:test"

import { renderJsonSchemaAsOpenAITypescript } from "../src/index.js"

test("converts Harmony baseline schema features", () => {
  const converted = renderJsonSchemaAsOpenAITypescript({
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
    converted,
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

import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import type { NormalizedConnectorTool } from "./connector-capture.js"

interface MatrixRow {
  feature: string
  input: string
  output: string
  probes: string[]
}

const rows: MatrixRow[] = [
  {
    feature: "Empty object",
    input: "structural",
    output: "structural",
    probes: ["empty_object", "output_empty_object"],
  },
  {
    feature: "Primitive top-level types",
    input: "structural",
    output: "degraded map",
    probes: [
      "primitive_types",
      "output_string",
      "output_number",
      "output_integer",
      "output_boolean",
      "output_null",
    ],
  },
  {
    feature: "Type-array unions",
    input: "structural",
    output: "degraded map",
    probes: ["type_unions", "output_type_union"],
  },
  {
    feature: "String constraints",
    input: "constraint comment",
    output: "constraint comment",
    probes: ["string_constraints", "output_string_constraints"],
  },
  {
    feature: "String formats",
    input: "constraint comment",
    output: "constraint comment",
    probes: ["string_formats", "output_string_formats"],
  },
  {
    feature: "String content keywords",
    input: "ignored",
    output: "ignored",
    probes: ["string_content", "output_string_content"],
  },
  {
    feature: "Enums",
    input: "structural",
    output: "degraded map/object at top level",
    probes: ["enum_and_const", "output_string_enum", "output_mixed_enum"],
  },
  {
    feature: "Const",
    input: "structural",
    output: "structural in object properties",
    probes: ["enum_and_const", "output_const"],
  },
  {
    feature: "Numeric constraints",
    input: "constraint comment",
    output: "constraint comment",
    probes: ["numeric_constraints", "output_numeric_constraints"],
  },
  {
    feature: "Defaults",
    input: "constraint comment",
    output: "constraint comment",
    probes: ["defaults", "output_defaults"],
  },
  {
    feature: "Titles, descriptions, examples",
    input: "constraint comment",
    output: "constraint comment",
    probes: ["metadata_annotations", "output_metadata"],
  },
  {
    feature: "Arrays",
    input: "structural",
    output: "degraded map at top level",
    probes: ["simple_arrays", "output_array"],
  },
  {
    feature: "Array size constraints",
    input: "constraint comment",
    output: "degraded map at top level",
    probes: ["array_constraints", "output_array_constraints"],
  },
  {
    feature: "Tuples / prefixItems",
    input: "structural",
    output: "degraded map at top level",
    probes: ["tuple_arrays", "output_closed_tuple", "output_open_tuple"],
  },
  {
    feature: "contains / minContains / maxContains",
    input: "ignored",
    output: "not independently probed",
    probes: ["array_contains"],
  },
  {
    feature: "Required / optional object properties",
    input: "structural",
    output: "structural",
    probes: ["object_required_optional", "output_object_required_optional"],
  },
  {
    feature: "additionalProperties",
    input: "structural",
    output: "structural",
    probes: ["additional_properties", "output_additional_properties"],
  },
  {
    feature: "patternProperties",
    input: "degraded object",
    output: "constraint comment + degraded object",
    probes: ["pattern_properties", "output_pattern_properties"],
  },
  {
    feature: "propertyNames / minProperties / maxProperties",
    input: "ignored",
    output: "constraint comment",
    probes: [
      "object_name_and_count_constraints",
      "output_object_name_and_count_constraints",
    ],
  },
  {
    feature: "dependentRequired / dependentSchemas",
    input: "ignored",
    output: "constraint comment",
    probes: ["object_dependencies", "output_object_dependencies"],
  },
  {
    feature: "oneOf",
    input: "structural",
    output: "degraded object",
    probes: ["one_of", "output_one_of"],
  },
  {
    feature: "anyOf",
    input: "structural",
    output: "degraded object",
    probes: ["any_of", "output_any_of"],
  },
  {
    feature: "allOf",
    input: "structural",
    output: "degraded object",
    probes: ["all_of", "output_all_of"],
  },
  {
    feature: "not",
    input: "structural",
    output: "degraded map",
    probes: ["not_schema", "output_not"],
  },
  {
    feature: "if / then / else",
    input: "ignored",
    output: "constraint comment",
    probes: ["conditional_schema", "output_conditional"],
  },
  {
    feature: "$defs / local $ref",
    input: "partial structural resolution",
    output: "structural resolution",
    probes: ["defs_and_ref", "output_defs_ref"],
  },
  {
    feature: "Legacy definitions / $ref",
    input: "degraded any",
    output: "structural resolution",
    probes: ["legacy_definitions_ref", "output_legacy_definitions_ref"],
  },
  {
    feature: "Recursive local $ref",
    input: "partial structural + degraded any",
    output: "degraded unknown",
    probes: ["recursive_ref", "output_recursive_ref"],
  },
  {
    feature: "$dynamicRef",
    input: "degraded any",
    output: "degraded any",
    probes: ["dynamic_ref", "output_dynamic_ref"],
  },
  {
    feature: "unevaluatedProperties / unevaluatedItems",
    input: "ignored",
    output: "constraint comment",
    probes: ["unevaluated_keywords", "output_unevaluated_keywords"],
  },
  {
    feature: "Boolean schemas",
    input: "structural any / never",
    output: "degraded map",
    probes: ["boolean_schemas", "output_boolean_schemas"],
  },
  {
    feature: "$id / $schema / $anchor / $comment",
    input: "ignored",
    output: "ignored",
    probes: ["schema_identity", "output_schema_identity"],
  },
  {
    feature: "OpenAPI nullable",
    input: "structural",
    output: "structural",
    probes: ["openapi_extensions", "output_nullable_extension"],
  },
  {
    feature: "OpenAPI discriminator / singular example",
    input: "discriminator ignored; union structural; example ignored",
    output: "discriminator ignored; union structural; example ignored",
    probes: ["openapi_extensions", "output_openapi_extensions"],
  },
  {
    feature: "Property-name edge cases",
    input: "structural as observed",
    output: "structural as observed",
    probes: ["property_name_edge_cases", "output_property_name_edge_cases"],
  },
  {
    feature: "Top-level unconstrained output",
    input: "n/a",
    output: "degraded unknown",
    probes: ["output_unconstrained"],
  },
  {
    feature: "Protocol-level MCP _meta",
    input: "n/a",
    output: "no collapse observed",
    probes: ["tool_meta_with_output"],
  },
]

const normalizedPath = resolve("fixtures/connector-discovery/normalized.json")
const outputPath = resolve("wiki/pages/schema-support-matrix.md")
const mode = process.argv[2] ?? "--check"
const normalized = JSON.parse(
  readFileSync(normalizedPath, "utf8"),
) as NormalizedConnectorTool[]
const names = new Set(normalized.map((tool) => tool.name))

for (const row of rows) {
  for (const probe of row.probes) {
    assert.ok(
      names.has(probe),
      `Support matrix probe is missing from normalized fixture: ${probe}`,
    )
  }
}

const table = rows
  .map(
    (row) =>
      `| ${row.feature} | ${row.input} | ${row.output} | ${row.probes.map((probe) => `\`${probe}\``).join(", ")} |`,
  )
  .join("\n")

const content = `---
summary: "Fixture-backed support matrix for observed OpenAI JSON Schema input and MCP output-schema rendering behavior."
paths:
  - fixtures/connector-discovery/
  - probe-mcp/tools.ts
  - src/harmony-schema.ts
---

# Schema Support Matrix

This table is generated from the connector probe manifest and verified against \`fixtures/connector-discovery/normalized.json\`. The categories describe observed OpenAI behavior, not general JSON Schema semantics.

| Feature | Input behavior | Output behavior | Evidence probes |
| --- | --- | --- | --- |
${table}

## Category meanings

- **structural**: the schema feature changes the rendered TypeScript-like structure.
- **constraint comment**: the feature is preserved primarily as a comment rather than a TypeScript-like structural type.
- **ignored**: the probe shows no visible model-facing representation for the keyword itself.
- **degraded object**: OpenAI emits \`object\` instead of preserving the detailed top-level schema.
- **degraded map**: OpenAI emits \`{ [key: string]: any }\` for the top-level output.
- **degraded unknown**: OpenAI emits \`unknown\` for the output.

The exact bytes for every probe remain authoritative. See \`normalized.json\` when a row combines multiple behaviors or needs finer detail.
`

switch (mode) {
  case "--write":
    writeFileSync(outputPath, content)
    break
  case "--check":
    assert.equal(readFileSync(outputPath, "utf8"), content)
    break
  case "--stdout":
    process.stdout.write(content)
    break
  default:
    throw new Error(`Unknown mode: ${mode}`)
}

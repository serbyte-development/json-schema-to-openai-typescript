import type { JsonSchema } from "../../src/index.js"

export interface IngestionCase {
  name: string
  description: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
}

export interface TransportCase {
  name: string
  description: string
  tool: Record<string, unknown>
}

const EMPTY_INPUT: JsonSchema = { type: "object", properties: {} }

export const INGESTION_CASES: IngestionCase[] = [
  {
    name: "input_valid_baseline",
    description: "Acceptance probe: ordinary valid object input schema.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
    },
  },
  {
    name: "input_unknown_keyword",
    description:
      "Acceptance probe: unknown extension keyword in an otherwise valid input schema.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", "x-probe-keyword": true } },
    },
  },
  {
    name: "input_contradictory_allof",
    description: "Acceptance probe: valid but unsatisfiable allOf constraints.",
    inputSchema: {
      type: "object",
      properties: {
        value: { allOf: [{ type: "string" }, { type: "number" }] },
      },
    },
  },
  {
    name: "input_false_subschema",
    description: "Acceptance probe: false boolean property subschema.",
    inputSchema: {
      type: "object",
      properties: { value: false },
    },
  },
  {
    name: "input_recursive_ref_valid",
    description: "Acceptance probe: valid recursive local reference.",
    inputSchema: {
      type: "object",
      $defs: {
        node: {
          type: "object",
          properties: {
            value: { type: "string" },
            child: { $ref: "#/$defs/node" },
          },
        },
      },
      properties: { root: { $ref: "#/$defs/node" } },
    },
  },
  {
    name: "input_openapi_nullable",
    description:
      "Acceptance probe: OpenAPI nullable extension on an input property.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", nullable: true } },
    },
  },
  {
    name: "input_invalid_type_name",
    description: "Acceptance probe: invalid JSON Schema type name.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "wat" } },
    },
  },
  {
    name: "input_invalid_type_value",
    description: "Acceptance probe: numeric JSON Schema type value.",
    inputSchema: {
      type: "object",
      properties: { value: { type: 123 } },
    },
  },
  {
    name: "input_invalid_properties_array",
    description: "Acceptance probe: properties keyword with an array value.",
    inputSchema: { type: "object", properties: [] },
  },
  {
    name: "input_invalid_property_schema",
    description:
      "Acceptance probe: property schema is a number rather than a schema.",
    inputSchema: {
      type: "object",
      properties: { value: 123 },
    },
  },
  {
    name: "input_invalid_required_type",
    description: "Acceptance probe: required keyword with a string value.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
      required: "value",
    },
  },
  {
    name: "input_invalid_required_duplicates",
    description:
      "Acceptance probe: required keyword contains duplicate property names.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value", "value"],
    },
  },
  {
    name: "input_invalid_items_array_2020",
    description:
      "Acceptance probe: draft-07 tuple-style items array under JSON Schema 2020-12.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "array",
          items: [{ type: "string" }, { type: "number" }],
        },
      },
    },
  },
  {
    name: "input_invalid_prefix_items_type",
    description: "Acceptance probe: prefixItems keyword with an object value.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "array", prefixItems: { type: "string" } } },
    },
  },
  {
    name: "input_invalid_empty_enum",
    description: "Acceptance probe: empty enum array.",
    inputSchema: {
      type: "object",
      properties: { value: { enum: [] } },
    },
  },
  {
    name: "input_invalid_min_length",
    description: "Acceptance probe: negative minLength.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", minLength: -1 } },
    },
  },
  {
    name: "input_invalid_max_items",
    description: "Acceptance probe: fractional maxItems.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "array", maxItems: 1.5 } },
    },
  },
  {
    name: "input_invalid_multiple_of_zero",
    description: "Acceptance probe: multipleOf set to zero.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "number", multipleOf: 0 } },
    },
  },
  {
    name: "input_invalid_pattern_type",
    description: "Acceptance probe: pattern keyword with a numeric value.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", pattern: 42 } },
    },
  },
  {
    name: "input_invalid_pattern_syntax",
    description:
      "Acceptance probe: malformed regular-expression pattern string.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", pattern: "[" } },
    },
  },
  {
    name: "input_unresolved_ref",
    description:
      "Acceptance probe: syntactically valid but unresolved local reference.",
    inputSchema: {
      type: "object",
      properties: { value: { $ref: "#/$defs/missing" } },
    },
  },
  {
    name: "input_invalid_ref_type",
    description: "Acceptance probe: $ref keyword with a numeric value.",
    inputSchema: {
      type: "object",
      properties: { value: { $ref: 42 } },
    },
  },
  {
    name: "input_invalid_additional_properties",
    description:
      "Acceptance probe: additionalProperties keyword with a numeric value.",
    inputSchema: { type: "object", additionalProperties: 1 },
  },
  {
    name: "input_invalid_dependent_required",
    description:
      "Acceptance probe: dependentRequired entry with a string value.",
    inputSchema: {
      type: "object",
      dependentRequired: { credit_card: "billing_address" },
    },
  },
  {
    name: "input_invalid_dependent_schemas",
    description:
      "Acceptance probe: dependentSchemas entry with an array value.",
    inputSchema: {
      type: "object",
      dependentSchemas: { mode: [] },
    },
  },
  {
    name: "input_invalid_if",
    description: "Acceptance probe: if applicator with a numeric value.",
    inputSchema: { type: "object", if: 123 },
  },
  {
    name: "input_invalid_not",
    description: "Acceptance probe: not applicator with a numeric value.",
    inputSchema: { type: "object", not: 123 },
  },
  {
    name: "input_invalid_format_type",
    description: "Acceptance probe: format annotation with a numeric value.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", format: 123 } },
    },
  },
  {
    name: "output_valid_baseline",
    description: "Acceptance probe: ordinary valid object output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
    },
  },
  {
    name: "output_invalid_type_name",
    description: "Acceptance probe: invalid type name in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { type: "wat" } },
    },
  },
  {
    name: "output_invalid_required_type",
    description:
      "Acceptance probe: required keyword with a string value in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
      required: "value",
    },
  },
  {
    name: "output_invalid_properties_array",
    description:
      "Acceptance probe: properties keyword with an array value in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: { type: "object", properties: [] },
  },
  {
    name: "output_invalid_pattern_syntax",
    description:
      "Acceptance probe: malformed regular-expression pattern in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { type: "string", pattern: "[" } },
    },
  },
  {
    name: "output_unresolved_ref",
    description:
      "Acceptance probe: unresolved local reference in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { $ref: "#/$defs/missing" } },
    },
  },
  {
    name: "output_invalid_additional_properties",
    description:
      "Acceptance probe: numeric additionalProperties in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: { type: "object", additionalProperties: 1 },
  },
  {
    name: "output_unknown_keyword",
    description:
      "Acceptance probe: unknown extension keyword in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { type: "string", "x-probe-keyword": true } },
    },
  },
  {
    name: "output_contradictory_allof",
    description:
      "Acceptance probe: valid but unsatisfiable allOf in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: {
        value: { allOf: [{ type: "string" }, { type: "number" }] },
      },
    },
  },
  {
    name: "output_openapi_nullable",
    description:
      "Acceptance probe: OpenAPI nullable extension in output schema.",
    inputSchema: EMPTY_INPUT,
    outputSchema: {
      type: "object",
      properties: { value: { type: "string", nullable: true } },
    },
  },
]

export const MCP_TRANSPORT_CASES: TransportCase[] = [
  {
    name: "transport_valid_object_input",
    description: "MCP transport baseline with type object inputSchema.",
    tool: {
      name: "transport_valid_object_input",
      description: "MCP transport baseline with type object inputSchema.",
      inputSchema: { type: "object", properties: {} },
    },
  },
  {
    name: "transport_string_root_input",
    description: "MCP transport probe with type string inputSchema.",
    tool: {
      name: "transport_string_root_input",
      description: "MCP transport probe with type string inputSchema.",
      inputSchema: { type: "string" },
    },
  },
  {
    name: "transport_array_root_input",
    description: "MCP transport probe with type array inputSchema.",
    tool: {
      name: "transport_array_root_input",
      description: "MCP transport probe with type array inputSchema.",
      inputSchema: { type: "array", items: { type: "string" } },
    },
  },
  {
    name: "transport_missing_root_type",
    description: "MCP transport probe with inputSchema missing root type.",
    tool: {
      name: "transport_missing_root_type",
      description: "MCP transport probe with inputSchema missing root type.",
      inputSchema: { properties: { value: { type: "string" } } },
    },
  },
  {
    name: "transport_union_root_type",
    description: "MCP transport probe with an object/null root type union.",
    tool: {
      name: "transport_union_root_type",
      description: "MCP transport probe with an object/null root type union.",
      inputSchema: { type: ["object", "null"], properties: {} },
    },
  },
]

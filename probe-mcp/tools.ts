export type JsonSchema = Record<string, unknown>

export interface ObjectJsonSchema extends JsonSchema {
  type: "object"
}

export interface ProbeTool {
  name: string
  title?: string
  description: string
  inputSchema: ObjectJsonSchema
  outputSchema?: JsonSchema
  _meta?: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    destructiveHint?: boolean
    idempotentHint?: boolean
    openWorldHint?: boolean
  }
}

export const PROBE_TOOLS: ProbeTool[] = [
  {
    name: "empty_object",
    description: "Probe an empty object input schema.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "primitive_types",
    description:
      "Probe every JSON Schema primitive type plus an unconstrained schema.",
    inputSchema: {
      type: "object",
      properties: {
        string_value: { type: "string" },
        number_value: { type: "number" },
        integer_value: { type: "integer" },
        boolean_value: { type: "boolean" },
        null_value: { type: "null" },
        object_value: {
          type: "object",
          properties: { nested: { type: "string" } },
          required: ["nested"],
        },
        array_value: { type: "array", items: { type: "string" } },
        unconstrained_value: {},
      },
      required: [
        "string_value",
        "number_value",
        "integer_value",
        "boolean_value",
        "null_value",
      ],
    },
  },
  {
    name: "type_unions",
    description:
      "Probe JSON Schema type arrays including nullable and multi-type unions.",
    inputSchema: {
      type: "object",
      properties: {
        nullable_string: { type: ["string", "null"] },
        string_or_number: { type: ["string", "number"] },
        scalar_union: {
          type: ["string", "number", "integer", "boolean", "null"],
        },
        nullable_object: { type: ["object", "null"] },
        nullable_array: { type: ["array", "null"] },
      },
      required: ["nullable_string", "string_or_number"],
    },
  },
  {
    name: "string_constraints",
    description: "Probe string validation keywords.",
    inputSchema: {
      type: "object",
      properties: {
        bounded: { type: "string", minLength: 2, maxLength: 12 },
        patterned: { type: "string", pattern: "^[a-z][a-z0-9_-]+$" },
        bounded_pattern: {
          type: "string",
          minLength: 3,
          maxLength: 20,
          pattern: "^[A-Z]+$",
        },
      },
    },
  },
  {
    name: "string_formats",
    description: "Probe common JSON Schema format values.",
    inputSchema: {
      type: "object",
      properties: {
        date_time: { type: "string", format: "date-time" },
        date: { type: "string", format: "date" },
        time: { type: "string", format: "time" },
        duration: { type: "string", format: "duration" },
        email: { type: "string", format: "email" },
        hostname: { type: "string", format: "hostname" },
        ipv4: { type: "string", format: "ipv4" },
        ipv6: { type: "string", format: "ipv6" },
        uuid: { type: "string", format: "uuid" },
        uri: { type: "string", format: "uri" },
        uri_reference: { type: "string", format: "uri-reference" },
        regex: { type: "string", format: "regex" },
        json_pointer: { type: "string", format: "json-pointer" },
        relative_json_pointer: {
          type: "string",
          format: "relative-json-pointer",
        },
      },
    },
  },
  {
    name: "string_content",
    description: "Probe JSON Schema content keywords on strings.",
    inputSchema: {
      type: "object",
      properties: {
        base64_json: {
          type: "string",
          contentEncoding: "base64",
          contentMediaType: "application/json",
          contentSchema: {
            type: "object",
            properties: { value: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "enum_and_const",
    description: "Probe enum and const values across JSON types.",
    inputSchema: {
      type: "object",
      properties: {
        string_enum: { type: "string", enum: ["alpha", "beta", "gamma"] },
        number_enum: { type: "number", enum: [1, 2.5, 10] },
        integer_enum: { type: "integer", enum: [1, 2, 3] },
        boolean_enum: { type: "boolean", enum: [true, false] },
        mixed_enum: { enum: ["text", 42, true, null] },
        string_const: { type: "string", const: "fixed" },
        number_const: { type: "number", const: 3.14 },
        boolean_const: { type: "boolean", const: true },
        null_const: { const: null },
        object_const: { const: { fixed: true } },
        array_const: { const: [1, 2, 3] },
      },
    },
  },
  {
    name: "numeric_constraints",
    description: "Probe number and integer validation keywords.",
    inputSchema: {
      type: "object",
      properties: {
        inclusive_number: { type: "number", minimum: -10.5, maximum: 10.5 },
        exclusive_number: {
          type: "number",
          exclusiveMinimum: 0,
          exclusiveMaximum: 100,
        },
        multiple_number: { type: "number", multipleOf: 0.25 },
        bounded_integer: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          multipleOf: 5,
        },
      },
    },
  },
  {
    name: "defaults",
    description: "Probe default values on common schema types.",
    inputSchema: {
      type: "object",
      properties: {
        string_default: { type: "string", default: "hello" },
        enum_default: { type: "string", enum: ["a", "b"], default: "a" },
        number_default: { type: "number", default: 4 },
        integer_default: { type: "integer", default: 4 },
        boolean_default: { type: "boolean", default: true },
        null_default: { type: "null", default: null },
        array_default: {
          type: "array",
          items: { type: "string" },
          default: ["a"],
        },
        object_default: {
          type: "object",
          properties: { value: { type: "string" } },
          default: { value: "a" },
        },
      },
    },
  },
  {
    name: "metadata_annotations",
    title: "Schema Metadata Probe",
    description: "Probe schema annotation keywords and MCP tool annotations.",
    inputSchema: {
      type: "object",
      title: "Input Title",
      description: "Top-level input description.",
      examples: [{ value: "example" }],
      properties: {
        value: {
          type: "string",
          title: "Value Title",
          description: "Property description.",
          default: "fallback",
          examples: ["first", "second"],
          deprecated: true,
          readOnly: true,
          writeOnly: false,
          $comment: "Property comment.",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "simple_arrays",
    description: "Probe arrays with primitive, object, and nested-array items.",
    inputSchema: {
      type: "object",
      properties: {
        strings: { type: "array", items: { type: "string" } },
        integers: { type: "array", items: { type: "integer" } },
        objects: {
          type: "array",
          items: {
            type: "object",
            properties: { id: { type: "string" }, count: { type: "integer" } },
            required: ["id"],
          },
        },
        nested_arrays: {
          type: "array",
          items: { type: "array", items: { type: "number" } },
        },
      },
    },
  },
  {
    name: "array_constraints",
    description: "Probe array size and uniqueness validation keywords.",
    inputSchema: {
      type: "object",
      properties: {
        bounded: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 5,
        },
        unique: {
          type: "array",
          items: { type: "integer" },
          uniqueItems: true,
        },
      },
    },
  },
  {
    name: "tuple_arrays",
    description:
      "Probe tuple validation through prefixItems and an items tail schema.",
    inputSchema: {
      type: "object",
      properties: {
        closed_tuple: {
          type: "array",
          prefixItems: [
            { type: "string" },
            { type: "integer" },
            { type: "boolean" },
          ],
          items: false,
        },
        open_tuple: {
          type: "array",
          prefixItems: [{ type: "string" }, { type: "integer" }],
          items: { type: "number" },
        },
      },
    },
  },
  {
    name: "array_contains",
    description: "Probe contains, minContains, and maxContains.",
    inputSchema: {
      type: "object",
      properties: {
        values: {
          type: "array",
          items: { type: "string" },
          contains: { type: "string", pattern: "^match" },
          minContains: 1,
          maxContains: 2,
        },
      },
    },
  },
  {
    name: "object_required_optional",
    description:
      "Probe required and optional object properties at multiple nesting levels.",
    inputSchema: {
      type: "object",
      properties: {
        required_value: { type: "string" },
        optional_value: { type: "number" },
        nested: {
          type: "object",
          properties: {
            required_nested: { type: "boolean" },
            optional_nested: { type: "integer" },
          },
          required: ["required_nested"],
        },
      },
      required: ["required_value", "nested"],
    },
  },
  {
    name: "additional_properties",
    description: "Probe boolean and schema-valued additionalProperties.",
    inputSchema: {
      type: "object",
      properties: {
        closed: {
          type: "object",
          properties: { known: { type: "string" } },
          additionalProperties: false,
        },
        open: {
          type: "object",
          properties: { known: { type: "string" } },
          additionalProperties: true,
        },
        string_map: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      },
    },
  },
  {
    name: "pattern_properties",
    description: "Probe patternProperties with a closed object shape.",
    inputSchema: {
      type: "object",
      properties: {
        labels: {
          type: "object",
          patternProperties: {
            "^x-": { type: "string" },
            "^[0-9]+$": { type: "number" },
          },
          additionalProperties: false,
        },
      },
    },
  },
  {
    name: "object_name_and_count_constraints",
    description: "Probe propertyNames, minProperties, and maxProperties.",
    inputSchema: {
      type: "object",
      properties: {
        constrained_object: {
          type: "object",
          propertyNames: { pattern: "^[a-z_]+$" },
          minProperties: 1,
          maxProperties: 4,
          additionalProperties: { type: "string" },
        },
      },
    },
  },
  {
    name: "object_dependencies",
    description: "Probe dependentRequired and dependentSchemas.",
    inputSchema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: {
            credit_card: { type: "string" },
            billing_address: { type: "string" },
            mode: { type: "string" },
            detail: { type: "string" },
          },
          dependentRequired: { credit_card: ["billing_address"] },
          dependentSchemas: {
            mode: { properties: { detail: { minLength: 1 } } },
          },
        },
      },
    },
  },
  {
    name: "one_of",
    description:
      "Probe oneOf alternatives including descriptions and defaults.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          description: "Exactly one alternative.",
          oneOf: [
            { type: "string", default: "fallback" },
            { type: "number", description: "Numeric alternative." },
            {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id"],
            },
          ],
        },
      },
    },
  },
  {
    name: "any_of",
    description: "Probe anyOf alternatives.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          anyOf: [
            { type: "string", minLength: 1 },
            { type: "number", minimum: 0 },
            { type: "null" },
          ],
        },
      },
    },
  },
  {
    name: "all_of",
    description: "Probe allOf object composition.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          allOf: [
            {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id"],
            },
            {
              type: "object",
              properties: { count: { type: "integer", minimum: 0 } },
              required: ["count"],
            },
          ],
        },
      },
    },
  },
  {
    name: "not_schema",
    description: "Probe the not applicator.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string", not: { enum: ["forbidden"] } } },
    },
  },
  {
    name: "conditional_schema",
    description: "Probe if, then, and else conditional validation.",
    inputSchema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: { kind: { enum: ["text", "count"] }, value: {} },
          if: { properties: { kind: { const: "text" } }, required: ["kind"] },
          // biome-ignore lint/suspicious/noThenProperty: JSON Schema keyword.
          then: { properties: { value: { type: "string" } } },
          else: { properties: { value: { type: "integer" } } },
        },
      },
    },
  },
  {
    name: "defs_and_ref",
    description: "Probe local $defs and $ref resolution.",
    inputSchema: {
      type: "object",
      $defs: {
        identifier: { type: "string", pattern: "^[a-f0-9]{8}$" },
        record: {
          type: "object",
          properties: {
            id: { $ref: "#/$defs/identifier" },
            label: { type: "string" },
          },
          required: ["id"],
        },
      },
      properties: {
        id: { $ref: "#/$defs/identifier" },
        record: { $ref: "#/$defs/record" },
      },
      required: ["id"],
    },
  },
  {
    name: "legacy_definitions_ref",
    description: "Probe legacy definitions with a local $ref.",
    inputSchema: {
      type: "object",
      definitions: { legacy_id: { type: "string", minLength: 3 } },
      properties: { id: { $ref: "#/definitions/legacy_id" } },
    },
  },
  {
    name: "recursive_ref",
    description: "Probe a recursive local $ref.",
    inputSchema: {
      type: "object",
      $defs: {
        node: {
          type: "object",
          properties: {
            value: { type: "string" },
            children: { type: "array", items: { $ref: "#/$defs/node" } },
          },
          required: ["value"],
        },
      },
      properties: { root: { $ref: "#/$defs/node" } },
    },
  },
  {
    name: "dynamic_ref",
    description: "Probe $dynamicAnchor and $dynamicRef.",
    inputSchema: {
      type: "object",
      $defs: {
        node: {
          $dynamicAnchor: "node",
          type: "object",
          properties: {
            value: { type: "string" },
            child: { $dynamicRef: "#node" },
          },
        },
      },
      properties: { root: { $ref: "#/$defs/node" } },
    },
  },
  {
    name: "unevaluated_keywords",
    description: "Probe unevaluatedProperties and unevaluatedItems.",
    inputSchema: {
      type: "object",
      properties: {
        object_value: {
          allOf: [
            { type: "object", properties: { known: { type: "string" } } },
          ],
          unevaluatedProperties: false,
        },
        array_value: {
          type: "array",
          prefixItems: [{ type: "string" }],
          unevaluatedItems: false,
        },
      },
    },
  },
  {
    name: "boolean_schemas",
    description: "Probe true and false boolean schemas as property schemas.",
    inputSchema: {
      type: "object",
      properties: { allow_anything: true, allow_nothing: false },
    },
  },
  {
    name: "schema_identity",
    description: "Probe schema identity and comment keywords.",
    inputSchema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://example.test/openai-schema-probe/input",
      $anchor: "probe-input",
      $comment: "Top-level schema comment.",
      type: "object",
      properties: { value: { type: "string" } },
    },
  },
  {
    name: "openapi_extensions",
    description: "Probe common OpenAPI-style schema extensions.",
    inputSchema: {
      type: "object",
      properties: {
        nullable_string: { type: "string", nullable: true },
        discriminated: {
          oneOf: [
            {
              type: "object",
              properties: { kind: { const: "a" }, value: { type: "string" } },
            },
            {
              type: "object",
              properties: { kind: { const: "b" }, value: { type: "number" } },
            },
          ],
          discriminator: { propertyName: "kind" },
        },
        singular_example: { type: "string", example: "example-value" },
      },
    },
  },
  {
    name: "property_name_edge_cases",
    description:
      "Probe property names requiring special handling in TypeScript-like output.",
    inputSchema: {
      type: "object",
      properties: {
        "hyphen-name": { type: "string" },
        "space name": { type: "number" },
        "123numeric": { type: "integer" },
        'quoted"name': { type: "boolean" },
        $dollar: { type: "string" },
        "[key: string]": { type: ["object"] },
      },
      required: ["hyphen-name", "123numeric"],
    },
  },
  {
    name: "output_schema",
    description:
      "Probe whether MCP outputSchema affects the model-facing tool definition.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
    },
    outputSchema: {
      type: "object",
      properties: { echoed: { type: "string" }, count: { type: "integer" } },
      required: ["echoed"],
    },
  },
  {
    name: "output_empty_object",
    description: "Probe an empty object output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "object", properties: {} },
  },
  {
    name: "output_string",
    description: "Probe a top-level string output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "string" },
  },
  {
    name: "output_number",
    description: "Probe a top-level number output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "number" },
  },
  {
    name: "output_integer",
    description: "Probe a top-level integer output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "integer" },
  },
  {
    name: "output_boolean",
    description: "Probe a top-level boolean output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "boolean" },
  },
  {
    name: "output_null",
    description: "Probe a top-level null output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "null" },
  },
  {
    name: "output_unconstrained",
    description: "Probe an unconstrained output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {},
  },
  {
    name: "output_type_union",
    description: "Probe a type-array union output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: ["string", "number", "null"] },
  },
  {
    name: "output_string_enum",
    description: "Probe a string enum output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "string", enum: ["alpha", "beta", "gamma"] },
  },
  {
    name: "output_mixed_enum",
    description: "Probe a mixed-type enum output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { enum: ["text", 42, true, null] },
  },
  {
    name: "output_const",
    description: "Probe const values in an output object schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        string_const: { const: "fixed" },
        number_const: { const: 3.14 },
        boolean_const: { const: true },
        null_const: { const: null },
        object_const: { const: { fixed: true } },
        array_const: { const: [1, 2, 3] },
      },
    },
  },
  {
    name: "output_string_constraints",
    description: "Probe string constraints in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        bounded: { type: "string", minLength: 2, maxLength: 12 },
        patterned: { type: "string", pattern: "^[a-z]+$" },
        formatted: { type: "string", format: "email" },
      },
    },
  },
  {
    name: "output_string_formats",
    description: "Probe common string formats in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        date_time: { type: "string", format: "date-time" },
        date: { type: "string", format: "date" },
        time: { type: "string", format: "time" },
        duration: { type: "string", format: "duration" },
        email: { type: "string", format: "email" },
        hostname: { type: "string", format: "hostname" },
        ipv4: { type: "string", format: "ipv4" },
        ipv6: { type: "string", format: "ipv6" },
        uuid: { type: "string", format: "uuid" },
        uri: { type: "string", format: "uri" },
        uri_reference: { type: "string", format: "uri-reference" },
        regex: { type: "string", format: "regex" },
        json_pointer: { type: "string", format: "json-pointer" },
        relative_json_pointer: {
          type: "string",
          format: "relative-json-pointer",
        },
      },
    },
  },
  {
    name: "output_string_content",
    description: "Probe string content keywords in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        base64_json: {
          type: "string",
          contentEncoding: "base64",
          contentMediaType: "application/json",
          contentSchema: {
            type: "object",
            properties: { value: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "output_numeric_constraints",
    description: "Probe numeric constraints in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        inclusive: { type: "number", minimum: -10.5, maximum: 10.5 },
        exclusive: {
          type: "number",
          exclusiveMinimum: 0,
          exclusiveMaximum: 100,
        },
        multiple: { type: "integer", multipleOf: 5 },
      },
    },
  },
  {
    name: "output_defaults",
    description: "Probe default values in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        string_default: { type: "string", default: "hello" },
        enum_default: { type: "string", enum: ["a", "b"], default: "a" },
        number_default: { type: "number", default: 4 },
        integer_default: { type: "integer", default: 4 },
        boolean_default: { type: "boolean", default: true },
        null_default: { type: "null", default: null },
        array_default: {
          type: "array",
          items: { type: "string" },
          default: ["a"],
        },
        object_default: {
          type: "object",
          properties: { value: { type: "string" } },
          default: { value: "a" },
        },
      },
    },
  },
  {
    name: "output_array",
    description: "Probe a top-level array output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "array", items: { type: "string" } },
  },
  {
    name: "output_array_constraints",
    description: "Probe array constraints in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "array",
      items: { type: "integer" },
      minItems: 1,
      maxItems: 5,
      uniqueItems: true,
      contains: { type: "integer", minimum: 10 },
      minContains: 1,
      maxContains: 2,
    },
  },
  {
    name: "output_closed_tuple",
    description: "Probe a closed tuple output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "array",
      prefixItems: [
        { type: "string" },
        { type: "integer" },
        { type: "boolean" },
      ],
      items: false,
    },
  },
  {
    name: "output_open_tuple",
    description: "Probe an open tuple output schema with a typed rest element.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "array",
      prefixItems: [{ type: "string" }, { type: "integer" }],
      items: { type: "number" },
    },
  },
  {
    name: "output_object_required_optional",
    description:
      "Probe required and optional properties in an output object schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        required_value: { type: "string" },
        optional_value: { type: "number" },
        nested: {
          type: "object",
          properties: {
            required_nested: { type: "boolean" },
            optional_nested: { type: "integer" },
          },
          required: ["required_nested"],
        },
      },
      required: ["required_value", "nested"],
    },
  },
  {
    name: "output_additional_properties",
    description: "Probe additionalProperties in output object schemas.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        closed: {
          type: "object",
          properties: { known: { type: "string" } },
          additionalProperties: false,
        },
        open: {
          type: "object",
          properties: { known: { type: "string" } },
          additionalProperties: true,
        },
        string_map: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      },
    },
  },
  {
    name: "output_pattern_properties",
    description: "Probe patternProperties in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      patternProperties: {
        "^x-": { type: "string" },
        "^[0-9]+$": { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "output_object_name_and_count_constraints",
    description:
      "Probe propertyNames, minProperties, and maxProperties in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      propertyNames: { pattern: "^[a-z_]+$" },
      minProperties: 1,
      maxProperties: 4,
      additionalProperties: { type: "string" },
    },
  },
  {
    name: "output_object_dependencies",
    description:
      "Probe dependentRequired and dependentSchemas in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        credit_card: { type: "string" },
        billing_address: { type: "string" },
        mode: { type: "string" },
        detail: { type: "string" },
      },
      dependentRequired: { credit_card: ["billing_address"] },
      dependentSchemas: {
        mode: { properties: { detail: { minLength: 1 } } },
      },
    },
  },
  {
    name: "output_one_of",
    description: "Probe oneOf in a top-level output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      oneOf: [
        { type: "string", minLength: 1 },
        { type: "number", minimum: 0 },
        {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      ],
    },
  },
  {
    name: "output_any_of",
    description: "Probe anyOf in a top-level output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
    },
  },
  {
    name: "output_all_of",
    description: "Probe allOf in a top-level output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      allOf: [
        {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        {
          type: "object",
          properties: { count: { type: "integer", minimum: 0 } },
          required: ["count"],
        },
      ],
    },
  },
  {
    name: "output_not",
    description: "Probe not in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "string", not: { enum: ["forbidden"] } },
  },
  {
    name: "output_conditional",
    description: "Probe if, then, and else in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: { kind: { enum: ["text", "count"] }, value: {} },
      if: { properties: { kind: { const: "text" } }, required: ["kind"] },
      // biome-ignore lint/suspicious/noThenProperty: JSON Schema keyword.
      then: { properties: { value: { type: "string" } } },
      else: { properties: { value: { type: "integer" } } },
    },
  },
  {
    name: "output_defs_ref",
    description: "Probe local $defs and $ref in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      $defs: {
        identifier: { type: "string", pattern: "^[a-f0-9]{8}$" },
        record: {
          type: "object",
          properties: {
            id: { $ref: "#/$defs/identifier" },
            label: { type: "string" },
          },
          required: ["id"],
        },
      },
      properties: {
        id: { $ref: "#/$defs/identifier" },
        record: { $ref: "#/$defs/record" },
      },
      required: ["id"],
    },
  },
  {
    name: "output_legacy_definitions_ref",
    description: "Probe legacy definitions and $ref in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      definitions: { legacy_id: { type: "string", minLength: 3 } },
      properties: { id: { $ref: "#/definitions/legacy_id" } },
    },
  },
  {
    name: "output_recursive_ref",
    description: "Probe a recursive local $ref in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      $defs: {
        node: {
          type: "object",
          properties: {
            value: { type: "string" },
            children: { type: "array", items: { $ref: "#/$defs/node" } },
          },
          required: ["value"],
        },
      },
      properties: { root: { $ref: "#/$defs/node" } },
    },
  },
  {
    name: "output_dynamic_ref",
    description: "Probe $dynamicAnchor and $dynamicRef in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      $defs: {
        node: {
          $dynamicAnchor: "node",
          type: "object",
          properties: {
            value: { type: "string" },
            child: { $dynamicRef: "#node" },
          },
        },
      },
      properties: { root: { $ref: "#/$defs/node" } },
    },
  },
  {
    name: "output_unevaluated_keywords",
    description:
      "Probe unevaluatedProperties and unevaluatedItems in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        object_value: {
          allOf: [
            { type: "object", properties: { known: { type: "string" } } },
          ],
          unevaluatedProperties: false,
        },
        array_value: {
          type: "array",
          prefixItems: [{ type: "string" }],
          unevaluatedItems: false,
        },
      },
    },
  },
  {
    name: "output_boolean_schemas",
    description:
      "Probe true and false boolean schemas inside an output object.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: { allow_anything: true, allow_nothing: false },
    },
  },
  {
    name: "output_nullable_extension",
    description: "Probe OpenAPI nullable in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: { value: { type: "string", nullable: true } },
    },
  },
  {
    name: "output_openapi_extensions",
    description:
      "Probe OpenAPI-style discriminator and example extensions in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        discriminated: {
          oneOf: [
            {
              type: "object",
              properties: { kind: { const: "a" }, value: { type: "string" } },
            },
            {
              type: "object",
              properties: { kind: { const: "b" }, value: { type: "number" } },
            },
          ],
          discriminator: { propertyName: "kind" },
        },
        singular_example: { type: "string", example: "example-value" },
      },
    },
  },
  {
    name: "output_property_name_edge_cases",
    description: "Probe unusual property names in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        "hyphen-name": { type: "string" },
        "space name": { type: "number" },
        "123numeric": { type: "integer" },
        'quoted"name': { type: "boolean" },
        $dollar: { type: "string" },
        "[key: string]": { type: ["object"] },
      },
      required: ["hyphen-name", "123numeric"],
    },
  },
  {
    name: "output_metadata",
    description: "Probe annotation metadata in an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      title: "Output Title",
      description: "Top-level output description.",
      examples: [{ value: "example" }],
      properties: {
        value: {
          type: "string",
          title: "Output Value Title",
          description: "Output property description.",
          default: "fallback",
          examples: ["first", "second"],
          deprecated: true,
          readOnly: true,
          writeOnly: false,
          $comment: "Output property comment.",
        },
      },
    },
  },
  {
    name: "output_schema_identity",
    description: "Probe schema identity keywords on an output schema.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://example.test/openai-schema-probe/output",
      $anchor: "probe-output",
      $comment: "Top-level output comment.",
      type: "object",
      properties: { value: { type: "string" } },
    },
  },
  {
    name: "tool_meta_with_output",
    description:
      "Probe whether MCP tool _meta changes an otherwise ordinary rendered output type.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
    },
    _meta: {
      "com.example/schema-probe": {
        purpose: "Observe whether tool metadata changes OpenAI rendering.",
      },
    },
  },
]

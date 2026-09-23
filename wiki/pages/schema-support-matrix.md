---
summary: "Fixture-backed support matrix for observed OpenAI JSON Schema input and MCP output-schema conversion behavior."
paths:
  - fixtures/conversion/
  - verify-openai/check-conversion/cases.ts
  - src/converter.ts
---

# Schema Support Matrix

This table is generated from the conversion cases and verified against `fixtures/conversion/normalized.json`. The categories describe observed OpenAI behavior, not general JSON Schema semantics.

| Feature | Input behavior | Output behavior | Evidence cases |
| --- | --- | --- | --- |
| Empty object | structural | structural | `empty_object`, `output_empty_object` |
| Primitive top-level types | structural | degraded map | `primitive_types`, `output_string`, `output_number`, `output_integer`, `output_boolean`, `output_null` |
| Type-array unions | structural | degraded map | `type_unions`, `output_type_union` |
| String constraints | constraint comment | constraint comment | `string_constraints`, `output_string_constraints` |
| String formats | constraint comment | constraint comment | `string_formats`, `output_string_formats` |
| String content keywords | ignored | ignored | `string_content`, `output_string_content` |
| Enums | structural | degraded map/object at top level | `enum_and_const`, `output_string_enum`, `output_mixed_enum` |
| Const | structural | structural in object properties | `enum_and_const`, `output_const` |
| Numeric constraints | constraint comment | constraint comment | `numeric_constraints`, `output_numeric_constraints` |
| Defaults | constraint comment | constraint comment | `defaults`, `output_defaults` |
| Titles, descriptions, examples | constraint comment | constraint comment | `metadata_annotations`, `output_metadata` |
| Arrays | structural | degraded map at top level | `simple_arrays`, `output_array` |
| Array size constraints | constraint comment | degraded map at top level | `array_constraints`, `output_array_constraints` |
| Tuples / prefixItems | structural | degraded map at top level | `tuple_arrays`, `output_closed_tuple`, `output_open_tuple` |
| contains / minContains / maxContains | ignored | not independently checked | `array_contains` |
| Required / optional object properties | structural | structural | `object_required_optional`, `output_object_required_optional` |
| additionalProperties | structural | structural | `additional_properties`, `output_additional_properties` |
| patternProperties | degraded object | constraint comment + degraded object | `pattern_properties`, `output_pattern_properties` |
| propertyNames / minProperties / maxProperties | ignored | constraint comment | `object_name_and_count_constraints`, `output_object_name_and_count_constraints` |
| dependentRequired / dependentSchemas | ignored | constraint comment | `object_dependencies`, `output_object_dependencies` |
| oneOf | structural | degraded object | `one_of`, `output_one_of` |
| anyOf | structural | degraded object | `any_of`, `output_any_of` |
| allOf | structural | degraded object | `all_of`, `output_all_of` |
| not | structural | degraded map | `not_schema`, `output_not` |
| if / then / else | ignored | constraint comment | `conditional_schema`, `output_conditional` |
| $defs / local $ref | partial structural resolution | structural resolution | `defs_and_ref`, `output_defs_ref` |
| Legacy definitions / $ref | degraded any | structural resolution | `legacy_definitions_ref`, `output_legacy_definitions_ref` |
| Recursive local $ref | partial structural + degraded any | degraded unknown | `recursive_ref`, `output_recursive_ref` |
| $dynamicRef | degraded any | degraded any | `dynamic_ref`, `output_dynamic_ref` |
| unevaluatedProperties / unevaluatedItems | ignored | constraint comment | `unevaluated_keywords`, `output_unevaluated_keywords` |
| Boolean schemas | structural any / never | degraded map | `boolean_schemas`, `output_boolean_schemas` |
| $id / $schema / $anchor / $comment | ignored | ignored | `schema_identity`, `output_schema_identity` |
| OpenAPI nullable | structural | structural | `openapi_extensions`, `output_nullable_extension` |
| OpenAPI discriminator / singular example | discriminator ignored; union structural; example ignored | discriminator ignored; union structural; example ignored | `openapi_extensions`, `output_openapi_extensions` |
| Property-name edge cases | structural as observed | structural as observed | `property_name_edge_cases`, `output_property_name_edge_cases` |
| Top-level unconstrained output | n/a | degraded unknown | `output_unconstrained` |
| Protocol-level MCP _meta | n/a | no collapse observed | `tool_meta_with_output` |

## Category meanings

- **structural**: the schema feature changes the rendered TypeScript-like structure.
- **constraint comment**: the feature is preserved primarily as a comment rather than a TypeScript-like structural type.
- **ignored**: the case shows no visible model-facing representation for the keyword itself.
- **degraded object**: OpenAI emits `object` instead of preserving the detailed top-level schema.
- **degraded map**: OpenAI emits `{ [key: string]: any }` for the top-level output.
- **degraded unknown**: OpenAI emits `unknown` for the output.

The exact bytes for every case remain authoritative. See `normalized.json` when a row combines multiple behaviors or needs finer detail.

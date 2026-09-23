# OpenAI JSON Schema Acceptance Report

This report separates local JSON Schema 2020-12 validity from observed OpenAI connector behavior. A schema can be meta-schema-valid yet unresolved or uncompilable, and OpenAI may accept, omit, degrade, or reject it independently.

OpenAI observation: captured with prefix `mcp__test_openai_typescript__`

## MCP transport boundary

| Probe | Official MCP client |
| --- | --- |
| `transport_valid_object_input` | accepted |
| `transport_string_root_input` | rejected |
| `transport_array_root_input` | rejected |
| `transport_missing_root_type` | rejected |
| `transport_union_root_type` | rejected |

These cases establish what reaches OpenAI at all. Rejected MCP transport shapes are not included in the OpenAI acceptance connector because one invalid `tools/list` result can invalidate the entire connector response.

## JSON Schema and OpenAI boundary

| Probe | Target | 2020-12 meta-schema | Local compile | OpenAI registry | Callability | Observed rendering |
| --- | --- | --- | --- | --- | --- | --- |
| `input_valid_baseline` | input | valid | ok | visible | call ok | `{ value?: string }` |
| `input_unknown_keyword` | input | valid | ok | visible | call ok | `{ value?: string }` |
| `input_contradictory_allof` | input | valid | ok | visible | call ok | `{ value?: string & number }` |
| `input_false_subschema` | input | valid | ok | visible | call ok | `{ value?: never }` |
| `input_recursive_ref_valid` | input | valid | ok | visible | call ok | `{<br>root?: {<br>value?: string,<br>child?: any, // $ref: "#/$defs/node"<br>},<br>}` |
| `input_openapi_nullable` | input | valid | ok | visible | call ok | `{ value?: string \| null }` |
| `input_invalid_type_name` | input | invalid | invalid-schema | rejected | not tested |  |
| `input_invalid_type_value` | input | invalid | invalid-schema | rejected | not tested |  |
| `input_invalid_properties_array` | input | invalid | invalid-schema | rejected | not tested |  |
| `input_invalid_property_schema` | input | invalid | invalid-schema | rejected | not tested |  |
| `input_invalid_required_type` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_required_duplicates` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_items_array_2020` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_prefix_items_type` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_empty_enum` | input | valid | compile-error | visible | call ok | `{ value?: any }` |
| `input_invalid_min_length` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_max_items` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_multiple_of_zero` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_pattern_type` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_pattern_syntax` | input | valid | invalid-regex | rejected | not tested |  |
| `input_unresolved_ref` | input | valid | unresolved-ref | visible | call ok | `{ value?: any }` |
| `input_invalid_ref_type` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_additional_properties` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_dependent_required` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_dependent_schemas` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_if` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_not` | input | invalid | invalid-schema | not presented | not tested |  |
| `input_invalid_format_type` | input | invalid | invalid-schema | not presented | not tested |  |
| `output_valid_baseline` | output | valid | ok | visible | call ok | `{ value?: string }` |
| `output_invalid_type_name` | output | invalid | invalid-schema | not presented | not tested |  |
| `output_invalid_required_type` | output | invalid | invalid-schema | not presented | not tested |  |
| `output_invalid_properties_array` | output | invalid | invalid-schema | not presented | not tested |  |
| `output_invalid_pattern_syntax` | output | valid | invalid-regex | visible | call ok | `{<br>value?: string, // pattern: /[/<br>}` |
| `output_unresolved_ref` | output | valid | unresolved-ref | visible | call ok | `{ [key: string]: any }` |
| `output_invalid_additional_properties` | output | invalid | invalid-schema | not presented | not tested |  |
| `output_unknown_keyword` | output | valid | ok | visible | call ok | `{ value?: string }` |
| `output_contradictory_allof` | output | valid | ok | visible | call ok | `{ value?: string & number }` |
| `output_openapi_nullable` | output | valid | ok | visible | call ok | `{ value?: string \| null }` |

## Interpretation

- **valid / invalid** is determined locally with Ajv's JSON Schema 2020-12 meta-schema.
- **Local compile** additionally catches unresolved local references and malformed regular expressions where possible.
- **visible** means OpenAI exposed the tool in the connector registry.
- **rejected** means OpenAI explicitly rejected that tool schema during connector refresh.
- **accepted, capture pending** means connector refresh succeeded with that tool present, but its exact model-facing registry signature has not yet been captured into this repository.
- **not presented** means that tool was not part of the connector surface used for the captured OpenAI observation.
- **connector failed** means the acceptance connector could not be ingested as a usable tool surface.
- **call ok / call failed** records whether Code Mode could invoke the exposed connector tool with an empty argument object. The probe server itself intentionally accepts all calls so failures before the server are evidence about the connector/tool layer.

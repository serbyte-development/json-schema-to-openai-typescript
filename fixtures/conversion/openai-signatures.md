Probe an empty object input schema.

```ts
mcp__test_openai_typescript__empty_object(args: object): Promise<unknown>;
```

Probe every JSON Schema primitive type plus an unconstrained schema.

```ts
mcp__test_openai_typescript__primitive_types(args: { string_value: string, number_value: number, integer_value: integer, boolean_value: boolean, null_value: null, object_value?: { nested: string }, array_value?: string[], unconstrained_value?: any }): Promise<unknown>;
```

Probe JSON Schema type arrays including nullable and multi-type unions.

```ts
mcp__test_openai_typescript__type_unions(args: { nullable_string: string | null, string_or_number: string | number, scalar_union?: string | number | integer | boolean | null, nullable_object?: object | null, nullable_array?: any[] | null }): Promise<unknown>;
```

Probe string validation keywords.

```ts
mcp__test_openai_typescript__string_constraints(args: {
bounded?: string, // minLength: 2, maxLength: 12
patterned?: string, // pattern: /^[a-z][a-z0-9_-]+$/
bounded_pattern?: string, // minLength: 3, maxLength: 20, pattern: /^[A-Z]+$/
}): Promise<unknown>;
```

Probe common JSON Schema format values.

```ts
mcp__test_openai_typescript__string_formats(args: {
date_time?: string, // format: "date-time"
date?: string, // format: "date"
time?: string, // format: "time"
duration?: string, // format: "duration"
email?: string, // format: "email"
hostname?: string, // format: "hostname"
ipv4?: string, // format: "ipv4"
ipv6?: string, // format: "ipv6"
uuid?: string, // format: "uuid"
uri?: string, // format: "uri"
uri_reference?: string, // format: "uri-reference"
regex?: string, // format: "regex"
json_pointer?: string, // format: "json-pointer"
relative_json_pointer?: string, // format: "relative-json-pointer"
}): Promise<unknown>;
```

Probe JSON Schema content keywords on strings.

```ts
mcp__test_openai_typescript__string_content(args: { base64_json?: string }): Promise<unknown>;
```

Probe enum and const values across JSON types.

```ts
mcp__test_openai_typescript__enum_and_const(args: { string_enum?: "alpha" | "beta" | "gamma", number_enum?: 1 | 2.5 | 10, integer_enum?: 1 | 2 | 3, boolean_enum?: true | false, mixed_enum?: "text" | 42 | true | null, string_const?: "fixed", number_const?: 3.14, boolean_const?: true, null_const?: null, object_const?: {"fixed": true}, array_const?: [1, 2, 3] }): Promise<unknown>;
```

Probe number and integer validation keywords.

```ts
mcp__test_openai_typescript__numeric_constraints(args: {
inclusive_number?: number, // minimum: -10.5, maximum: 10.5
exclusive_number?: number, // exclusiveMinimum: 0.0, exclusiveMaximum: 100.0
multiple_number?: number, // multipleOf: 0.25
bounded_integer?: integer, // minimum: 1, maximum: 100, multipleOf: 5
}): Promise<unknown>;
```

Probe default values on common schema types.

```ts
mcp__test_openai_typescript__defaults(args: {
string_default?: string, // default: "hello"
enum_default?: "a" | "b", // default: "a"
number_default?: number, // default: 4
integer_default?: integer, // default: 4
boolean_default?: boolean, // default: true
null_default?: null, // default: null
array_default?: string[], // default: ["a"]
object_default?: { value?: string }, // default: {"value": "a"}
}): Promise<unknown>;
```

Probe schema annotation keywords and MCP tool annotations.

```ts
mcp__test_openai_typescript__metadata_annotations(args: // Input Title
//
// Top-level input description.
// Example: {"value": "example"}
{
// Value Title
//
// Property description.
// Examples:
// - "first"
// - "second"
value?: string, // default: "fallback"
}): Promise<unknown>;
```

Probe arrays with primitive, object, and nested-array items.

```ts
mcp__test_openai_typescript__simple_arrays(args: { strings?: string[], integers?: integer[], objects?: { id: string, count?: integer }[], nested_arrays?: number[][] }): Promise<unknown>;
```

Probe array size and uniqueness validation keywords.

```ts
mcp__test_openai_typescript__array_constraints(args: {
bounded?: string[], // minItems: 1, maxItems: 5
unique?: integer[],
}): Promise<unknown>;
```

Probe tuple validation through prefixItems and an items tail schema.

```ts
mcp__test_openai_typescript__tuple_arrays(args: { closed_tuple?: [item0?: string, item1?: integer, item2?: boolean], open_tuple?: [item0?: string, item1?: integer, ...items: number[]] }): Promise<unknown>;
```

Probe contains, minContains, and maxContains.

```ts
mcp__test_openai_typescript__array_contains(args: { values?: string[] }): Promise<unknown>;
```

Probe required and optional object properties at multiple nesting levels.

```ts
mcp__test_openai_typescript__object_required_optional(args: { required_value: string, optional_value?: number, nested: { required_nested: boolean, optional_nested?: integer } }): Promise<unknown>;
```

Probe boolean and schema-valued additionalProperties.

```ts
mcp__test_openai_typescript__additional_properties(args: { closed?: { known?: string }, open?: { known?: string, [key: string]: any }, string_map?: { [key: string]: string } }): Promise<unknown>;
```

Probe patternProperties with a closed object shape.

```ts
mcp__test_openai_typescript__pattern_properties(args: { labels?: object }): Promise<unknown>;
```

Probe propertyNames, minProperties, and maxProperties.

```ts
mcp__test_openai_typescript__object_name_and_count_constraints(args: { constrained_object?: { [key: string]: string } }): Promise<unknown>;
```

Probe dependentRequired and dependentSchemas.

```ts
mcp__test_openai_typescript__object_dependencies(args: { config?: { credit_card?: string, billing_address?: string, mode?: string, detail?: string } }): Promise<unknown>;
```

Probe oneOf alternatives including descriptions and defaults.

```ts
mcp__test_openai_typescript__one_of(args: {
// Exactly one alternative.
value?:
 | string // default: "fallback"
// Numeric alternative.
 | number
 | { id: string }
,
}): Promise<unknown>;
```

Probe anyOf alternatives.

```ts
mcp__test_openai_typescript__any_of(args: {
value?:
 | string // minLength: 1
 | number // minimum: 0.0
 | null
,
}): Promise<unknown>;
```

Probe allOf object composition.

```ts
mcp__test_openai_typescript__all_of(args: {
value?:
 & { id: string }
 & {
count: integer, // minimum: 0
}
,
}): Promise<unknown>;
```

Probe the not applicator.

```ts
mcp__test_openai_typescript__not_schema(args: { value?: Exclude<any, "forbidden"> }): Promise<unknown>;
```

Probe if, then, and else conditional validation.

```ts
mcp__test_openai_typescript__conditional_schema(args: { config?: { kind?: "text" | "count", value?: any } }): Promise<unknown>;
```

Probe local $defs and $ref resolution.

```ts
mcp__test_openai_typescript__defs_and_ref(args: {
id: string, // pattern: /^[a-f0-9]{8}$/
record?: {
id: any, // $ref: "#/$defs/identifier"
label?: string,
},
}): Promise<unknown>;
```

Probe legacy definitions with a local $ref.

```ts
mcp__test_openai_typescript__legacy_definitions_ref(args: { id?: any }): Promise<unknown>;
```

Probe a recursive local $ref.

```ts
mcp__test_openai_typescript__recursive_ref(args: {
root?: {
value: string,
children?: Array<
any // $ref: "#/$defs/node"
>,
},
}): Promise<unknown>;
```

Probe $dynamicAnchor and $dynamicRef.

```ts
mcp__test_openai_typescript__dynamic_ref(args: { root?: { value?: string, child?: any } }): Promise<unknown>;
```

Probe unevaluatedProperties and unevaluatedItems.

```ts
mcp__test_openai_typescript__unevaluated_keywords(args: { object_value?: { known?: string }, array_value?: [item0?: string, ...items: any[]] }): Promise<unknown>;
```

Probe true and false boolean schemas as property schemas.

```ts
mcp__test_openai_typescript__boolean_schemas(args: { allow_anything?: any, allow_nothing?: never }): Promise<unknown>;
```

Probe schema identity and comment keywords.

```ts
mcp__test_openai_typescript__schema_identity(args: { value?: string }): Promise<unknown>;
```

Probe common OpenAPI-style schema extensions.

```ts
mcp__test_openai_typescript__openapi_extensions(args: { nullable_string?: string | null, discriminated?: { kind?: "a", value?: string } | { kind?: "b", value?: number }, singular_example?: string }): Promise<unknown>;
```

Probe property names requiring special handling in TypeScript-like output.

```ts
mcp__test_openai_typescript__property_name_edge_cases(args: { hyphen-name: string, space name?: number, 123numeric: integer, quoted"name?: boolean, $dollar?: string, [key: string]?: object }): Promise<unknown>;
```

Probe whether MCP outputSchema affects the model-facing tool definition.

```ts
mcp__test_openai_typescript__output_schema(args: { value: string }): Promise<{ echoed: string, count?: integer }>;
```

Probe an empty object output schema.

```ts
mcp__test_openai_typescript__output_empty_object(args: object): Promise<object>;
```

Probe a top-level string output schema.

```ts
mcp__test_openai_typescript__output_string(args: object): Promise<{ [key: string]: any }>;
```

Probe a top-level number output schema.

```ts
mcp__test_openai_typescript__output_number(args: object): Promise<{ [key: string]: any }>;
```

Probe a top-level integer output schema.

```ts
mcp__test_openai_typescript__output_integer(args: object): Promise<{ [key: string]: any }>;
```

Probe a top-level boolean output schema.

```ts
mcp__test_openai_typescript__output_boolean(args: object): Promise<{ [key: string]: any }>;
```

Probe a top-level null output schema.

```ts
mcp__test_openai_typescript__output_null(args: object): Promise<{ [key: string]: any }>;
```

Probe an unconstrained output schema.

```ts
mcp__test_openai_typescript__output_unconstrained(args: object): Promise<unknown>;
```

Probe a type-array union output schema.

```ts
mcp__test_openai_typescript__output_type_union(args: object): Promise<{ [key: string]: any }>;
```

Probe a string enum output schema.

```ts
mcp__test_openai_typescript__output_string_enum(args: object): Promise<{ [key: string]: any }>;
```

Probe a mixed-type enum output schema.

```ts
mcp__test_openai_typescript__output_mixed_enum(args: object): Promise<object>;
```

Probe const values in an output object schema.

```ts
mcp__test_openai_typescript__output_const(args: object): Promise<{ string_const?: "fixed", number_const?: 3.14, boolean_const?: true, null_const?: null, object_const?: {"fixed": true}, array_const?: [1, 2, 3] }>;
```

Probe string constraints in an output schema.

```ts
mcp__test_openai_typescript__output_string_constraints(args: object): Promise<{
bounded?: string, // minLength: 2, maxLength: 12
patterned?: string, // pattern: /^[a-z]+$/
formatted?: string, // format: "email"
}>;
```

Probe common string formats in an output schema.

```ts
mcp__test_openai_typescript__output_string_formats(args: object): Promise<{
date_time?: string, // format: "date-time"
date?: string, // format: "date"
time?: string, // format: "time"
duration?: string, // format: "duration"
email?: string, // format: "email"
hostname?: string, // format: "hostname"
ipv4?: string, // format: "ipv4"
ipv6?: string, // format: "ipv6"
uuid?: string, // format: "uuid"
uri?: string, // format: "uri"
uri_reference?: string, // format: "uri-reference"
regex?: string, // format: "regex"
json_pointer?: string, // format: "json-pointer"
relative_json_pointer?: string, // format: "relative-json-pointer"
}>;
```

Probe string content keywords in an output schema.

```ts
mcp__test_openai_typescript__output_string_content(args: object): Promise<{ base64_json?: string }>;
```

Probe numeric constraints in an output schema.

```ts
mcp__test_openai_typescript__output_numeric_constraints(args: object): Promise<{
inclusive?: number, // minimum: -10.5, maximum: 10.5
exclusive?: number, // exclusiveMinimum: 0.0, exclusiveMaximum: 100.0
multiple?: integer, // multipleOf: 5
}>;
```

Probe default values in an output schema.

```ts
mcp__test_openai_typescript__output_defaults(args: object): Promise<{
string_default?: string, // default: "hello"
enum_default?: "a" | "b", // default: "a"
number_default?: number, // default: 4
integer_default?: integer, // default: 4
boolean_default?: boolean, // default: true
null_default?: null, // default: null
array_default?: string[], // default: ["a"]
object_default?: { value?: string }, // default: {"value": "a"}
}>;
```

Probe a top-level array output schema.

```ts
mcp__test_openai_typescript__output_array(args: object): Promise<{ [key: string]: any }>;
```

Probe array constraints in an output schema.

```ts
mcp__test_openai_typescript__output_array_constraints(args: object): Promise<{ [key: string]: any }>;
```

Probe a closed tuple output schema.

```ts
mcp__test_openai_typescript__output_closed_tuple(args: object): Promise<{ [key: string]: any }>;
```

Probe an open tuple output schema with a typed rest element.

```ts
mcp__test_openai_typescript__output_open_tuple(args: object): Promise<{ [key: string]: any }>;
```

Probe required and optional properties in an output object schema.

```ts
mcp__test_openai_typescript__output_object_required_optional(args: object): Promise<{ required_value: string, optional_value?: number, nested: { required_nested: boolean, optional_nested?: integer } }>;
```

Probe additionalProperties in output object schemas.

```ts
mcp__test_openai_typescript__output_additional_properties(args: object): Promise<{ closed?: { known?: string }, open?: { known?: string, [key: string]: any }, string_map?: { [key: string]: string } }>;
```

Probe patternProperties in an output schema.

```ts
mcp__test_openai_typescript__output_pattern_properties(args: object): Promise<// Additional JSON Schema constraints: patternProperties={"^[0-9]+$": {"type": "number"}, "^x-": {"type": "string"}}
object>;
```

Probe propertyNames, minProperties, and maxProperties in an output schema.

```ts
mcp__test_openai_typescript__output_object_name_and_count_constraints(args: object): Promise<// Additional JSON Schema constraints: propertyNames={"pattern": "^[a-z_]+$"}; minProperties=1; maxProperties=4
{ [key: string]: string }>;
```

Probe dependentRequired and dependentSchemas in an output schema.

```ts
mcp__test_openai_typescript__output_object_dependencies(args: object): Promise<// Additional JSON Schema constraints: dependentRequired={"credit_card": ["billing_address"]}; dependentSchemas={"mode": {"properties": {"detail": {"minLength": 1}}}}
{ credit_card?: string, billing_address?: string, mode?: string, detail?: string }>;
```

Probe oneOf in a top-level output schema.

```ts
mcp__test_openai_typescript__output_one_of(args: object): Promise<object>;
```

Probe anyOf in a top-level output schema.

```ts
mcp__test_openai_typescript__output_any_of(args: object): Promise<object>;
```

Probe allOf in a top-level output schema.

```ts
mcp__test_openai_typescript__output_all_of(args: object): Promise<object>;
```

Probe not in an output schema.

```ts
mcp__test_openai_typescript__output_not(args: object): Promise<{ [key: string]: any }>;
```

Probe if, then, and else in an output schema.

```ts
mcp__test_openai_typescript__output_conditional(args: object): Promise<// Additional JSON Schema constraints: if={"properties": {"kind": {"const": "text"}}, "required": ["kind"]}; then={"properties": {"value": {"type": "string"}}}; else={"properties": {"value": {"type": "integer"}}}
{ kind?: "text" | "count", value?: any }>;
```

Probe local $defs and $ref in an output schema.

```ts
mcp__test_openai_typescript__output_defs_ref(args: object): Promise<{
id: string, // pattern: /^[a-f0-9]{8}$/
record?: {
id: string, // pattern: /^[a-f0-9]{8}$/
label?: string,
},
}>;
```

Probe legacy definitions and $ref in an output schema.

```ts
mcp__test_openai_typescript__output_legacy_definitions_ref(args: object): Promise<{
id?: string, // minLength: 3
}>;
```

Probe a recursive local $ref in an output schema.

```ts
mcp__test_openai_typescript__output_recursive_ref(args: object): Promise<unknown>;
```

Probe $dynamicAnchor and $dynamicRef in an output schema.

```ts
mcp__test_openai_typescript__output_dynamic_ref(args: object): Promise<{ root?: { value?: string, child?: any } }>;
```

Probe unevaluatedProperties and unevaluatedItems in an output schema.

```ts
mcp__test_openai_typescript__output_unevaluated_keywords(args: object): Promise<{
// Additional JSON Schema constraints: unevaluatedProperties=false
object_value?: { known?: string },
// Additional JSON Schema constraints: unevaluatedItems=false
array_value?: [item0?: string, ...items: any[]],
}>;
```

Probe true and false boolean schemas inside an output object.

```ts
mcp__test_openai_typescript__output_boolean_schemas(args: object): Promise<{ [key: string]: any }>;
```

Probe OpenAPI nullable in an output schema.

```ts
mcp__test_openai_typescript__output_nullable_extension(args: object): Promise<{ value?: string | null }>;
```

Probe OpenAPI-style discriminator and example extensions in an output schema.

```ts
mcp__test_openai_typescript__output_openapi_extensions(args: object): Promise<{ discriminated?: { kind?: "a", value?: string } | { kind?: "b", value?: number }, singular_example?: string }>;
```

Probe unusual property names in an output schema.

```ts
mcp__test_openai_typescript__output_property_name_edge_cases(args: object): Promise<{ hyphen-name: string, space name?: number, 123numeric: integer, quoted"name?: boolean, $dollar?: string, [key: string]?: object }>;
```

Probe annotation metadata in an output schema.

```ts
mcp__test_openai_typescript__output_metadata(args: object): Promise<// Output Title
//
// Top-level output description.
// Example: {"value": "example"}
{
// Output Value Title
//
// Output property description.
// Additional JSON Schema constraints: readOnly=true; writeOnly=false
// Examples:
// - "first"
// - "second"
value?: string, // default: "fallback"
}>;
```

Probe schema identity keywords on an output schema.

```ts
mcp__test_openai_typescript__output_schema_identity(args: object): Promise<{ value?: string }>;
```

Probe whether MCP tool _meta changes an otherwise ordinary rendered output type.

```ts
mcp__test_openai_typescript__tool_meta_with_output(args: object): Promise<{ value: string }>;
```

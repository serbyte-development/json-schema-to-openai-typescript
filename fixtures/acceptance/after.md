Acceptance probe: ordinary valid object input schema.

```ts
mcp__test_openai_typescript__input_valid_baseline(args: { value?: string }): Promise<unknown>;
```

Acceptance probe: unknown extension keyword in an otherwise valid input schema.

```ts
mcp__test_openai_typescript__input_unknown_keyword(args: { value?: string }): Promise<unknown>;
```

Acceptance probe: valid but unsatisfiable allOf constraints.

```ts
mcp__test_openai_typescript__input_contradictory_allof(args: { value?: string & number }): Promise<unknown>;
```

Acceptance probe: false boolean property subschema.

```ts
mcp__test_openai_typescript__input_false_subschema(args: { value?: never }): Promise<unknown>;
```

Acceptance probe: valid recursive local reference.

```ts
mcp__test_openai_typescript__input_recursive_ref_valid(args: {
root?: {
value?: string,
child?: any, // $ref: "#/$defs/node"
},
}): Promise<unknown>;
```

Acceptance probe: OpenAPI nullable extension on an input property.

```ts
mcp__test_openai_typescript__input_openapi_nullable(args: { value?: string | null }): Promise<unknown>;
```

Acceptance probe: ordinary valid object output schema.

```ts
mcp__test_openai_typescript__output_valid_baseline(args: object): Promise<{ value?: string }>;
```

Acceptance probe: unknown extension keyword in output schema.

```ts
mcp__test_openai_typescript__output_unknown_keyword(args: object): Promise<{ value?: string }>;
```

Acceptance probe: valid but unsatisfiable allOf in output schema.

```ts
mcp__test_openai_typescript__output_contradictory_allof(args: object): Promise<{ value?: string & number }>;
```

Acceptance probe: OpenAPI nullable extension in output schema.

```ts
mcp__test_openai_typescript__output_openapi_nullable(args: object): Promise<{ value?: string | null }>;
```

Acceptance probe: empty enum array.

```ts
mcp__test_openai_typescript__input_invalid_empty_enum(args: { value?: any }): Promise<unknown>;
```

Acceptance probe: syntactically valid but unresolved local reference.

```ts
mcp__test_openai_typescript__input_unresolved_ref(args: { value?: any }): Promise<unknown>;
```

Acceptance probe: malformed regular-expression pattern in output schema.

```ts
mcp__test_openai_typescript__output_invalid_pattern_syntax(args: object): Promise<{
value?: string, // pattern: /[/
}>;
```

Acceptance probe: unresolved local reference in output schema.

```ts
mcp__test_openai_typescript__output_unresolved_ref(args: object): Promise<{ [key: string]: any }>;
```

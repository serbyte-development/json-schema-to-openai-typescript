# OpenAI JSON Schema probe MCP

This MCP exposes hand-authored JSON Schema directly through `tools/list`. It avoids Zod or another schema generator so observed changes can be attributed to the MCP client/OpenAI transformation layer.

The tool set covers JSON Schema 2020-12 primitive types, unions, validation constraints, arrays, tuples, objects, composition, references, recursion, unevaluated keywords, metadata, formats, content keywords, boolean schemas, and several common OpenAPI extensions. Riskier constructs are isolated into separate tools.

The output-schema matrix uses separate tools for top-level primitive outputs, unconstrained outputs, type unions, enums, const values, string and numeric constraints, arrays, tuples, object shapes, additional and pattern properties, `oneOf`, `anyOf`, `allOf`, `not`, conditionals, local and recursive refs, boolean subschemas, OpenAPI `nullable`, schema annotations, schema identity keywords, and MCP tool `_meta`.

## Capture notes

- Connector discovery exposes the complete `mcp__<connector>__<tool>(args: ...): Promise<...>;` signature. The full signature is part of the compatibility contract, while normalized input/output bodies make schema-level differences easier to test independently.
- MCP `outputSchema` is observable in connector discovery as the `Promise<...>` return type. Output rendering is therefore part of the compatibility surface.

### Current observed output behavior

The current connector capture exposes 76 tools, including 43 output-schema probes.

- Protocol-level MCP tool `_meta` does not collapse an otherwise ordinary output schema in this capture. `tool_meta_with_output` renders as `Promise<{ value: string }>`.
- A top-level unconstrained output schema renders as `Promise<unknown>`.
- A recursive output schema using `$ref` renders as `Promise<unknown>` in this capture.
- Several top-level non-object output schemas, including primitive types, arrays, tuples, type unions, and a top-level `not`, render as `Promise<{ [key: string]: any }>`.
- Top-level `oneOf`, `anyOf`, and `allOf` output schemas render as `Promise<object>`.
- Object-shaped output schemas preserve substantial detail, including constraints, nested required/optional properties, `additionalProperties`, local refs, nullable behavior, annotations, and many unsupported keywords as `Additional JSON Schema constraints` comments.

Run locally:

```bash
npm run probe:mcp
```

The MCP endpoint is `http://127.0.0.1:3210/mcp` by default. Set `HOST` or `PORT` to override it.

Validate and print the exact `tools/list` payload through the official MCP client:

```bash
npm run probe:schemas
```

Write that exact payload to the connector-discovery fixture:

```bash
npm run probe:capture:before
```

Expose the running server with ngrok:

```bash
npm run probe:tunnel
```

Use the resulting HTTPS URL with `/mcp` as the connector URL.

The server uses one `/mcp` endpoint for both the renderer and acceptance probes. With no arguments it exposes the normal 76-tool renderer surface. To isolate acceptance cases, restart it with `acceptance` followed by one or more acceptance tool names. The connector URL does not change.

Examples:

```bash
npm run probe:mcp
npm run probe:mcp -- acceptance input_invalid_type_name
npm run probe:mcp -- acceptance input_valid_baseline output_valid_baseline
```

Generate and verify its local JSON Schema/MCP evidence with:

```bash
npm run probe:acceptance:local
npm run probe:acceptance:report
npm run probe:acceptance:verify
```

After refreshing the existing ChatGPT connector, capture the OpenAI registry observation and run `npm run probe:acceptance:finalize` to join visibility, rendering, and callability with the local validity data.

After the OpenAI-side registry descriptions have been captured into `fixtures/connector-discovery/after.md`, regenerate and verify the derived fixtures:

```bash
npm run probe:capture:finalize
npm run probe:capture:verify
```

See `wiki/pages/capture-workflow.md` for the complete boundary between locally reproducible capture steps and the ChatGPT-side registry capture.

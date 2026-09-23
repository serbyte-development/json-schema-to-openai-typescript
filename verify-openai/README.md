# Verify OpenAI JSON Schema behavior

This directory contains the machinery used to verify the converter against OpenAI and to check which JSON Schema shapes make it through MCP/OpenAI ingestion. The MCP server exposes hand-authored JSON Schema directly through `tools/list`, avoiding Zod or another schema generator so observed behavior can be attributed to the MCP/OpenAI boundary.

The conversion cases cover JSON Schema 2020-12 primitive types, unions, validation constraints, arrays, tuples, objects, composition, references, recursion, unevaluated keywords, metadata, formats, content keywords, boolean schemas, and several common OpenAPI extensions. Ingestion cases isolate shapes that may be rejected before or during connector ingestion.

The output-schema conversion cases cover top-level primitive outputs, unconstrained outputs, type unions, enums, const values, string and numeric constraints, arrays, tuples, object shapes, additional and pattern properties, `oneOf`, `anyOf`, `allOf`, `not`, conditionals, local and recursive refs, boolean subschemas, OpenAPI `nullable`, schema annotations, schema identity keywords, and MCP tool `_meta`.

## Capture notes

- Connector discovery exposes the complete `mcp__<connector>__<tool>(args: ...): Promise<...>;` signature. The full signature is part of the verification contract, while normalized input/output bodies make schema-level differences easier to check independently.
- MCP `outputSchema` is observable in connector discovery as the `Promise<...>` return type. Output rendering is therefore part of the compatibility surface.

### Current observed output behavior

The current conversion capture exposes 76 tools, including 43 output-schema cases.

- Protocol-level MCP tool `_meta` does not collapse an otherwise ordinary output schema in this capture. `tool_meta_with_output` renders as `Promise<{ value: string }>`.
- A top-level unconstrained output schema renders as `Promise<unknown>`.
- A recursive output schema using `$ref` renders as `Promise<unknown>` in this capture.
- Several top-level non-object output schemas, including primitive types, arrays, tuples, type unions, and a top-level `not`, render as `Promise<{ [key: string]: any }>`.
- Top-level `oneOf`, `anyOf`, and `allOf` output schemas render as `Promise<object>`.
- Object-shaped output schemas preserve substantial detail, including constraints, nested required/optional properties, `additionalProperties`, local refs, nullable behavior, annotations, and many unsupported keywords as `Additional JSON Schema constraints` comments.

Run locally:

```bash
npm run openai:serve
```

The MCP endpoint is `http://127.0.0.1:3210/mcp` by default. Set `HOST` or `PORT` to override it.

Capture the exact conversion-case `tools/list` payload through the official MCP client:

```bash
npm run openai:conversion:capture-tools
```

Expose the running server with ngrok:

```bash
npm run openai:tunnel
```

Use the resulting HTTPS URL with `/mcp` as the connector URL.

The server uses one `/mcp` endpoint for both checks. With no arguments it exposes the normal 76 conversion cases. To isolate ingestion behavior, restart it with `ingestion` followed by one or more case names. The connector URL does not change.

Examples:

```bash
npm run openai:serve
npm run openai:serve -- ingestion input_invalid_type_name
npm run openai:serve -- ingestion input_valid_baseline output_valid_baseline
```

Generate and verify its local JSON Schema/MCP evidence with:

```bash
npm run openai:ingestion:inspect
npm run openai:ingestion:report
npm run openai:ingestion:verify
```

After refreshing the existing ChatGPT connector, capture the OpenAI registry observation and run `npm run openai:ingestion:finalize` to join visibility, conversion, and callability with the local validity data.

After the OpenAI-side registry descriptions have been captured into `fixtures/conversion/openai-signatures.md`, regenerate and verify the derived fixtures:

```bash
npm run openai:conversion:finalize
npm run openai:conversion:verify
```

See `wiki/pages/capture-openai-signatures.md` for the complete boundary between locally reproducible capture steps and the ChatGPT-side registry capture.

# JSON Schema to OpenAI TypeScript

[![CI](https://github.com/Serbyte-Development/json-schema-to-openai-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/Serbyte-Development/json-schema-to-openai-typescript/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

The Problem:
OpenAI transforms MCP json schemas into TypeScript-like text before sending them to the model. When parsing your schema fails the model might only see an `unknown` type, with no warning/error message. 

The Solution:
This package converts JSON Schema into **OpenAI TypeScript**, the TypeScript-like schema representation observed in OpenAI MCP tool definitions across vigorous testing. So you can test your schema before publishing your connector to OpenAI.

[Install](#install) • [Quick start](#quick-start) • [CLI](#cli) • [API](#api) • [Schema support](#schema-support) • [Verify against OpenAI](#verify-against-openai)

Render standalone JSON Schema, MCP `inputSchema`, function/tool schemas, or JSON Schema authored for Structured Outputs. The output is model-facing schema text and can include TypeScript-like tokens such as `integer`.

> [!NOTE]
> **OpenAI TypeScript** is project terminology for this representation. This is an independent project and is not an OpenAI product or specification.

## Features

- Convert standalone JSON Schema without a tool wrapper.
- Convert MCP tool definitions into OpenAI connector signatures: `mcp__<connector>__<tool>(args: ...): Promise<...>;`.
- Preserve descriptions, titles, string examples, defaults, and common constraints as comments.
- Match captured ChatGPT/MCP formatting through byte-for-byte fixture tests.
- Ship with zero runtime dependencies.

## Install

```bash
npm install json-schema-to-openai-typescript
```

Requires Node.js 22 or newer. The package is ESM-only.

## Quick start

Render a standalone JSON Schema:

```ts
import { renderJsonSchemaAsOpenAITypescript } from "json-schema-to-openai-typescript"

const output = renderJsonSchemaAsOpenAITypescript({
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Search query.",
      minLength: 1,
    },
  },
  required: ["query"],
})

console.log(output)
```

Output:

```ts
{
// Search query.
query: string, // minLength: 1
}
```

Render MCP tool definitions in the current OpenAI connector shape:

```ts
import { renderOpenAIConnectorTypescript } from "json-schema-to-openai-typescript"

const output = renderOpenAIConnectorTypescript(
  [
    {
      name: "search",
      description: "Search documents.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query." },
        },
        required: ["query"],
      },
    },
  ],
  "mcp__my_connector__",
)
```

Output:

```ts
mcp__my_connector__search(args: {
// Search query.
query: string,
}): Promise<unknown>;
```

## CLI

Render an array of MCP-style tool definitions from a JSON file:

```bash
npx json-schema-to-openai-typescript tools.json --prefix mcp__my_connector__
```

The input array must contain `name`, optional `description`, `inputSchema`, and optional `outputSchema` fields. The CLI emits connector-style signatures and requires the connector namespace prefix used by Code Mode:

Output is written to stdout, so it can be redirected directly:

```bash
npx json-schema-to-openai-typescript tools.json --prefix mcp__my_connector__ > tools.ts
```

## API

| Export | Purpose |
| --- | --- |
| `renderJsonSchemaAsOpenAITypescript(schema)` | Render one standalone JSON Schema. |
| `renderJsonSchemaAsOpenAIOutputTypescript(schema)` | Render one MCP `outputSchema` using OpenAI's observed return-type behavior. |
| `renderOpenAIConnectorTypescript(tools, connectorPrefix)` | Render current connector-style `mcp__<connector>__<tool>(args: ...): Promise<...>;` signatures. `connectorPrefix` must have the form `mcp__<connector>__`. |
| `JsonSchema` | Type alias for schema input objects. |
| `McpToolDefinition` | Type for MCP-style tool input. |

## Schema support

The converter currently covers the captured OpenAI input-schema behavior for:

- nested objects and arrays
- required and optional properties
- string, numeric, boolean, mixed enums, and `const`
- `oneOf`, `anyOf`, `allOf`, `not`, nullable schemas, and `type` unions
- tuples through `prefixItems`
- `additionalProperties`, boolean schemas, and OpenAPI `nullable`
- local `$defs` references and the observed recursive/dynamic-ref fallbacks
- titles, descriptions, examples, defaults, and validation constraints as observed comments
- JSON Schema `integer` preserved as `integer`

`renderJsonSchemaAsOpenAIOutputTypescript` separately preserves the observed MCP output-schema behavior, including detailed object returns and OpenAI's observed `object`, `{ [key: string]: any }`, and `unknown` degradation cases.

The comprehensive connector probe currently matches **76/76 captured input schemas** and **43/43 captured output schemas** byte-for-byte.

Connector-style wrappers require the observed OpenAI connector prefix:

```ts
renderOpenAIConnectorTypescript(tools, "mcp__my_connector__")
```

The comprehensive fixture verifies the complete 76-tool signature surface byte-for-byte, including `Promise<unknown>` when no `outputSchema` is present.

MCP annotations are accepted by the tool type. Protocol-level MCP `_meta` was independently probed and did not collapse an ordinary output schema in the current capture.

> [!IMPORTANT]
> This package produces TypeScript-like schema text, not compilable TypeScript interfaces. Schema constructs outside the supported conversion rules can fall back to `any`.

## Verify against OpenAI

The converter is adapted from [OpenAI Harmony](https://github.com/openai/harmony)'s published JSON Schema-to-TypeScript conversion logic. This project preserves additional formatting observed in ChatGPT/MCP tool schemas, including `integer` spelling and `Array<T>` formatting.

The conversion evidence lives under `fixtures/conversion/`. It contains the 76-tool raw MCP schema capture, the exact OpenAI Code Mode connector signatures captured programmatically from `ALL_TOOLS`, and mechanically normalized input/output schema bodies used to check the converter.

The generated support matrix is maintained at `wiki/pages/schema-support-matrix.md`, and the reproducible capture procedure is documented at `wiki/pages/capture-openai-signatures.md`.

The ingestion checks distinguish MCP transport rejection, JSON Schema 2020-12 validity, reference/regex compilation, OpenAI connector visibility, model-facing transformation, and tool callability. See `wiki/pages/check-openai-ingestion.md`.

Observed ingestion boundaries include:

- MCP tool `inputSchema` must have root `type: "object"`; string, array, missing-type, and object/null-union roots are rejected by the official MCP client before OpenAI.
- Clearly invalid nested schema shapes are rejected by OpenAI with `Invalid MCP tool schema for tool ...`.
- Unknown extension keywords are accepted and omitted from the rendered type in the current capture.
- Valid-but-unsatisfiable `allOf` schemas are accepted and rendered structurally.
- An empty enum input is accepted and degrades to `any`.
- An unresolved input `$ref` is accepted and degrades to `any`.
- A malformed regex in an input `pattern` is rejected, while the analogous malformed output `pattern` is accepted and preserved as a comment.
- An unresolved output `$ref` is accepted and degrades the output to `{ [key: string]: any }`.

The captured ingestion cases are regression-tested byte-for-byte alongside the main 76-tool conversion fixture.

## Development

Install dependencies and run all project checks:

```bash
npm ci
npm run check
```

Render the included MCP fixture locally:

```bash
npm run convert -- fixtures/conversion/mcp-tools.json --prefix mcp__test_openai_typescript__
```

For a fresh ChatGPT Code Mode capture session, use [`verify-openai/capture/code-mode-prompt.md`](./verify-openai/capture/code-mode-prompt.md) rather than manually copying connector signatures.

Developed & maintained by [Serbyte Development](https://www.serbyte.net/) · [GitHub](https://github.com/Serbyte-Development)

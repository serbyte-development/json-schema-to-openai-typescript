# JSON Schema to OpenAI TypeScript

[![CI](https://github.com/Serbyte-Development/json-schema-to-openai-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/Serbyte-Development/json-schema-to-openai-typescript/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

Convert JSON Schema into **OpenAI TypeScript**, the TypeScript-like schema representation observed in OpenAI MCP tool definitions.

[Install](#install) • [Quick start](#quick-start) • [CLI](#cli) • [API](#api) • [Schema support](#schema-support) • [Compatibility](#compatibility)

Render standalone JSON Schema, MCP `inputSchema`, function/tool schemas, or JSON Schema authored for Structured Outputs. The output is model-facing schema text and can include TypeScript-like tokens such as `integer`.

> [!NOTE]
> **OpenAI TypeScript** is project terminology for this representation. This is an independent project and is not an OpenAI product or specification.

## Features

- Render standalone JSON Schema without a tool wrapper.
- Render MCP-style tool definitions as `type <name> = (...) => any;` declarations.
- Render descriptions, titles, string examples, defaults, and common constraints as comments.
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

Render MCP-style tool definitions:

```ts
import { renderOpenAITypescript } from "json-schema-to-openai-typescript"

const output = renderOpenAITypescript([
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
])
```

Output:

```ts
// Search documents.
type search = (_: {
// Search query.
query: string,
}) => any;
```

## CLI

Render an array of MCP-style tool definitions from a JSON file:

```bash
npx json-schema-to-openai-typescript tools.json
```

The input array must contain `name`, optional `description`, and `inputSchema` fields. Output is written to stdout, so it can be redirected directly:

```bash
npx json-schema-to-openai-typescript tools.json > tools.ts
```

## API

| Export | Purpose |
| --- | --- |
| `renderJsonSchemaAsOpenAITypescript(schema)` | Render one standalone JSON Schema. |
| `renderOpenAITypescript(tools)` | Render MCP-style tool definitions with `type <name> = ...` wrappers. |
| `JsonSchema` | Type alias for schema input objects. |
| `McpToolDefinition` | Type for MCP-style tool input. |

## Schema support

The renderer currently covers:

- nested objects and arrays
- required and optional properties
- string enums
- `oneOf`, nullable schemas, and `type` unions
- titles, descriptions, and string examples as comments
- defaults and common numeric, string, and array constraints
- JSON Schema `integer` preserved as `integer`

MCP annotations are accepted by the tool type but are not emitted in the observed output format.

> [!IMPORTANT]
> This package produces TypeScript-like schema text, not compilable TypeScript interfaces. Schema constructs outside the supported conversion rules can fall back to `any`.

## Compatibility

The standalone renderer is adapted from [OpenAI Harmony](https://github.com/openai/harmony)'s published JSON Schema-to-TypeScript conversion logic. This project preserves additional formatting observed in ChatGPT/MCP tool schemas, including `integer` spelling and `Array<T>` formatting.

The captured compatibility fixture is checked byte-for-byte:

- [`fixtures/before.json`](https://github.com/Serbyte-Development/json-schema-to-openai-typescript/blob/main/fixtures/before.json) contains the MCP tool definitions.
- [`fixtures/after.ts`](https://github.com/Serbyte-Development/json-schema-to-openai-typescript/blob/main/fixtures/after.ts) contains the matching observed OpenAI TypeScript representation.

## Development

Install dependencies and run all project checks:

```bash
npm ci
npm run check
```

Render the included MCP fixture locally:

```bash
npm run render -- fixtures/before.json
```

Developed & maintained by [Serbyte Development](https://www.serbyte.net/) · [GitHub](https://github.com/Serbyte-Development)

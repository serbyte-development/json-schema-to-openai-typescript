# JSON Schema to OpenAI TypeScript

[![CI](https://github.com/serbyte-development/json-schema-to-openai-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/serbyte-development/json-schema-to-openai-typescript/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

## The problem

OpenAI converts an MCP tool's JSON Schema into a TypeScript-like signature before the tool definition reaches the model. That conversion can reject, simplify, or lose schema information, leaving the model with `unknown`, `any`, or a generic object type even when your MCP schema looks correct.

## The solution

**JSON Schema to OpenAI TypeScript** converts your JSON Schema into the TypeScript-like representation OpenAI exposes to the model, so you can inspect what the model will actually receive before shipping your MCP server.

## How it works

This project builds on OpenAI Harmony's published JSON Schema-to-TypeScript conversion logic, then adapts it to match the MCP signatures OpenAI actually exposes to models. It captures raw MCP schemas and exact Code Mode tool signatures, parses those signatures into input/output fixtures, and checks this converter against the observed OpenAI output byte-for-byte.

## Before and after

**MCP JSON Schema**

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query."
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": ["query"]
}
```

**What OpenAI exposes to the model**

```ts
mcp__my_connector__search(args: {
// Search query.
query: string,
limit?: integer, // minimum: 1, maximum: 100
}): Promise<unknown>;
```

> [!NOTE]
> **OpenAI TypeScript** is project terminology for this representation. This is an independent project and is not an OpenAI product or specification.

[Install](#install) • [Quick start](#quick-start) • [CLI](#cli) • [API](#api) • [Schema support](#schema-support) • [Verify against OpenAI](#verify-against-openai)

## Install

```bash
npm install json-schema-to-openai-typescript
```

Requires Node.js 22 or newer. The package is ESM-only.

## Quick start

Render the result of MCP `tools/list` directly:

```ts
import { renderToolsList } from "json-schema-to-openai-typescript"

const toolsList = await client.listTools()
const output = renderToolsList(toolsList, "mcp__my_connector__")

console.log(output)
```

Validate the same `tools/list` result before connecting it to OpenAI:

```ts
import { validateToolsList } from "json-schema-to-openai-typescript"

const validation = validateToolsList(toolsList)
```

Output:

```ts
mcp__my_connector__search(args: {
// Search query.
query: string,
}): Promise<unknown>;
```

Render an individual MCP input or output schema:

```ts
import {
  renderInputSchema,
  renderOutputSchema,
} from "json-schema-to-openai-typescript"

renderInputSchema(tool.inputSchema)
renderOutputSchema(tool.outputSchema)
```

## Features

- Render a complete MCP `tools/list` result into OpenAI connector signatures: `mcp__<connector>__<tool>(args: ...): Promise<...>;`.
- Render individual MCP input and output schemas using their observed OpenAI behavior.
- Validate an MCP `tools/list` result against the schema behavior captured from OpenAI.
- Preserve descriptions, titles, string examples, defaults, and common constraints as comments.
- Match captured ChatGPT/MCP formatting through byte-for-byte fixture tests.

## CLI

Render a captured MCP `tools/list` result from a JSON file:

```bash
npx json-schema-to-openai-typescript tools-list.json --prefix mcp__my_connector__
```

The JSON should contain the `tools` array returned by MCP `tools/list`. For compatibility, a bare tool array is also accepted. The CLI requires the connector namespace prefix used by Code Mode.

Output is written to stdout, so it can be redirected directly:

```bash
npx json-schema-to-openai-typescript tools-list.json --prefix mcp__my_connector__ > tools.ts
```

## API

| Export | Purpose |
| --- | --- |
| `renderToolsList(result, connectorPrefix)` | Render an MCP `tools/list` result into OpenAI's connector signatures. |
| `renderInputSchema(schema)` | Render one MCP `inputSchema`. |
| `renderOutputSchema(schema)` | Render one MCP `outputSchema` using OpenAI's observed return-type behavior. |
| `validateToolsList(result)` | Validate every tool schema and report the specific tools that OpenAI would reject or degrade based on the captured behavior. |
| `JsonSchema` | Type alias for schema input objects. |
| `McpToolDefinition` | Type for MCP-style tool input. |
| `ToolsListResult` | Minimal structural type accepted by `renderToolsList`. |

The longer `0.2.0` render function names remain available as deprecated aliases for compatibility.

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

`renderOutputSchema` separately preserves the observed MCP output-schema behavior, including detailed object returns and OpenAI's observed `object`, `{ [key: string]: any }`, and `unknown` degradation cases.

The comprehensive connector probe currently matches **76/76 captured input schemas** and **43/43 captured output schemas** byte-for-byte.

Connector-style wrappers require the observed OpenAI connector prefix:

```ts
renderToolsList(toolsList, "mcp__my_connector__")
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

Developed & maintained by [Serbyte Development](https://www.serbyte.net/) · [GitHub](https://github.com/serbyte-development)

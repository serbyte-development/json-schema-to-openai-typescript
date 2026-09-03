# JSON Schema to OpenAI TypeScript

Convert JSON Schema into **OpenAI TypeScript**, the TypeScript-like schema syntax used for OpenAI tool definitions.

Render standalone JSON Schema, MCP `inputSchema`, function/tool schemas, or JSON Schema authored for Structured Outputs. Descriptions become comments, and schema structure becomes the corresponding TypeScript-like representation.

## Before and after

Input JSON Schema:

```json
{
  "name": "search",
  "description": "Search documents.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query.",
        "minLength": 1
      }
    },
    "required": ["query"]
  }
}
```

Observed OpenAI TypeScript tool definition:

```ts
// Search documents.
type search = (_: {
// Search query.
query: string, // minLength: 1
}) => any;
```

## Install

```bash
npm install json-schema-to-openai-typescript
```

Requires Node.js 22 or newer.

## CLI

```bash
npx json-schema-to-openai-typescript tools.json
```

The input is an array of MCP-style tool definitions containing `name`, optional `description`, and `inputSchema`.

## Library

```ts
import {
  renderJsonSchemaAsOpenAITypescript,
  renderOpenAITypescript,
} from "json-schema-to-openai-typescript"

const schemaOutput = renderJsonSchemaAsOpenAITypescript(schema)
const toolsOutput = renderOpenAITypescript(tools)
```

`renderJsonSchemaAsOpenAITypescript` accepts a standalone JSON Schema. `renderOpenAITypescript` adds the tool declaration wrapper for MCP-style tool definitions.

## Schema support

The renderer supports nested objects and arrays, required and optional properties, string enums, `oneOf`, nullable schemas, `type` unions, titles, examples, defaults, descriptions, and common validation constraints.

That also makes it useful for inspecting JSON Schema authored for Structured Outputs, as long as the schema uses supported keywords.

For local development:

```bash
npm run render -- fixtures/before.json
```

## Verify

```bash
npm run check
```

The golden test requires the renderer output to equal `fixtures/after.ts` byte-for-byte.

## Compatibility

This outputs TypeScript-like schema syntax, not compilable TypeScript interfaces.

The renderer starts from OpenAI Harmony's JSON Schema-to-TypeScript conversion logic. MCP/tool rendering adds formatting preserved from captured ChatGPT tool schemas.

Developed & maintained by [Serbyte Development](https://www.serbyte.net/) · [GitHub](https://github.com/Serbyte-Development)

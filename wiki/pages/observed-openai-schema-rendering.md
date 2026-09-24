---
summary: "Observed end-to-end behavior for how OpenAI turns MCP tools/list schemas and metadata into the model-facing Code Mode tool descriptions."
paths:
  - fixtures/conversion/
  - fixtures/ingestion/
  - src/converter.ts
  - src/index.ts
---

# Observed OpenAI Schema Rendering

This page summarizes what this repository has directly observed about the transformation from an MCP `tools/list` result to the tool representation exposed to the model in OpenAI Code Mode.

The exact captured fixtures remain authoritative. This page is a readable model of those observations, not an OpenAI specification.

## End-to-end shape

An MCP server exposes tools in roughly this form:

```json
{
  "name": "search",
  "description": "Search the connector.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query."
      }
    },
    "required": ["query"]
  }
}
```

In Code Mode, the corresponding entry in `ALL_TOOLS` is exposed as an object with `name` and `description`. The `description` contains the MCP tool description followed by a blank line and a fenced TypeScript-like signature:

````text
Search the connector.

```ts
mcp__my_connector__search(args: {
// Search query.
query: string,
}): Promise<unknown>;
```
````

The observed transformation is therefore:

```text
MCP tools/list
  name
  description
  inputSchema
  outputSchema?
  annotations?
        ↓
OpenAI connector processing
        ↓
Code Mode ALL_TOOLS
  name
  description = tool prose + fenced TypeScript-like signature
```

`renderToolsList()` reproduces that model-facing `description` format for a complete MCP `tools/list` result.

## Tool naming and wrapper

The current Code Mode connector wrapper is:

```ts
mcp__<connector>__<tool>(args: <input>): Promise<<output>>;
```

The connector prefix is part of the observed model-facing declaration. This project therefore requires callers of `renderToolsList()` to provide a prefix such as `mcp__my_connector__`.

## Tool descriptions

The MCP tool-level `description` is preserved as prose before the fenced signature.

This is separate from JSON Schema `description` fields:

- **tool description** → prose before the TypeScript fence
- **schema/property description** → TypeScript-style `//` comments inside the rendered schema

For example:

```json
{
  "name": "search",
  "description": "Search the connector.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query."
      }
    },
    "required": ["query"]
  }
}
```

renders as:

````text
Search the connector.

```ts
mcp__my_connector__search(args: {
// Search query.
query: string,
}): Promise<unknown>;
```
````

## Input schemas

MCP input schemas are rendered structurally into the `args` type.

Observed examples include:

```text
JSON Schema string       → string
JSON Schema number       → number
JSON Schema integer      → integer
JSON Schema boolean      → boolean
JSON Schema null         → null
enum                     → literal union
required property        → field
optional property        → field?
array                    → T[] or Array<T>
oneOf / anyOf            → union
allOf                    → intersection
false schema             → never
true schema              → any
```

Nested objects, arrays, tuples, local references, nullable schemas, defaults, constraints, and several OpenAPI extensions are covered by the conversion fixture. See [Schema Support Matrix](./schema-support-matrix.md) for the per-keyword behavior.

### Input root boundary

The official MCP client used by the verification harness requires an MCP tool `inputSchema` to have root `type: "object"`. String, array, missing-type, and object/null-union roots are rejected before they can be observed in OpenAI.

This transport boundary is distinct from the standalone schema renderer, which is intentionally more permissive.

## Output schemas

Output schemas do **not** follow exactly the same transformation rules as input schemas.

When a tool has no `outputSchema`, the observed connector signature uses:

```ts
Promise<unknown>
```

When a detailed object `outputSchema` is present, OpenAI can expose the structured return type:

```ts
Promise<{
value: string,
count?: integer,
}>
```

Several top-level output shapes degrade rather than preserving their full JSON Schema structure. The captured output behaviors include:

```text
object output                   → detailed object where supported
primitive top-level output      → { [key: string]: any }
array top-level output          → { [key: string]: any }
type-array output               → { [key: string]: any }
top-level oneOf/anyOf/allOf     → object
unresolved output $ref          → { [key: string]: any }
empty/unconstrained output      → unknown
recursive local output $ref     → unknown
```

This is why the project has separate `renderInputSchema()` and `renderOutputSchema()` functions.

## Titles, descriptions, examples, and constraints

Schema annotations often survive as comments rather than as TypeScript structure.

For example:

```json
{
  "type": "object",
  "title": "Input Title",
  "description": "Top-level input description.",
  "examples": [{ "value": "example" }],
  "properties": {
    "value": {
      "type": "string",
      "description": "Property description.",
      "default": "fallback"
    }
  }
}
```

is observed as a form equivalent to:

```ts
// Input Title
//
// Top-level input description.
// Example: {"value": "example"}
{
// Property description.
value?: string, // default: "fallback"
}
```

Other captured constraints can appear as trailing comments, including bounds, string lengths, regex patterns, formats, array limits, and related validation metadata.

## `any`, `object`, maps, and `unknown`

These values represent different degradation modes in the observed output.

### `any`

`any` generally appears where a particular nested schema cannot be represented or resolved while the surrounding structure is still preserved.

Examples from the ingestion capture include an unresolved input `$ref` and an empty input enum degrading the affected property to `any` while the tool remains visible and callable.

### `object`

`object` is used for some top-level output compositions where OpenAI does not preserve the detailed alternatives.

### `{ [key: string]: any }`

This generic map is a common top-level output fallback for unsupported or degraded output shapes, including primitive and array outputs in the current capture.

### `unknown`

For outputs, `unknown` is observed when no `outputSchema` is supplied and for some output schemas that lose all useful structure, including empty/unconstrained and recursive-reference cases in the current fixture.

The current repository conversion fixture does not contain an input schema whose entire rendered `args` type is `unknown`. Do not infer from the output rules that input and output `unknown` behavior is identical.

## Ingestion and rendering are separate boundaries

A schema can fail before rendering, or it can be accepted and then degrade during rendering.

The verification suite therefore separates:

```text
JSON Schema validity
        ↓
MCP transport acceptance
        ↓
OpenAI connector ingestion
        ↓
model-facing schema rendering
        ↓
tool callability
```

Observed examples:

- malformed input regex: valid at the JSON Schema meta-schema level, but rejected by OpenAI
- unresolved input `$ref`: accepted and rendered with `any`
- empty enum input: accepted and rendered with `any`
- malformed output regex: accepted and preserved as a comment
- unresolved output `$ref`: accepted and rendered as `{ [key: string]: any }`

See [Check OpenAI Ingestion](./check-openai-ingestion.md) for the ingestion evidence and distinctions.

## Annotations and metadata outside JSON Schema

MCP tool annotations are part of the raw tool definition but are not rendered as fields inside the TypeScript-like schema.

Protocol-level MCP `_meta` was independently probed and did not collapse an ordinary output schema in the current capture.

Unknown JSON Schema extension keywords are accepted in the current ingestion capture and omitted from the model-facing type.

## Evidence and coverage

The main conversion evidence currently consists of:

- 76 captured MCP tools
- 76 exact model-facing input conversions
- 43 exact model-facing output conversions
- the complete captured Code Mode tool descriptions, including prose and fenced signatures

The converter regression tests compare the individual schema bodies and the complete `renderToolsList()` output against those captures.

The ingestion suite separately checks valid, invalid, unresolved, and malformed edge cases against the MCP transport and observed OpenAI behavior.

For exact keyword coverage, use [Schema Support Matrix](./schema-support-matrix.md). For the capture procedure, use [Capture OpenAI Signatures](./capture-openai-signatures.md).

## Relationship to OpenAI Harmony

OpenAI Harmony publishes JSON Schema-to-TypeScript rendering logic and documents a TypeScript-like tool representation with schema descriptions rendered as comments. This project uses that implementation as a baseline, then preserves differences observed in current ChatGPT/MCP connector captures, including `integer` spelling, connector wrappers, return types, and output-schema behavior.

The repository fixtures, rather than Harmony alone, are the compatibility target for this project.

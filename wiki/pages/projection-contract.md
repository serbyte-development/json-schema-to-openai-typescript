---
summary: "Evidence-backed mapping between the captured MCP JSON Schema input and ChatGPT's TypeScript-like tool schema output."
paths:
  - fixtures/before.json
  - fixtures/after.ts
---

# Projection Contract

OpenAI Harmony is the standalone JSON Schema renderer baseline. The captured Shellby fixture pair is the compatibility contract for ChatGPT/MCP-specific behavior layered on top of that baseline.

This project calls the observed target representation **OpenAI TypeScript**. That is project terminology for the TypeScript-like schema shown to the model, not an official OpenAI specification name.

## Evidence

- `fixtures/before.json` is a release-safe copy of Shellby's generated MCP `tools/list` payload, including tool descriptions, `inputSchema`, and annotations.
- `fixtures/after.ts` is the matching tool-schema representation observed by ChatGPT for the same Shellby MCP surface.
- The original capture contained a local workspace path. That path is replaced with `/workspace` in both fixtures so the public repository does not expose a maintainer-specific filesystem path; this does not change the transformation rules under test.

## Observed mappings

- Tool `description` becomes comments immediately before the generated `type <tool> = ...` declaration.
- Object properties become fields inside a TypeScript-like object literal.
- Required JSON Schema properties omit `?`; optional properties use `?`.
- String enums become quoted union members.
- JSON Schema `integer` remains `integer`; this output is TypeScript-like rather than valid TypeScript.
- Arrays render as `Array<...>` and nested object/item constraints stay adjacent to the relevant generated type.
- Property descriptions become preceding comments.
- Keywords such as `default`, `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`, `format`, `minItems`, `maxItems`, and `multipleOf` can render as inline or preceding comments.
- Empty object input schemas render as zero-argument tool types.
- MCP annotations present in the input fixture do not appear in the observed output fixture.

## Known metadata risk

Shellby's `shell_run` previously used Zod `.meta(...)` to inject a `oneOf` fragment expressing command-versus-commands requirements. In ChatGPT that tool collapsed to `{ [key: string]: any }`. Removing that `.meta(...)` usage restored the detailed TypeScript-like representation.

The causal boundary is not yet known. Current evidence shows that the metadata injection caused the bad projection in this Shellby case. It does not establish that plain JSON Schema `oneOf` alone collapses OpenAI's renderer, nor that all `.meta(...)` usage does.

The comprehensive probe keeps this separate from MCP tool `_meta`. A dedicated `tool_meta_with_output` tool exists to test whether protocol-level `_meta` changes rendering. Do not treat the historical Zod `.meta(...)` result as evidence that MCP `_meta` has the same effect.

The September 2026 connector capture shows that protocol-level MCP tool `_meta` does not collapse an otherwise ordinary output schema: `tool_meta_with_output` is exposed with `Promise<{ value: string }>`.

## Output schemas

Connector discovery provides direct evidence that MCP `outputSchema` affects the exposed return type. For example, an input tool with an object output schema is surfaced with a `Promise<{ ... }>` return type instead of `Promise<unknown>`.

The probe MCP contains a dedicated output-schema matrix covering top-level primitives, unconstrained schemas, unions, enum/const, constraints, arrays and tuples, object maps, composition keywords, refs, recursion, boolean subschemas, OpenAPI nullable behavior, annotations, schema identity, and MCP tool `_meta`.

Observed return-shape behavior in the current capture includes:

- top-level unconstrained output -> `unknown`
- recursive `$ref` output -> `unknown`
- several top-level primitive/array/tuple/type-union/not outputs -> `{ [key: string]: any }`
- top-level `oneOf`/`anyOf`/`allOf` outputs -> `object`
- ordinary object outputs -> detailed rendered object types
- unsupported object keywords can survive as `Additional JSON Schema constraints` comments

The outer connector callable wrapper is not itself the JSON-Schema-to-TypeScript compatibility target. The rendered argument schema body matches the captured Shellby `after.ts` body byte-for-byte after removing only the connector namespace and callable wrapper. Return types remain relevant because they carry `outputSchema` rendering.

## Related OpenAI implementation

OpenAI publicly documents TypeScript-like function definitions in the Harmony response format and publishes the renderer source at `https://github.com/openai/harmony`.

This project adapts Harmony's `json_schema_to_typescript` implementation as its starting point. The TypeScript port adds compatibility adjustments where the captured ChatGPT/MCP projection differs. For example, the current Harmony renderer maps JSON Schema `integer` to `number` and renders arrays as `T[]`, while this project's captured fixture preserves `integer` and uses `Array<...>` formatting.

When extending schema support, prefer Harmony's published behavior first. Diverge only when direct ChatGPT/MCP evidence or a deliberate package-level compatibility decision justifies it.

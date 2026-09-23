---
summary: "How Code Mode reads OpenAI connector metadata and transfers exact signatures into repository fixtures without manual transcription."
paths:
  - fixtures/conversion/
  - verify-openai/capture/
---

# Capture Signatures in Code Mode

This project can capture the model-facing connector schema without manually retyping every rendered tool definition.

## Runtime boundary

In the ChatGPT environment used for these captures, `functions.exec` runs JavaScript in an OpenAI-side V8 isolate. The runtime exposes connector/tool metadata through `ALL_TOOLS` and exposes callable tools through the `tools` object.

This is separate from the Python/Jupyter execution environment and separate from the user's Mac. The V8 code can inspect connector metadata in memory and then call the `@Austins Macbook` MCP connector to persist that data locally.

The runtime contract is provided by the tool environment for the active conversation. Treat it as capture infrastructure, not as a public OpenAI API guarantee. Revalidate the available globals and metadata shape when the environment changes.

## Connector metadata shape

For the current connector environment, each discovered MCP tool is represented approximately as:

```js
{
  name: "mcp__test_openai_typescript__output_schema",
  description: `Probe whether MCP outputSchema affects the model-facing tool definition.

\`\`\`ts
mcp__test_openai_typescript__output_schema(args: { value: string }): Promise<{ echoed: string, count?: integer }>;
\`\`\``
}
```

The fenced TypeScript inside `description` is the rendered model-facing tool signature observed by the agent. Current Code Mode connector tools use the `mcp__<connector>__<tool>(args: ...): Promise<...>;` shape. The argument schema and return type are both part of the compatibility target.

## Capture flow

The reliable path is:

```text
Probe MCP tools/list
    -> raw JSON Schema tool definitions
    -> fixtures/conversion/mcp-tools.json

OpenAI connector registry metadata
    -> ALL_TOOLS
    -> exact tool.description strings
    -> fixtures/conversion/openai-signatures.md
```

The OpenAI-side JavaScript can transfer the exact registry strings directly into an `apply_patch` call:

```js
const connectorTools = ALL_TOOLS.filter((tool) =>
  tool.name.startsWith("mcp__test_openai_typescript__"),
)

const captured = connectorTools
  .map((tool) => tool.description ?? "")
  .join("\n\n")

await tools.mcp__Austins_Macbook__apply_patch({
  cwd: repositoryRoot,
  patch: buildPatch(captured),
})
```

The schema text itself stays in memory as a string. The agent authors the extraction and transfer code, while the observed rendered schema is carried programmatically instead of manually transcribed.

## Byte-fidelity rules

For byte-sensitive captures:

- Preserve the raw connector `description` strings before normalization.
- Avoid manually reconstructing schema bodies.
- Keep wrapper normalization separate from raw capture.
- Treat newline insertion from `.join("\n\n")`, trailing newlines, regex extraction, and patch encoding as explicit transformations.
- Verify tool counts and known sentinel signatures after writing the fixture.
- When practical, compare hashes before and after persistence.

The current connector wrapper is part of the observed output contract. Captures preserve the full namespaced callable signature, including `args:` and the `Promise<...>` return type.

## Current fixture strategy

Keep two layers:

1. **Raw evidence**: exact connector descriptions and exact MCP `tools/list` JSON.
2. **Normalized conversion fixtures**: mechanically extracted argument and return schema bodies used for conversion checks.

This separation makes the raw capture auditable while allowing schema-body tests to localize transformation differences. A separate exact-signature test still verifies the full connector name, `args:` wrapper, and `Promise<...>` return type.

The normalized fixture lives at `fixtures/conversion/normalized.json`. Each entry contains the tool name plus the exact extracted `input` and `output` schema-body strings. `verify-openai/check-conversion/normalize-signatures.ts` regenerates it from `openai-signatures.md`, and `npm run openai:conversion:normalize:check` verifies that the committed normalized fixture is byte-for-byte current.

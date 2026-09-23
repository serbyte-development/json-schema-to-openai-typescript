# Code Mode MCP Capture Prompt

Use this file as the handoff for a fresh ChatGPT session that needs to capture OpenAI's model-facing MCP tool signatures for this repository.

## Required tools

Enable the MCP connector being captured and `@Austins Macbook`. Use Code Mode (`functions.exec`) for the OpenAI-side registry inspection and `@Austins Macbook` for repository edits and validation.

## Capture contract

The authoritative OpenAI-side source is Code Mode's live `ALL_TOOLS` registry. Each MCP tool description contains the model-facing signature in a fenced TypeScript block, for example:

```ts
mcp__connector_name__tool_name(args: { value?: string }): Promise<unknown>;
```

Do not manually retype, reconstruct, normalize, reformat, or paraphrase those signatures. Preserve the exact `tool.description` strings supplied by `ALL_TOOLS`.

The data path must remain programmatic:

```text
ALL_TOOLS
  -> JavaScript strings in Code Mode
  -> programmatically constructed patch text
  -> @Austins Macbook apply_patch
  -> repository fixture
```

## Procedure

1. Initialize `@Austins Macbook` with `start_here` in coding mode.
2. In Code Mode, inspect `ALL_TOOLS` directly and filter the exact connector prefix being captured, such as `mcp__test_openai_typescript__`.
3. Verify the visible tool count and names against the intended MCP surface before changing any fixture. If the registry is stale or contains the wrong tools, stop and report the actual names/count instead of writing misleading evidence.
4. Build the raw capture entirely in JavaScript from the live descriptions:

   ```js
   const connectorTools = ALL_TOOLS.filter((tool) =>
     tool.name.startsWith(connectorPrefix),
   )

   const after =
     connectorTools.map((tool) => tool.description ?? "").join("\n\n") + "\n"
   ```

5. Build the `apply_patch` patch string from `after` in the same Code Mode execution path and call `@Austins Macbook`'s `apply_patch`. The model must not copy the signatures into a handwritten tool call.
6. For an acceptance capture, invoke each visible acceptance tool through its exact Code Mode callable when callability is part of the evidence. Construct the observation JSON programmatically from those results and write it through `apply_patch` as well.
7. Run the repository's normalization and verification commands after the raw capture is persisted.

## Standard renderer capture

For the 76-tool renderer probe, write the exact registry descriptions to:

```text
fixtures/connector-discovery/after.md
```

Then run:

```bash
npm run probe:capture:finalize
npm run probe:capture:verify
npm run check
```

## Acceptance capture

Acceptance cases may need isolated connector refreshes because one rejected schema can abort the whole refresh. Serve only the intended cases with:

```bash
npm run probe:mcp -- acceptance <tool-name> [tool-name...]
```

Append newly accepted exact descriptions to:

```text
fixtures/acceptance/after.md
```

Merge their call observations into:

```text
fixtures/acceptance/openai-observation.json
```

Record explicit connector-refresh failures in:

```text
fixtures/acceptance/openai-rejections.json
```

Then run:

```bash
npm run probe:acceptance:finalize
npm run probe:acceptance:verify
npm run check
```

## Fidelity rules

- Preserve registry order unless the target fixture explicitly documents a different ordering.
- Preserve whitespace, comments, line breaks, `integer` spelling, `Array<T>` formatting, connector prefixes, `args:`, and `Promise<...>` exactly as observed.
- Do not derive the OpenAI result from the local renderer. The renderer is what the capture verifies.
- Do not use a stale conversation's connector registry as evidence after the MCP surface changes. Use a fresh/actually refreshed registry and verify its names before writing.
- Keep raw OpenAI capture separate from normalized derived fixtures. Regenerate normalized files with repository scripts rather than editing them by hand.

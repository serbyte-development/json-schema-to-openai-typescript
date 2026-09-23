# New Chat Handoff: OpenAI JSON Schema Acceptance Probe

Repository:

`/Users/austinserb/Desktop/agent-workspace/projects/json-schema-to-openai-typescript`

## User action before starting

Open a brand-new ChatGPT conversation with these connectors enabled:

- `@test-openai-typescript`
- `@Austins Macbook`

The existing `@test-openai-typescript` connector has already been refreshed by the user. Its configured URL should remain unchanged.

## First task in the new chat

Use Code Mode / `functions.exec` to inspect `ALL_TOOLS` directly. Do not infer the connector surface from repository files.

Filter for tool names beginning with:

`mcp__test_openai_typescript__`

The expected current surface is the 10-tool safe acceptance set:

1. `input_valid_baseline`
2. `input_unknown_keyword`
3. `input_contradictory_allof`
4. `input_false_subschema`
5. `input_recursive_ref_valid`
6. `input_openapi_nullable`
7. `output_valid_baseline`
8. `output_unknown_keyword`
9. `output_contradictory_allof`
10. `output_openapi_nullable`

If the new chat sees the old 76-tool renderer surface instead, stop and report that result. Do not write acceptance OpenAI fixtures from the stale registry.

## Exact capture procedure

If the 10 acceptance tools are visible:

1. Read each exact tool `description` string from `ALL_TOOLS` in registry order.
2. Do not manually retype, reconstruct, normalize, or paraphrase any schema/signature text.
3. Invoke every visible acceptance tool with an empty argument object `{}` using its exact callable from the Code Mode `tools` object.
4. Record whether each invocation succeeds. If it fails, record the exact error text.
5. Build these two file contents entirely in Code Mode memory:

### `fixtures/acceptance/after.md`

Join the exact `description` strings with two newline characters:

```js
const after = connectorTools
  .map((tool) => tool.description ?? "")
  .join("\n\n") + "\n"
```

### `fixtures/acceptance/openai-observation.json`

Use this shape:

```json
{
  "connectorPrefix": "mcp__test_openai_typescript__",
  "calls": [
    {
      "name": "input_valid_baseline",
      "ok": true
    }
  ]
}
```

Include all visible acceptance tools in `calls`. Add `"error": "..."` only for failures. Pretty-print with 2 spaces and end the file with one newline.

## Critical byte-fidelity requirement

The OpenAI registry text must flow programmatically:

```text
ALL_TOOLS
  -> JavaScript strings in Code Mode
  -> programmatically constructed apply_patch payload
  -> @Austins Macbook apply_patch
  -> files on disk
```

Do not manually paste the signatures into a tool call.

Use `@Austins Macbook` `apply_patch` to write the two files. If they already exist, update them rather than inventing alternate paths.

## After writing the OpenAI fixtures

Run on the Mac from the repository root:

```bash
npm run probe:acceptance:finalize
npm run probe:acceptance:verify
npm run check
```

The acceptance report should then join:

- MCP transport acceptance
- local JSON Schema 2020-12 validity
- local compile/reference/regex status
- OpenAI registry visibility
- exact OpenAI TypeScript-like rendering
- tool callability

## Existing evidence that must be preserved

- The official MCP client accepts only root `inputSchema.type: "object"`; string, array, missing-type, and object/null-union roots were rejected before OpenAI.
- OpenAI explicitly rejected `input_invalid_type_name` during connector refresh with:

  `Invalid MCP tool schema for tool 'input_invalid_type_name'`

- That rejection is recorded in `fixtures/acceptance/openai-rejections.json`.
- The known-good renderer fixture remains separate and must not be modified during this capture.
- The 76-tool renderer surface remains available on the server at `/renderer/mcp` while acceptance testing is active.

## After the safe 10-tool capture succeeds

Do not immediately expose all invalid acceptance tools together. OpenAI aborts connector refresh at the first invalid tool schema.

The harness supports isolated selection through:

```bash
npm run probe:acceptance:select -- safe
npm run probe:acceptance:select -- tool <tool_name>
npm run probe:acceptance:select -- all
```

Use `tool <tool_name>` for one invalid/risky probe at a time. The user will refresh the same `@test-openai-typescript` connector between isolated cases. Record explicit OpenAI rejection errors in `fixtures/acceptance/openai-rejections.json`.

## Completion target

The task is complete when the repository has a verified acceptance report that can distinguish, per case:

- rejected by MCP transport
- valid JSON Schema 2020-12
- invalid JSON Schema 2020-12
- valid but unresolved/uncompilable locally
- visible to OpenAI
- rejected by OpenAI
- exact transformed schema
- callable vs connector/tool-layer call failure

Do not publish the npm package until this acceptance pass is complete and `npm run check` is green.

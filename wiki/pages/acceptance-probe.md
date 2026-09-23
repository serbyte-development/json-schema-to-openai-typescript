---
summary: "How the separate acceptance probe distinguishes MCP transport rules, JSON Schema validity, OpenAI connector visibility, transformation, and callability."
paths:
  - fixtures/acceptance/
  - probe-mcp/acceptance-tools.ts
  - probe-mcp/acceptance-local.ts
---

# Acceptance Probe

The renderer fixture answers what OpenAI transforms accepted schemas into. The acceptance probe answers a different question: which schemas reach OpenAI, which are valid JSON Schema 2020-12, which OpenAI exposes, and whether exposed tools can actually be called.

It is intentionally served as a separate MCP endpoint so malformed or edge-case schemas cannot destabilize the known-good 76-tool renderer fixture.

## Evidence layers

The acceptance report separates five boundaries:

1. **MCP transport acceptance**: whether the official MCP client accepts the tool definition returned by `tools/list`.
2. **JSON Schema 2020-12 validity**: whether Ajv validates the schema against the 2020-12 meta-schema.
3. **Local compilation**: whether references and regular expressions compile after meta-schema validation.
4. **OpenAI registry visibility**: whether OpenAI exposes the declared MCP tool in the connector tool registry and what signature it transforms into.
5. **Callability**: whether Code Mode can invoke the visible tool. The probe server intentionally accepts calls, so a pre-server failure is evidence about the connector/tool layer rather than application logic.

## Current local transport result

The official MCP client requires MCP tool `inputSchema` to have root `type: "object"`. It rejects string roots, array roots, a missing root type, and a root type union such as `["object", "null"]` before OpenAI is involved.

Nested schema content is probed separately. The acceptance connector contains valid schemas, invalid meta-schema values, malformed regular expressions, unresolved references, unknown extension keywords, valid-but-unsatisfiable schemas, OpenAPI extensions, and analogous `outputSchema` cases.

## Local capture

Regenerate the local evidence with:

```bash
npm run probe:acceptance:local
npm run probe:acceptance:report
```

The files under `fixtures/acceptance/` are:

- `before.json`: the MCP-valid acceptance tools that can be presented to OpenAI;
- `mcp-transport.json`: isolated root-input transport cases, including cases rejected by the official client;
- `local-validity.json`: JSON Schema 2020-12 validity and compile/reference status;
- `after.md`: raw OpenAI connector registry descriptions after the acceptance connector is connected;
- `openai-observation.json`: connector prefix/error state and callability observations;
- `normalized.json`: mechanically extracted model-facing signatures;
- `report.md`: joined local/OpenAI compatibility table.

The OpenAI files do not exist until the connector is connected and captured. `npm run probe:acceptance:verify` still verifies all locally available evidence while that observation is pending.

## Safe and isolated serving modes

Because OpenAI aborts connector refresh at the first invalid tool schema, `/mcp` defaults to the locally valid/compilable subset. Change the active acceptance surface without changing the connector URL:

```bash
npm run probe:acceptance:select -- renderer
npm run probe:acceptance:select -- safe
npm run probe:acceptance:select -- ambiguous
npm run probe:acceptance:select -- tool input_invalid_type_name
npm run probe:acceptance:select -- all
```

`ambiguous` exposes only the five cases where local meta-schema validity does not by itself tell us OpenAI's behavior: empty enum, malformed regex, unresolved input ref, malformed output regex, and unresolved output ref.

The running server reads `fixtures/acceptance/selection.json` for each `tools/list` request. `renderer` is the normal/default mode and exposes the 76-tool renderer fixture at `/mcp`. The other modes temporarily replace that surface with acceptance probes while keeping the same server, URL, and connector.

The first observed OpenAI rejection is `input_invalid_type_name`, reported during connector refresh as `Invalid MCP tool schema for tool 'input_invalid_type_name'`. That rejection is recorded separately from standard JSON Schema validity.

## OpenAI capture

All probe modes use the same connector route:

```text
/mcp
```

In `renderer` mode this route exposes the known-good 76-tool fixture. In an acceptance mode it exposes only the selected acceptance tools. Once the connector is refreshed, Code Mode can mechanically capture all visible tool descriptions, invoke visible acceptance tools, write the observation fixture, and regenerate the final report. No manual signature transcription is required.

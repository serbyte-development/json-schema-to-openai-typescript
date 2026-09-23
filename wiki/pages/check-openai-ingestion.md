---
summary: "How ingestion checks determine which JSON Schema shapes make it through MCP and OpenAI, and what happens when they do."
paths:
  - fixtures/ingestion/
  - verify-openai/check-ingestion/cases.ts
  - verify-openai/check-ingestion/inspect.ts
---

# Check OpenAI Ingestion

The conversion fixture answers what OpenAI transforms ingested schemas into. The ingestion checks answer a different question: which schemas reach OpenAI, which are valid JSON Schema 2020-12, which OpenAI exposes, and whether exposed tools can actually be called.

The same `/mcp` endpoint serves either the known-good conversion cases or an explicitly selected ingestion subset. Ingestion cases are selected at server startup so invalid schemas cannot accidentally contaminate the normal 76-tool surface.

## Evidence layers

The ingestion report separates five boundaries:

1. **MCP transport acceptance**: whether the official MCP client accepts the tool definition returned by `tools/list`.
2. **JSON Schema 2020-12 validity**: whether Ajv validates the schema against the 2020-12 meta-schema.
3. **Local compilation**: whether references and regular expressions compile after meta-schema validation.
4. **OpenAI registry visibility**: whether OpenAI exposes the declared MCP tool in the connector tool registry and what signature it transforms into.
5. **Callability**: whether Code Mode can invoke the visible tool. The verification server intentionally accepts calls, so a pre-server failure is evidence about the connector/tool layer rather than application logic.

## Current local transport result

The official MCP client requires MCP tool `inputSchema` to have root `type: "object"`. It rejects string roots, array roots, a missing root type, and a root type union such as `["object", "null"]` before OpenAI is involved.

Nested schema content is checked separately. The ingestion cases contain valid schemas, invalid meta-schema values, malformed regular expressions, unresolved references, unknown extension keywords, valid-but-unsatisfiable schemas, OpenAPI extensions, and analogous `outputSchema` cases.

## Local capture

Regenerate the local evidence with:

```bash
npm run openai:ingestion:inspect
npm run openai:ingestion:report
```

The files under `fixtures/ingestion/` are:

- `mcp-tools.json`: the MCP-valid ingestion cases that can be presented to OpenAI;
- `mcp-transport.json`: isolated root-input transport cases, including cases rejected by the official client;
- `json-schema-validity.json`: JSON Schema 2020-12 validity and compile/reference status;
- `openai-signatures.md`: raw OpenAI connector registry descriptions for ingested cases;
- `openai-observation.json`: connector prefix/error state and callability observations;
- `normalized.json`: mechanically extracted model-facing signatures;
- `report.md`: joined local/OpenAI compatibility table.

`openai-signatures.md` and `openai-observation.json` aggregate the ingested cases captured across isolated connector refreshes. Rejected cases are recorded separately in `openai-rejections.json`.

## Isolated serving

Because OpenAI aborts connector refresh at the first invalid tool schema, the server defaults to the known-good conversion cases. Restart it with explicit ingestion case names when checking ingestion behavior:

```bash
npm run openai:serve
npm run openai:serve -- ingestion input_invalid_type_name
npm run openai:serve -- ingestion input_valid_baseline output_valid_baseline
```

The public URL and connector configuration stay unchanged across restarts. Selection is explicit in the server command rather than stored as mutable fixture state.

The first observed OpenAI rejection is `input_invalid_type_name`, reported during connector refresh as `Invalid MCP tool schema for tool 'input_invalid_type_name'`. That rejection is recorded separately from standard JSON Schema validity.

## OpenAI capture

Both checks use the same connector route:

```text
/mcp
```

With no ingestion arguments this route exposes the known-good 76 conversion cases. With ingestion names it exposes only those cases. Once the connector is refreshed, Code Mode can mechanically capture all visible tool descriptions, invoke visible ingestion tools, write the observation fixture, and regenerate the final report. No manual signature transcription is required.

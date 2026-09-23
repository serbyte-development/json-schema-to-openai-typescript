---
summary: "How to capture OpenAI's exact MCP signatures and regenerate the derived conversion evidence without manual transcription."
paths:
  - verify-openai/capture/code-mode-prompt.md
  - fixtures/conversion/
  - verify-openai/
---

# Capture OpenAI Signatures

The conversion fixture has two independent evidence sources:

1. the raw MCP `tools/list` payload produced by the local probe;
2. the model-facing connector signatures exposed to ChatGPT after OpenAI ingests that MCP.

The first side is fully local and reproducible. The second side must be captured from the ChatGPT tool registry because that registry is the system under observation.

## 1. Capture the raw MCP schema

Run:

```bash
npm run openai:conversion:capture-tools
```

This starts an ephemeral local MCP server, connects with the official MCP client, calls `tools/list`, and writes the exact JSON payload to `fixtures/conversion/mcp-tools.json`.

To verify without rewriting:

```bash
npm run openai:conversion:capture-tools:check
```

## 2. Expose the probe to ChatGPT

In one terminal:

```bash
npm run openai:serve
```

In another terminal:

```bash
npm run openai:tunnel
```

Connect the resulting HTTPS URL with `/mcp` to ChatGPT. The local endpoint is `http://127.0.0.1:3210/mcp` by default.

## 3. Capture the OpenAI registry rendering

This step occurs inside ChatGPT Code Mode. Read the connector tools from `ALL_TOOLS`, preserve each exact `description` string, and transfer those strings directly to `fixtures/conversion/openai-signatures.md` through the Mac connector.

The schema text should remain an in-memory string throughout the transfer. Do not manually transcribe signatures. The detailed runtime boundary and byte-fidelity rules are documented in `capture-signatures-in-code-mode.md`.

For a fresh ChatGPT session, `verify-openai/capture/code-mode-prompt.md` is the reusable handoff prompt. It describes the required `ALL_TOOLS -> JavaScript strings -> apply_patch` data path for both conversion and ingestion captures.

## 4. Normalize and regenerate derived evidence

After `openai-signatures.md` is updated, run:

```bash
npm run openai:conversion:finalize
```

This regenerates:

- `fixtures/conversion/normalized.json`, containing exact extracted input/output schema bodies;
- `wiki/pages/schema-support-matrix.md`, the fixture-backed feature matrix.

## 5. Verify the complete capture

Run:

```bash
npm run openai:conversion:verify
```

It verifies all three deterministic boundaries:

- the committed `mcp-tools.json` equals a fresh official-client `tools/list` capture;
- `normalized.json` equals a fresh mechanical extraction from `openai-signatures.md`;
- the generated support matrix is current.

`npm run check` includes this verification before typechecking, tests, and build.

## Capture boundary

No local script can independently reproduce `openai-signatures.md`, because that file records OpenAI's model-facing connector transformation. The reproducible boundary is therefore intentional: everything before OpenAI ingestion and everything after registry capture is scripted, while the registry capture itself is transferred byte-for-byte from ChatGPT's active tool metadata.

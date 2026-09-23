---
summary: "Mandatory startup context for the JSON Schema to observed OpenAI TypeScript-like conversion project."
paths:
  - fixtures/
  - src/
  - test/
---

# Project Overview

JSON Schema to OpenAI TypeScript converts standalone JSON Schema into OpenAI's TypeScript-like tool-schema syntax and can wrap MCP-style tool definitions in the corresponding tool declarations.

The project uses **OpenAI TypeScript** as a descriptive name for this model-facing representation. It is not ordinary TypeScript and is not an official OpenAI product or specification name.

## Core mental model

The standalone JSON Schema converter is the core primitive. Schemas may come from MCP `inputSchema`, function/tool definitions, Structured Output schema authoring, or other JSON Schema sources. `fixtures/conversion/mcp-tools.json`, `openai-signatures.md`, and `normalized.json` are the evidence used to verify current OpenAI connector conversion.

OpenAI Harmony's JSON Schema-to-TypeScript renderer is the implementation baseline. Start from Harmony's published conversion rules, then preserve or add ChatGPT/MCP-specific behavior where repository fixtures or new captures provide direct evidence.

## Global invariants

- Output fidelity is measured against current Code Mode connector rendering, including the `mcp__<connector>__<tool>(args: ...): Promise<...>;` wrapper, whitespace, comments, type spelling, ordering, and constraint placement.
- JSON Schema descriptions become TypeScript-style comments in the observed output. Validation metadata such as defaults, bounds, lengths, patterns, formats, and item limits can also surface as comments.
- The converter is adapted from OpenAI Harmony's published `json_schema_to_typescript` implementation. Known ChatGPT/MCP differences are maintained as observed-behavior adjustments rather than rebuilding the converter independently.

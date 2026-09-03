---
summary: "Mandatory startup context for the JSON Schema to observed OpenAI TypeScript-like projection project."
paths:
  - fixtures/
  - src/
  - test/
---

# Project Overview

JSON Schema to OpenAI TypeScript converts standalone JSON Schema into OpenAI's TypeScript-like tool-schema syntax and can wrap MCP-style tool definitions in the corresponding tool declarations.

The project uses **OpenAI TypeScript** as a descriptive name for this model-facing representation. It is not ordinary TypeScript and is not an official OpenAI product or specification name.

## Core mental model

The standalone JSON Schema renderer is the core primitive. Schemas may come from MCP `inputSchema`, function/tool definitions, Structured Output schema authoring, or other JSON Schema sources. `fixtures/before.json` and `fixtures/after.ts` remain the compatibility contract for the MCP/tool wrapper and captured ChatGPT formatting.

OpenAI Harmony's JSON Schema-to-TypeScript renderer is the implementation baseline. Start from Harmony's published conversion rules, then preserve or add ChatGPT/MCP-specific behavior where repository fixtures or new captures provide direct evidence.

## Global invariants

- Output fidelity is measured against observed OpenAI rendering, including whitespace, comments, type spelling, ordering, and constraint placement.
- JSON Schema descriptions become TypeScript-style comments in the observed output. Validation metadata such as defaults, bounds, lengths, patterns, formats, and item limits can also surface as comments.
- The schema renderer is adapted from OpenAI Harmony's published `json_schema_to_typescript` implementation. Known ChatGPT/MCP differences are maintained as compatibility adjustments rather than rebuilding the converter independently.

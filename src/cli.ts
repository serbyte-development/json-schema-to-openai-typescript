#!/usr/bin/env node

import { readFile } from "node:fs/promises"

import { type McpToolDefinition, renderOpenAITypescript } from "./index.js"

const inputPath = process.argv[2]

if (!inputPath) {
  console.error("Usage: json-schema-to-openai-typescript <tools.json>")
  process.exitCode = 1
} else {
  const tools = JSON.parse(
    await readFile(inputPath, "utf8"),
  ) as McpToolDefinition[]
  process.stdout.write(renderOpenAITypescript(tools))
}

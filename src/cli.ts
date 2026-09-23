#!/usr/bin/env node

import { readFile } from "node:fs/promises"

import {
  type McpToolDefinition,
  renderOpenAIConnectorTypescript,
} from "./index.js"

const [inputPath, prefixFlag, connectorPrefix, ...extraArguments] =
  process.argv.slice(2)

if (
  !inputPath ||
  prefixFlag !== "--prefix" ||
  !connectorPrefix ||
  extraArguments.length > 0
) {
  console.error(
    "Usage: json-schema-to-openai-typescript <tools.json> --prefix <mcp__connector__>",
  )
  process.exitCode = 1
} else {
  const tools = JSON.parse(
    await readFile(inputPath, "utf8"),
  ) as McpToolDefinition[]
  process.stdout.write(renderOpenAIConnectorTypescript(tools, connectorPrefix))
}

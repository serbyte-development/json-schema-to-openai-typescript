#!/usr/bin/env node

import { readFile } from "node:fs/promises"

import {
  type McpToolDefinition,
  renderToolsList,
  type ToolsListResult,
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
    "Usage: json-schema-to-openai-typescript <tools-list.json> --prefix <mcp__connector__>",
  )
  process.exitCode = 1
} else {
  const input = JSON.parse(await readFile(inputPath, "utf8")) as
    | McpToolDefinition[]
    | ToolsListResult
  const toolsList = Array.isArray(input) ? { tools: input } : input
  process.stdout.write(renderToolsList(toolsList, connectorPrefix))
}

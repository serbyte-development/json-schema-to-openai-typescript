#!/usr/bin/env node

import { readFile } from "node:fs/promises"

import {
  type McpToolDefinition,
  renderOpenAIConnectorTypescript,
} from "./index.js"

const inputPath = process.argv[2]
const prefixFlagIndex = process.argv.indexOf("--prefix")
const prefix = prefixFlagIndex === -1 ? "" : process.argv[prefixFlagIndex + 1]

if (!inputPath || (prefixFlagIndex !== -1 && prefix === undefined)) {
  console.error(
    "Usage: json-schema-to-openai-typescript <tools.json> [--prefix <prefix>]",
  )
  process.exitCode = 1
} else {
  const tools = JSON.parse(
    await readFile(inputPath, "utf8"),
  ) as McpToolDefinition[]
  process.stdout.write(renderOpenAIConnectorTypescript(tools, { prefix }))
}

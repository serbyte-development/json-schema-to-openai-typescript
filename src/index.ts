import {
  renderHarmonyBasedOutputSchema,
  renderHarmonyBasedSchema,
} from "./harmony-schema.js"

export type JsonSchema = Record<string, unknown>

export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
  annotations?: Record<string, unknown>
}

/** Render MCP tools using OpenAI's observed connector signature shape. */
export function renderOpenAIConnectorTypescript(
  tools: readonly McpToolDefinition[],
  connectorPrefix: string,
): string {
  if (!connectorPrefix.startsWith("mcp__") || !connectorPrefix.endsWith("__")) {
    throw new Error(
      `Expected an OpenAI MCP connector prefix like "mcp__my_connector__", received ${JSON.stringify(connectorPrefix)}`,
    )
  }
  return `${tools.map((tool) => renderConnectorTool(tool, connectorPrefix)).join("\n")}\n`
}

/** Render one JSON Schema as OpenAI TypeScript. */
export function renderJsonSchemaAsOpenAITypescript(schema: JsonSchema): string {
  return renderHarmonyBasedSchema(schema)
}

/** Render one MCP output JSON Schema as OpenAI's observed return-type representation. */
export function renderJsonSchemaAsOpenAIOutputTypescript(
  schema: JsonSchema,
): string {
  return renderHarmonyBasedOutputSchema(schema)
}

function renderConnectorTool(tool: McpToolDefinition, prefix: string): string {
  const input = renderHarmonyBasedSchema(tool.inputSchema)
  const output = tool.outputSchema
    ? renderHarmonyBasedOutputSchema(tool.outputSchema)
    : "unknown"
  return `${prefix}${tool.name}(args: ${input}): Promise<${output}>;`
}

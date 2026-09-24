import {
  renderHarmonyBasedOutputSchema,
  renderHarmonyBasedSchema,
} from "./converter.js"

export {
  type ToolsListValidationResult,
  type ToolValidationResult,
  type ValidationIssue,
  validateToolsList,
} from "./validator.js"

export type JsonSchema = Record<string, unknown>

export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
  annotations?: Record<string, unknown>
}

export interface ToolsListResult {
  tools: readonly McpToolDefinition[]
}

/** Render one MCP inputSchema as OpenAI TypeScript. */
export function renderInputSchema(schema: JsonSchema): string {
  return renderHarmonyBasedSchema(schema)
}

/** Render one MCP outputSchema as OpenAI's observed return type. */
export function renderOutputSchema(schema: JsonSchema): string {
  return renderHarmonyBasedOutputSchema(schema)
}

/** Render an MCP tools/list result using OpenAI's observed connector descriptions. */
export function renderToolsList(
  result: ToolsListResult,
  connectorPrefix: string,
): string {
  if (!connectorPrefix.startsWith("mcp__") || !connectorPrefix.endsWith("__")) {
    throw new Error(
      `Expected an OpenAI MCP connector prefix like "mcp__my_connector__", received ${JSON.stringify(connectorPrefix)}`,
    )
  }
  return `${result.tools.map((tool) => renderConnectorTool(tool, connectorPrefix)).join("\n\n")}\n`
}

/** @deprecated Use renderInputSchema. */
export const renderJsonSchemaAsOpenAITypescript = renderInputSchema

/** @deprecated Use renderOutputSchema. */
export const renderJsonSchemaAsOpenAIOutputTypescript = renderOutputSchema

/** @deprecated Use renderToolsList with the complete tools/list result. */
export function renderOpenAIConnectorTypescript(
  tools: readonly McpToolDefinition[],
  connectorPrefix: string,
): string {
  return renderToolsList({ tools }, connectorPrefix)
}

function renderConnectorTool(tool: McpToolDefinition, prefix: string): string {
  const input = renderHarmonyBasedSchema(tool.inputSchema)
  const output = tool.outputSchema
    ? renderHarmonyBasedOutputSchema(tool.outputSchema)
    : "unknown"
  const signature = `${prefix}${tool.name}(args: ${input}): Promise<${output}>;`
  const renderedSignature = `\`\`\`ts\n${signature}\n\`\`\``
  return tool.description
    ? `${tool.description}\n\n${renderedSignature}`
    : renderedSignature
}

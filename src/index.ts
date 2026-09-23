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

export interface OpenAIConnectorRenderOptions {
  prefix?: string
}

/** Render MCP tools using OpenAI's observed connector signature shape. */
export function renderOpenAIConnectorTypescript(
  tools: readonly McpToolDefinition[],
  options: OpenAIConnectorRenderOptions = {},
): string {
  const prefix = options.prefix ?? ""
  return `${tools.map((tool) => renderConnectorTool(tool, prefix)).join("\n")}\n`
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

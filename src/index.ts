import { renderHarmonyBasedSchema } from "./harmony-schema.js"

export type JsonSchema = Record<string, unknown>

export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema: JsonSchema
  annotations?: Record<string, unknown>
}

/** Render MCP tool definitions into OpenAI's TypeScript-like tool schema representation. */
export function renderOpenAITypescript(
  tools: readonly McpToolDefinition[],
): string {
  return `${tools.map(renderTool).join("\n")}\n`
}

/** Render one JSON Schema as OpenAI TypeScript. */
export function renderJsonSchemaAsOpenAITypescript(schema: JsonSchema): string {
  return renderHarmonyBasedSchema(schema)
}

function renderTool(tool: McpToolDefinition): string {
  const lines: string[] = []
  pushDescription(lines, tool.description)

  if (isEmptyObjectSchema(tool.inputSchema)) {
    lines.push(`type ${tool.name} = () => any;`)
    return lines.join("\n")
  }

  lines.push(
    `type ${tool.name} = (_: ${renderHarmonyBasedSchema(tool.inputSchema)}) => any;`,
  )
  return lines.join("\n")
}

function pushDescription(
  lines: string[],
  description: string | undefined,
): void {
  if (!description) return
  for (const line of description.split("\n")) lines.push(`// ${line}`)
}

function isEmptyObjectSchema(schema: JsonSchema): boolean {
  return (
    schema.type === "object" &&
    Object.keys(asRecord(schema.properties)).length === 0
  )
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

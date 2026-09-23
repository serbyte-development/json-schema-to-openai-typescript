import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js"

import type { JsonSchema, ToolsListResult } from "./index.js"

export interface ValidationIssue {
  severity: "error" | "warning"
  code:
    | "invalid_schema"
    | "invalid_input_root"
    | "invalid_regex"
    | "unresolved_ref"
    | "compile_error"
  path: string
  message: string
}

export interface ToolValidationResult {
  name: string
  valid: boolean
  issues: ValidationIssue[]
}

export interface ToolsListValidationResult {
  valid: boolean
  tools: ToolValidationResult[]
}

export interface SchemaInspection {
  metaSchemaValid: boolean
  metaSchemaErrors: ErrorObject[]
  compileStatus:
    | "ok"
    | "invalid-schema"
    | "invalid-regex"
    | "unresolved-ref"
    | "compile-error"
  compileError?: string
}

export function validateToolsList(
  result: ToolsListResult,
): ToolsListValidationResult {
  const tools = result.tools.map((tool, index) => {
    const issues: ValidationIssue[] = []
    const inputPath = `tools[${index}].inputSchema`

    if (tool.inputSchema.type !== "object") {
      issues.push({
        severity: "error",
        code: "invalid_input_root",
        path: `${inputPath}.type`,
        message: 'MCP inputSchema must have type "object" at the root.',
      })
    }

    issues.push(...validateSchema(tool.inputSchema, inputPath, "input"))

    if (tool.outputSchema) {
      issues.push(
        ...validateSchema(
          tool.outputSchema,
          `tools[${index}].outputSchema`,
          "output",
        ),
      )
    }

    return {
      name: tool.name,
      valid: !issues.some((issue) => issue.severity === "error"),
      issues,
    }
  })

  return {
    valid: tools.every((tool) => tool.valid),
    tools,
  }
}

function validateSchema(
  schema: JsonSchema,
  path: string,
  target: "input" | "output",
): ValidationIssue[] {
  const inspection = inspectSchema(schema)

  if (!inspection.metaSchemaValid) {
    return inspection.metaSchemaErrors.map((error) => ({
      severity: "error",
      code: "invalid_schema",
      path: `${path}${error.instancePath}`,
      message: `${error.keyword}: ${error.message ?? "invalid"}`,
    }))
  }

  if (inspection.compileStatus === "ok") return []

  const severity =
    target === "input" && inspection.compileStatus === "invalid-regex"
      ? "error"
      : "warning"

  return [
    {
      severity,
      code: inspection.compileStatus.replaceAll(
        "-",
        "_",
      ) as ValidationIssue["code"],
      path,
      message: inspection.compileError ?? inspection.compileStatus,
    },
  ]
}

export function inspectSchema(schema: JsonSchema): SchemaInspection {
  const ajv = new Ajv2020({ strict: false, validateFormats: false })
  const valid = ajv.validateSchema(schema)
  const metaSchemaErrors = [...(ajv.errors ?? [])]

  if (!valid) {
    return {
      metaSchemaValid: false,
      metaSchemaErrors,
      compileStatus: "invalid-schema",
    }
  }

  try {
    ajv.compile(schema)
    return { metaSchemaValid: true, metaSchemaErrors, compileStatus: "ok" }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const lower = message.toLowerCase()
    const compileStatus = lower.includes("can't resolve reference")
      ? "unresolved-ref"
      : lower.includes("invalid regular expression") ||
          lower.includes("invalid pattern")
        ? "invalid-regex"
        : "compile-error"

    return {
      metaSchemaValid: true,
      metaSchemaErrors,
      compileStatus,
      compileError: message,
    }
  }
}

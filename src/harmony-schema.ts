/*
 * JSON Schema rendering logic adapted from OpenAI Harmony:
 * https://github.com/openai/harmony/blob/abd677f7ac962629c808197caa1feb9e3e95d2b0/src/encoding.rs
 *
 * Upstream code is licensed under the Apache License 2.0. This TypeScript
 * adaptation has been modified for this project's ChatGPT/MCP formatting.
 */

import type { JsonSchema } from "./index.js"

const INLINE_CONSTRAINTS = [
  "default",
  "minimum",
  "maximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "format",
] as const

const ARRAY_CONSTRAINTS = ["minItems", "maxItems"] as const

export function renderHarmonyBasedSchema(schema: JsonSchema): string {
  return renderSchema(schema, "")
}

function renderSchema(schema: JsonSchema, indent: string): string {
  const oneOf = Array.isArray(schema.oneOf) ? schema.oneOf : undefined
  if (oneOf) return renderOneOf(oneOf, indent)

  const types = Array.isArray(schema.type) ? schema.type : undefined
  if (types) {
    const rendered = types
      .filter((value): value is string => typeof value === "string")
      .map((value) => renderTypeName(value))
    return rendered.length > 0 ? rendered.join(" | ") : "any"
  }

  switch (schema.type) {
    case "object":
      return renderObject(schema, indent)
    case "string":
      return renderString(schema)
    case "integer":
      // ChatGPT's captured MCP projection preserves `integer`; Harmony maps it to `number`.
      return "integer"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "array":
      return renderArray(schema, indent)
    default:
      return "any"
  }
}

function renderObject(schema: JsonSchema, indent: string): string {
  const properties = asRecord(schema.properties)
  const required = new Set(asStringArray(schema.required))
  const lines: string[] = []

  pushDescription(lines, asString(schema.description), indent)
  lines.push("{")

  for (const [name, rawPropertySchema] of Object.entries(properties)) {
    const propertySchema = asSchema(rawPropertySchema)
    pushTitle(lines, propertySchema, indent)

    if (!Array.isArray(propertySchema.oneOf)) {
      pushDescription(lines, asString(propertySchema.description), indent)
    }
    pushExamples(lines, propertySchema, indent)

    const optional = required.has(name) ? "" : "?"

    if (Array.isArray(propertySchema.oneOf)) {
      renderOneOfProperty(lines, name, optional, propertySchema, indent)
      continue
    }

    if (propertySchema.type === "array") {
      pushConstraintComment(lines, propertySchema, ARRAY_CONSTRAINTS, indent)
      lines.push(`${indent}${name}${optional}: Array<`)
      lines.push(...renderArrayItem(asSchema(propertySchema.items), indent))
      lines.push(`${indent}>,`)
      continue
    }

    const typeText = withNullable(renderSchema(propertySchema, `${indent}    `), propertySchema)
    const constraints = renderInlineConstraintText(propertySchema)
    lines.push(
      constraints.length > 0
        ? `${indent}${name}${optional}: ${typeText}, // ${constraints}`
        : `${indent}${name}${optional}: ${typeText},`,
    )
  }

  lines.push(`${indent}}`)
  return lines.join("\n")
}

function renderOneOfProperty(
  lines: string[],
  name: string,
  optional: string,
  schema: JsonSchema,
  indent: string,
): void {
  const variants = schema.oneOf as unknown[]
  const propertyDescription = asString(schema.description)

  if (propertyDescription) pushDescription(lines, propertyDescription, indent)

  if ("default" in schema) {
    lines.push(`${indent}// default: ${renderDefault(schema.default, schema)}`)
  }

  lines.push(`${indent}${name}${optional}:`)

  for (const rawVariant of variants) {
    const variant = asSchema(rawVariant)
    let line = `${indent} | ${withNullable(renderSchema(variant, `${indent}   `), variant)}`
    const trailing: string[] = []
    const variantDescription = asString(variant.description)
    if (variantDescription && variantDescription !== propertyDescription) trailing.push(variantDescription)
    if ("default" in variant) trailing.push(`default: ${renderDefault(variant.default, variant)}`)
    if (trailing.length > 0) line += ` // ${trailing.join(" ")}`
    lines.push(line)
  }

  lines.push(`${indent},`)
}

function renderOneOf(variants: unknown[], indent: string): string {
  if (variants.length === 0) return "any"

  return variants
    .map((rawVariant) => {
      const variant = asSchema(rawVariant)
      let rendered = withNullable(renderSchema(variant, `${indent}   `), variant)
      const trailing: string[] = []
      const description = asString(variant.description)
      if (description) trailing.push(description)
      if ("default" in variant) trailing.push(`default: ${renderDefault(variant.default, variant)}`)
      if (trailing.length > 0) rendered += ` // ${trailing.join(" ")}`
      return rendered
    })
    .map((rendered) => `${indent} | ${rendered}`)
    .join("\n")
}

function renderArray(schema: JsonSchema, indent: string): string {
  const items = asSchema(schema.items)
  if (Object.keys(items).length === 0) return "Array<any>"

  // ChatGPT's captured MCP projection uses Array<T>; Harmony uses T[].
  const itemLines = renderArrayItem(items, indent)
  return itemLines.length === 1
    ? `Array<${itemLines[0]}>`
    : [`Array<`, ...itemLines, `${indent}>`].join("\n")
}

function renderArrayItem(schema: JsonSchema, indent: string): string[] {
  if (Object.keys(schema).length === 0) return ["any"]

  if (schema.type === "object") return renderObject(schema, indent).split("\n")

  if (schema.type === "array") {
    const lines: string[] = []
    pushConstraintComment(lines, schema, ARRAY_CONSTRAINTS, indent)
    lines.push(`${indent}Array<`)
    lines.push(...renderArrayItem(asSchema(schema.items), indent))
    lines.push(`${indent}>`)
    return lines
  }

  const typeText = withNullable(renderSchema(schema, indent), schema)
  const constraints = renderInlineConstraintText(schema)
  return [constraints.length > 0 ? `${typeText} // ${constraints}` : typeText]
}

function renderString(schema: JsonSchema): string {
  const enumValues = Array.isArray(schema.enum) ? schema.enum : undefined
  if (enumValues && enumValues.length > 0) {
    const rendered = enumValues
      .filter((value): value is string => typeof value === "string")
      .map((value) => JSON.stringify(value))
    if (rendered.length > 0) return rendered.join(" | ")
  }
  return "string"
}

function renderTypeName(type: string): string {
  // Preserve ChatGPT's observed spelling rather than Harmony's integer -> number mapping.
  return type === "integer" ? "integer" : type
}

function withNullable(rendered: string, schema: JsonSchema): string {
  return schema.nullable === true && !rendered.includes("null") ? `${rendered} | null` : rendered
}

function pushTitle(lines: string[], schema: JsonSchema, indent: string): void {
  const title = asString(schema.title)
  if (!title) return
  lines.push(`${indent}// ${title}`)
  lines.push(`${indent}//`)
}

function pushExamples(lines: string[], schema: JsonSchema, indent: string): void {
  const examples = Array.isArray(schema.examples) ? schema.examples : undefined
  const strings = examples?.filter((value): value is string => typeof value === "string") ?? []
  if (strings.length === 0) return
  lines.push(`${indent}// Examples:`)
  for (const example of strings) lines.push(`${indent}// - ${JSON.stringify(example)}`)
}

function pushDescription(lines: string[], description: string | undefined, indent = ""): void {
  if (!description) return
  for (const line of description.split("\n")) lines.push(`${indent}// ${line}`)
}

function renderInlineConstraintText(schema: JsonSchema): string {
  return renderConstraints(schema, INLINE_CONSTRAINTS).join(", ")
}

function pushConstraintComment(
  lines: string[],
  schema: JsonSchema,
  keys: readonly string[],
  indent = "",
): void {
  const rendered = renderConstraints(schema, keys)
  if (rendered.length > 0) lines.push(`${indent}// ${rendered.join(", ")}`)
}

function renderConstraints(schema: JsonSchema, keys: readonly string[]): string[] {
  const rendered: string[] = []
  for (const key of keys) {
    if (!(key in schema)) continue
    rendered.push(`${key}: ${renderConstraintValue(key, schema[key], schema)}`)
  }
  return rendered
}

function renderConstraintValue(key: string, value: unknown, schema: JsonSchema): string {
  if (key === "pattern" && typeof value === "string") return `/${value}/`
  if (key === "format" && typeof value === "string") return JSON.stringify(value)

  if (
    schema.type === "number" &&
    (key === "minimum" || key === "maximum" || key === "default") &&
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value.toFixed(1)
  }

  return renderLiteral(value)
}

function renderDefault(value: unknown, schema: JsonSchema): string {
  const isEnum = Array.isArray(schema.enum) && schema.enum.length > 0
  if (typeof value === "string" && isEnum) return value
  return renderLiteral(value)
}

function renderLiteral(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value === null) return "null"
  return JSON.stringify(value)
}

function asSchema(value: unknown): JsonSchema {
  return asRecord(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

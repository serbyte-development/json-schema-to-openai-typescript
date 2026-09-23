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
  return renderSchema(schema)
}

function renderSchema(schema: JsonSchema): string {
  const oneOf = Array.isArray(schema.oneOf) ? schema.oneOf : undefined
  if (oneOf) return renderOneOf(oneOf)

  const types = Array.isArray(schema.type) ? schema.type : undefined
  if (types) {
    const rendered = types
      .filter((value): value is string => typeof value === "string")
      .map((value) => renderTypeName(value))
    return rendered.length > 0 ? rendered.join(" | ") : "any"
  }

  switch (schema.type) {
    case "object":
      return renderObject(schema)
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
      return renderArray(schema)
    default:
      return "any"
  }
}

function renderObject(schema: JsonSchema): string {
  const properties = asRecord(schema.properties)
  const required = new Set(asStringArray(schema.required))
  const compact = renderCompactObject(properties, required)
  if (compact) return compact

  const lines: string[] = []

  lines.push("{")

  for (const [name, rawPropertySchema] of Object.entries(properties)) {
    const propertySchema = asSchema(rawPropertySchema)
    pushTitle(lines, propertySchema)

    if (!Array.isArray(propertySchema.oneOf)) {
      pushDescription(lines, asString(propertySchema.description))
    }
    pushExamples(lines, propertySchema)

    const optional = required.has(name) ? "" : "?"

    if (Array.isArray(propertySchema.oneOf)) {
      renderOneOfProperty(lines, name, optional, propertySchema)
      continue
    }

    if (propertySchema.type === "array") {
      const arrayType = renderArray(propertySchema)
      const constraints = renderConstraints(propertySchema, ARRAY_CONSTRAINTS)
      if (arrayType.includes("\n")) {
        if (constraints.length > 0) lines.push(`// ${constraints.join(", ")}`)
        lines.push(`${name}${optional}: ${arrayType},`)
      } else {
        lines.push(
          constraints.length > 0
            ? `${name}${optional}: ${arrayType}, // ${constraints.join(", ")}`
            : `${name}${optional}: ${arrayType},`,
        )
      }
      continue
    }

    const typeText = withNullable(renderSchema(propertySchema), propertySchema)
    const constraints = renderInlineConstraintText(propertySchema)
    lines.push(
      constraints.length > 0
        ? `${name}${optional}: ${typeText}, // ${constraints}`
        : `${name}${optional}: ${typeText},`,
    )
  }

  lines.push("}")
  return lines.join("\n")
}

function renderCompactObject(
  properties: Record<string, unknown>,
  required: ReadonlySet<string>,
): string | undefined {
  const fields: string[] = []

  for (const [name, rawPropertySchema] of Object.entries(properties)) {
    const propertySchema = asSchema(rawPropertySchema)
    if (hasLeadingMetadata(propertySchema)) return undefined
    if (renderConstraints(propertySchema, INLINE_CONSTRAINTS).length > 0)
      return undefined
    if (renderConstraints(propertySchema, ARRAY_CONSTRAINTS).length > 0)
      return undefined

    const rendered = withNullable(renderSchema(propertySchema), propertySchema)
    if (rendered.includes("\n")) return undefined

    const optional = required.has(name) ? "" : "?"
    fields.push(`${name}${optional}: ${rendered}`)
  }

  return fields.length === 0 ? "{}" : `{ ${fields.join(", ")} }`
}

function hasLeadingMetadata(schema: JsonSchema): boolean {
  return (
    typeof schema.title === "string" ||
    typeof schema.description === "string" ||
    (Array.isArray(schema.examples) && schema.examples.length > 0) ||
    Array.isArray(schema.oneOf)
  )
}

function renderOneOfProperty(
  lines: string[],
  name: string,
  optional: string,
  schema: JsonSchema,
): void {
  const variants = schema.oneOf as unknown[]
  const propertyDescription = asString(schema.description)

  if (propertyDescription) pushDescription(lines, propertyDescription)

  if ("default" in schema) {
    lines.push(`// default: ${renderDefault(schema.default, schema)}`)
  }

  lines.push(`${name}${optional}:`)

  for (const rawVariant of variants) {
    const variant = asSchema(rawVariant)
    let line = ` | ${withNullable(renderSchema(variant), variant)}`
    const trailing: string[] = []
    const variantDescription = asString(variant.description)
    if (variantDescription && variantDescription !== propertyDescription)
      trailing.push(variantDescription)
    if ("default" in variant)
      trailing.push(`default: ${renderDefault(variant.default, variant)}`)
    if (trailing.length > 0) line += ` // ${trailing.join(" ")}`
    lines.push(line)
  }

  lines.push(",")
}

function renderOneOf(variants: unknown[]): string {
  if (variants.length === 0) return "any"

  return variants
    .map((rawVariant) => {
      const variant = asSchema(rawVariant)
      let rendered = withNullable(renderSchema(variant), variant)
      const trailing: string[] = []
      const description = asString(variant.description)
      if (description) trailing.push(description)
      if ("default" in variant)
        trailing.push(`default: ${renderDefault(variant.default, variant)}`)
      if (trailing.length > 0) rendered += ` // ${trailing.join(" ")}`
      return rendered
    })
    .map((rendered) => ` | ${rendered}`)
    .join("\n")
}

function renderArray(schema: JsonSchema): string {
  const items = asSchema(schema.items)
  if (Object.keys(items).length === 0) return "any[]"

  const item = renderArrayItem(items)
  return item.includes("\n") ? `Array<\n${item}\n>` : `${item}[]`
}

function renderArrayItem(schema: JsonSchema): string {
  if (Object.keys(schema).length === 0) return "any"

  if (schema.type === "array") {
    const rendered = renderArray(schema)
    const constraints = renderConstraints(schema, ARRAY_CONSTRAINTS)
    return constraints.length > 0
      ? `// ${constraints.join(", ")}\n${rendered}`
      : rendered
  }

  const typeText = withNullable(renderSchema(schema), schema)
  const constraints = renderInlineConstraintText(schema)
  return constraints.length > 0 ? `${typeText} // ${constraints}` : typeText
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
  return schema.nullable === true && !rendered.includes("null")
    ? `${rendered} | null`
    : rendered
}

function pushTitle(lines: string[], schema: JsonSchema): void {
  const title = asString(schema.title)
  if (!title) return
  lines.push(`// ${title}`)
  lines.push("//")
}

function pushExamples(lines: string[], schema: JsonSchema): void {
  const examples = Array.isArray(schema.examples) ? schema.examples : undefined
  const strings =
    examples?.filter((value): value is string => typeof value === "string") ??
    []
  if (strings.length === 0) return
  lines.push("// Examples:")
  for (const example of strings) lines.push(`// - ${JSON.stringify(example)}`)
}

function pushDescription(
  lines: string[],
  description: string | undefined,
): void {
  if (!description) return
  for (const line of description.split("\n")) lines.push(`// ${line}`)
}

function renderInlineConstraintText(schema: JsonSchema): string {
  return renderConstraints(schema, INLINE_CONSTRAINTS).join(", ")
}

function renderConstraints(
  schema: JsonSchema,
  keys: readonly string[],
): string[] {
  const rendered: string[] = []
  for (const key of keys) {
    if (!(key in schema)) continue
    rendered.push(`${key}: ${renderConstraintValue(key, schema[key], schema)}`)
  }
  return rendered
}

function renderConstraintValue(
  key: string,
  value: unknown,
  schema: JsonSchema,
): string {
  if (key === "pattern" && typeof value === "string") return `/${value}/`
  if (key === "format" && typeof value === "string")
    return JSON.stringify(value)

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
  if (typeof value === "number" || typeof value === "boolean")
    return String(value)
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
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

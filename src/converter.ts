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
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "format",
] as const

const ARRAY_CONSTRAINTS = ["default", "minItems", "maxItems"] as const

interface RenderContext {
  root: JsonSchema
  refDepth: number
  mode: "input" | "output"
}

type SchemaValue = JsonSchema | boolean

export function renderHarmonyBasedSchema(schema: JsonSchema): string {
  return renderSchema(
    schema,
    { root: schema, refDepth: 0, mode: "input" },
    true,
  )
}

export function renderHarmonyBasedOutputSchema(schema: JsonSchema): string {
  if (Object.keys(schema).length === 0) return "unknown"
  if (hasRecursiveLocalRef(schema)) return "unknown"
  if (hasUnresolvedRef(schema)) return "{ [key: string]: any }"

  if (schema.type === "object") {
    if (hasBooleanPropertySchema(schema)) return "{ [key: string]: any }"
    return renderSchema(
      schema,
      { root: schema, refDepth: 0, mode: "output" },
      true,
    )
  }

  if (schema.type !== undefined) return "{ [key: string]: any }"
  if (Array.isArray(schema.enum)) return "object"
  if (
    Array.isArray(schema.oneOf) ||
    Array.isArray(schema.anyOf) ||
    Array.isArray(schema.allOf)
  )
    return "object"
  if (schema.not !== undefined) return "{ [key: string]: any }"

  return "object"
}

function hasUnresolvedRef(root: JsonSchema): boolean {
  const visit = (value: unknown): boolean => {
    if (typeof value === "boolean" || !isSchemaObject(value)) return false

    if (typeof value.$ref === "string") {
      if (resolveLocalRef(root, value.$ref, "output") === undefined) return true
    }

    for (const [key, entry] of Object.entries(value)) {
      if (key === "$defs" || key === "definitions" || key === "$ref") continue
      if (Array.isArray(entry)) {
        if (entry.some(visit)) return true
      } else if (visit(entry)) return true
    }
    return false
  }

  return visit(root)
}

function renderSchema(
  schema: SchemaValue,
  context: RenderContext,
  includeMetadata = false,
): string {
  if (schema === true) return "any"
  if (schema === false) return "never"

  const resolved = resolveSchema(schema, context)
  if (resolved.schema !== schema) {
    return renderSchema(resolved.schema, resolved.context, includeMetadata)
  }

  if (typeof schema.$ref === "string") return "any"

  if ("const" in schema) return renderLiteral(schema.const)

  const enumValues = Array.isArray(schema.enum) ? schema.enum : undefined
  if (enumValues && enumValues.length > 0) {
    return enumValues.map((value) => renderLiteral(value)).join(" | ")
  }

  const oneOf = Array.isArray(schema.oneOf) ? schema.oneOf : undefined
  if (oneOf) return renderComposition(oneOf, "|", context)

  const anyOf = Array.isArray(schema.anyOf) ? schema.anyOf : undefined
  if (anyOf) return renderComposition(anyOf, "|", context)

  const allOf = Array.isArray(schema.allOf) ? schema.allOf : undefined
  if (allOf) {
    if (allOf.length === 1) return renderSchemaValue(allOf[0], context)
    return renderComposition(allOf, "&", context)
  }

  if (schema.not !== undefined) return renderNot(schema.not)

  const types = Array.isArray(schema.type) ? schema.type : undefined
  if (types) {
    const rendered = types
      .filter((value): value is string => typeof value === "string")
      .map((value) => renderTypeName(value))
    return rendered.length > 0 ? rendered.join(" | ") : "any"
  }

  switch (schema.type) {
    case "object":
      return renderObject(schema, context, includeMetadata)
    case "string":
      return renderString()
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
      return renderArray(schema, context)
    default:
      return "any"
  }
}

function renderObject(
  schema: JsonSchema,
  context: RenderContext,
  includeMetadata = false,
): string {
  const properties = asRecord(schema.properties)
  const required = new Set(asStringArray(schema.required))
  const additionalProperties = schema.additionalProperties
  const propertyEntries = Object.entries(properties)
  const metadataLines = includeMetadata ? renderSchemaMetadata(schema) : []
  const topLevelConstraintLines =
    includeMetadata && context.mode === "output"
      ? renderAdditionalConstraintComments(schema, OUTPUT_TOP_LEVEL_CONSTRAINTS)
      : []

  if (propertyEntries.length === 0) {
    let rendered = "object"
    if (additionalProperties === true) rendered = "{ [key: string]: any }"
    if (isSchemaObject(additionalProperties)) {
      rendered = `{ [key: string]: ${renderSchema(additionalProperties, context)} }`
    }
    return [...metadataLines, ...topLevelConstraintLines, rendered].join("\n")
  }

  const compact = renderCompactObject(
    properties,
    required,
    additionalProperties,
    context,
  )
  if (compact && metadataLines.length === 0) {
    return [...topLevelConstraintLines, compact].join("\n")
  }

  const lines: string[] = [...metadataLines, ...topLevelConstraintLines]

  lines.push("{")

  for (const [name, rawPropertySchema] of Object.entries(properties)) {
    const propertySchema = asSchemaValue(rawPropertySchema)
    const propertyRecord = schemaRecord(propertySchema)
    if (propertyRecord) pushTitle(lines, propertyRecord)

    if (propertyRecord && !hasComposition(propertyRecord)) {
      pushDescription(lines, asString(propertyRecord.description))
    }
    if (propertyRecord && context.mode === "output") {
      lines.push(
        ...renderAdditionalConstraintComments(
          propertyRecord,
          OUTPUT_PROPERTY_CONSTRAINTS,
        ),
      )
    }
    if (propertyRecord) pushExamples(lines, propertyRecord)

    const optional = required.has(name) ? "" : "?"

    if (propertyRecord && hasComposition(propertyRecord)) {
      renderCompositionProperty(lines, name, optional, propertyRecord, context)
      continue
    }

    if (propertyRecord?.type === "array") {
      const arrayType = renderArray(propertyRecord, context)
      const constraints = renderConstraints(propertyRecord, ARRAY_CONSTRAINTS)
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

    const effective = resolveSchemaValue(propertySchema, context)
    const typeText = withNullable(
      renderSchema(effective.schema, effective.context),
      propertyRecord,
    )
    const constraints = renderInlineConstraintText(
      effective.schema,
      effective.context,
    )
    lines.push(
      constraints.length > 0
        ? `${name}${optional}: ${typeText}, // ${constraints}`
        : `${name}${optional}: ${typeText},`,
    )
  }

  if (additionalProperties === true) lines.push("[key: string]: any,")
  else if (isSchemaObject(additionalProperties)) {
    lines.push(`[key: string]: ${renderSchema(additionalProperties, context)},`)
  }

  lines.push("}")
  return lines.join("\n")
}

function renderCompactObject(
  properties: Record<string, unknown>,
  required: ReadonlySet<string>,
  additionalProperties: unknown,
  context: RenderContext,
): string | undefined {
  const fields: string[] = []

  for (const [name, rawPropertySchema] of Object.entries(properties)) {
    const propertySchema = asSchemaValue(rawPropertySchema)
    const propertyRecord = schemaRecord(propertySchema)
    if (propertyRecord?.description || propertyRecord?.title) return undefined
    if (propertyRecord && hasNonCompactMetadata(propertyRecord))
      return undefined
    if (
      propertyRecord &&
      context.mode === "output" &&
      renderAdditionalConstraintComments(
        propertyRecord,
        OUTPUT_PROPERTY_CONSTRAINTS,
      ).length > 0
    )
      return undefined
    if (
      propertyRecord &&
      renderPropertyConstraints(propertyRecord, context).length > 0
    )
      return undefined
    if (
      propertyRecord?.type === "array" &&
      renderConstraints(propertyRecord, ARRAY_CONSTRAINTS).length > 0
    )
      return undefined

    const effective = resolveSchemaValue(propertySchema, context)
    const rendered = withNullable(
      renderSchema(effective.schema, effective.context),
      propertyRecord,
    )
    if (rendered.includes("\n")) return undefined

    const optional = required.has(name) ? "" : "?"
    fields.push(`${name}${optional}: ${rendered}`)
  }

  if (additionalProperties === true) fields.push("[key: string]: any")
  else if (isSchemaObject(additionalProperties)) {
    const rendered = renderSchema(additionalProperties, context)
    if (rendered.includes("\n")) return undefined
    fields.push(`[key: string]: ${rendered}`)
  }

  return `{ ${fields.join(", ")} }`
}

function hasNonCompactMetadata(schema: JsonSchema): boolean {
  return (
    (Array.isArray(schema.examples) && schema.examples.length > 0) ||
    (hasComposition(schema) && !canRenderCompositionCompact(schema))
  )
}

function renderCompositionProperty(
  lines: string[],
  name: string,
  optional: string,
  schema: JsonSchema,
  context: RenderContext,
): void {
  const propertyDescription = asString(schema.description)

  if (propertyDescription) pushDescription(lines, propertyDescription)

  if ("default" in schema) {
    lines.push(`// default: ${renderDefault(schema.default, schema)}`)
  }

  const rendered = renderSchema(schema, context)
  if (!rendered.includes("\n")) {
    lines.push(`${name}${optional}: ${rendered},`)
    return
  }

  lines.push(`${name}${optional}:`)
  lines.push(...rendered.split("\n"))
  lines.push(",")
}

function renderComposition(
  variants: unknown[],
  operator: "|" | "&",
  context: RenderContext,
): string {
  if (variants.length === 0) return "any"

  const rendered = variants.map((rawVariant) =>
    renderCompositionVariant(rawVariant, context),
  )

  if (
    rendered.every(
      (variant) =>
        variant.description === undefined &&
        !variant.text.includes("\n") &&
        !variant.text.includes(" // "),
    )
  ) {
    return rendered.map((variant) => variant.text).join(` ${operator} `)
  }

  const lines: string[] = []
  for (const variant of rendered) {
    if (variant.description) pushDescription(lines, variant.description)
    lines.push(` ${operator} ${variant.text}`)
  }
  return lines.join("\n")
}

function renderCompositionVariant(
  rawVariant: unknown,
  context: RenderContext,
): { text: string; description?: string } {
  const variant = asSchemaValue(rawVariant)
  const record = schemaRecord(variant)
  const effective = resolveSchemaValue(variant, context)
  let text = withNullable(
    renderSchema(effective.schema, effective.context),
    record,
  )
  const constraints = record
    ? renderPropertyConstraints(record, effective.context)
    : []
  if (constraints.length > 0) text += ` // ${constraints.join(", ")}`
  const description = record ? asString(record.description) : undefined
  if (description && record?.nullable === true) {
    text += ` // ${description}`
    return { text }
  }
  return { text, description }
}

function renderArray(schema: JsonSchema, context: RenderContext): string {
  const prefixItems = Array.isArray(schema.prefixItems)
    ? schema.prefixItems
    : undefined
  if (prefixItems) return renderTuple(prefixItems, schema.items, context)

  const items = asSchemaValue(schema.items)
  if (schema.items === undefined) return "any[]"

  const item = renderArrayItem(items, context)
  return item.includes("\n") || item.includes(" // ")
    ? `Array<\n${item}\n>`
    : `${item}[]`
}

function renderTuple(
  prefixItems: unknown[],
  items: unknown,
  context: RenderContext,
): string {
  const entries = prefixItems.map(
    (item, index) => `item${index}?: ${renderSchemaValue(item, context)}`,
  )
  if (items !== false) {
    const rest = items === undefined ? "any" : renderSchemaValue(items, context)
    entries.push(`...items: ${rest}[]`)
  }
  return `[${entries.join(", ")}]`
}

function renderArrayItem(schema: SchemaValue, context: RenderContext): string {
  if (schema === true) return "any"
  if (schema === false) return "never"

  if (schema.type === "array") {
    const rendered = renderArray(schema, context)
    const constraints = renderConstraints(schema, ARRAY_CONSTRAINTS)
    return constraints.length > 0
      ? `// ${constraints.join(", ")}\n${rendered}`
      : rendered
  }

  const effective = resolveSchema(schema, context)
  const typeText = withNullable(
    renderSchema(effective.schema, effective.context),
    schema,
  )
  const constraints = renderInlineConstraintText(
    effective.schema,
    effective.context,
  )
  return constraints.length > 0 ? `${typeText} // ${constraints}` : typeText
}

function renderString(): string {
  return "string"
}

function renderTypeName(type: string): string {
  // Preserve ChatGPT's observed spelling rather than Harmony's integer -> number mapping.
  if (type === "integer") return "integer"
  if (type === "array") return "any[]"
  return type
}

function withNullable(
  rendered: string,
  schema: JsonSchema | undefined,
): string {
  return schema?.nullable === true && !rendered.includes("null")
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

function renderSchemaMetadata(schema: JsonSchema): string[] {
  const lines: string[] = []
  pushTitle(lines, schema)
  pushDescription(lines, asString(schema.description))

  const examples = Array.isArray(schema.examples) ? schema.examples : []
  if (examples.length === 1 && examples[0] !== undefined) {
    lines.push(`// Example: ${renderLiteral(examples[0])}`)
  } else if (examples.length > 1) {
    lines.push("// Examples:")
    for (const example of examples) lines.push(`// - ${renderLiteral(example)}`)
  }
  return lines
}

function pushDescription(
  lines: string[],
  description: string | undefined,
): void {
  if (!description) return
  for (const line of description.split("\n")) lines.push(`// ${line}`)
}

function renderInlineConstraintText(
  schema: SchemaValue,
  context: RenderContext,
): string {
  if (typeof schema === "boolean") return ""
  if (typeof schema.$ref === "string" && context.refDepth > 0) {
    return `$ref: ${JSON.stringify(schema.$ref)}`
  }
  return renderConstraints(schema, INLINE_CONSTRAINTS).join(", ")
}

function renderPropertyConstraints(
  schema: JsonSchema,
  context: RenderContext,
): string[] {
  const effective = resolveSchema(schema, context)
  if (typeof effective.schema === "boolean") return []
  if (effective.schema !== schema) {
    return renderConstraints(effective.schema, INLINE_CONSTRAINTS)
  }
  if (typeof schema.$ref === "string" && context.refDepth > 0) {
    return [`$ref: ${JSON.stringify(schema.$ref)}`]
  }
  return renderConstraints(schema, INLINE_CONSTRAINTS)
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
    (key === "minimum" ||
      key === "maximum" ||
      key === "exclusiveMinimum" ||
      key === "exclusiveMaximum") &&
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
  if (Array.isArray(value)) return `[${value.map(renderLiteral).join(", ")}]`
  if (isSchemaObject(value)) {
    return `{${Object.entries(value)
      .map(([key, entry]) => `${JSON.stringify(key)}: ${renderLiteral(entry)}`)
      .join(", ")}}`
  }
  return JSON.stringify(value)
}

function renderNot(value: unknown): string {
  const schema = asRecord(value)
  const enumValues = Array.isArray(schema.enum) ? schema.enum : []
  if (enumValues.length > 0) {
    return `Exclude<any, ${enumValues.map(renderLiteral).join(" | ")}>`
  }
  return "any"
}

function resolveSchema(
  schema: JsonSchema,
  context: RenderContext,
): { schema: SchemaValue; context: RenderContext } {
  if (
    typeof schema.$ref !== "string" ||
    (context.mode === "input" && context.refDepth > 0)
  ) {
    return { schema, context }
  }

  const resolved = resolveLocalRef(context.root, schema.$ref, context.mode)
  return resolved
    ? {
        schema: resolved,
        context: { ...context, refDepth: context.refDepth + 1 },
      }
    : { schema, context }
}

function resolveSchemaValue(
  schema: SchemaValue,
  context: RenderContext,
): { schema: SchemaValue; context: RenderContext } {
  return typeof schema === "boolean"
    ? { schema, context }
    : resolveSchema(schema, context)
}

function resolveLocalRef(
  root: JsonSchema,
  ref: string,
  mode: "input" | "output",
): SchemaValue | undefined {
  const prefix = ref.startsWith("#/$defs/")
    ? "#/$defs/"
    : mode === "output" && ref.startsWith("#/definitions/")
      ? "#/definitions/"
      : undefined
  if (!prefix) return undefined
  const name = ref
    .slice(prefix.length)
    .replaceAll("~1", "/")
    .replaceAll("~0", "~")
  const defs = asRecord(prefix === "#/$defs/" ? root.$defs : root.definitions)
  const value = defs[name]
  return typeof value === "boolean" || isSchemaObject(value) ? value : undefined
}

const OUTPUT_TOP_LEVEL_CONSTRAINTS = [
  "patternProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  "dependentRequired",
  "dependentSchemas",
  "if",
  "then",
  "else",
] as const

const OUTPUT_PROPERTY_CONSTRAINTS = [
  "readOnly",
  "writeOnly",
  "unevaluatedProperties",
  "unevaluatedItems",
] as const

function renderAdditionalConstraintComments(
  schema: JsonSchema,
  keys: readonly string[],
): string[] {
  const values: string[] = []
  for (const key of keys) {
    if (!(key in schema)) continue
    values.push(`${key}=${renderSortedJson(schema[key])}`)
  }
  return values.length > 0
    ? [`// Additional JSON Schema constraints: ${values.join("; ")}`]
    : []
}

function renderSortedJson(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean")
    return String(value)
  if (value === null) return "null"
  if (Array.isArray(value)) return `[${value.map(renderSortedJson).join(", ")}]`
  if (isSchemaObject(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, entry]) => `${JSON.stringify(key)}: ${renderSortedJson(entry)}`,
      )
      .join(", ")}}`
  }
  return JSON.stringify(value)
}

function hasBooleanPropertySchema(schema: JsonSchema): boolean {
  return Object.values(asRecord(schema.properties)).some(
    (value) => typeof value === "boolean",
  )
}

function hasRecursiveLocalRef(root: JsonSchema): boolean {
  const active = new Set<string>()

  const visit = (value: unknown): boolean => {
    if (typeof value === "boolean" || !isSchemaObject(value)) return false

    if (typeof value.$ref === "string") {
      const target = resolveLocalRef(root, value.$ref, "output")
      if (target !== undefined) {
        if (active.has(value.$ref)) return true
        active.add(value.$ref)
        const recursive = visit(target)
        active.delete(value.$ref)
        if (recursive) return true
      }
    }

    for (const [key, entry] of Object.entries(value)) {
      if (key === "$defs" || key === "definitions" || key === "$ref") continue
      if (Array.isArray(entry)) {
        if (entry.some(visit)) return true
      } else if (visit(entry)) return true
    }
    return false
  }

  return visit(root)
}

function renderSchemaValue(value: unknown, context: RenderContext): string {
  return renderSchema(asSchemaValue(value), context)
}

function asSchemaValue(value: unknown): SchemaValue {
  if (typeof value === "boolean") return value
  return asRecord(value)
}

function schemaRecord(value: SchemaValue): JsonSchema | undefined {
  return typeof value === "boolean" ? undefined : value
}

function hasComposition(schema: JsonSchema): boolean {
  return (
    Array.isArray(schema.oneOf) ||
    Array.isArray(schema.anyOf) ||
    Array.isArray(schema.allOf)
  )
}

function canRenderCompositionCompact(schema: JsonSchema): boolean {
  const variants = Array.isArray(schema.oneOf)
    ? schema.oneOf
    : Array.isArray(schema.anyOf)
      ? schema.anyOf
      : Array.isArray(schema.allOf)
        ? schema.allOf
        : []
  return variants.every((variant) => {
    const record = asRecord(variant)
    return typeof record.description !== "string" && !("default" in record)
  })
}

function isSchemaObject(value: unknown): value is JsonSchema {
  return value !== null && typeof value === "object" && !Array.isArray(value)
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

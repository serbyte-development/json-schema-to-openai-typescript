import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { ACCEPTANCE_TOOLS, type AcceptanceTool } from "./acceptance-tools.js"

interface LocalValidity {
  name: string
  input: { metaSchemaValid: boolean; compileStatus: string }
  output?: { metaSchemaValid: boolean; compileStatus: string }
}

export type AcceptanceSelection =
  | { mode: "renderer" }
  | { mode: "safe" }
  | { mode: "ambiguous" }
  | { mode: "all" }
  | { mode: "tool"; name: string }

const selectionPath = resolve("fixtures/acceptance/selection.json")
const validityPath = resolve("fixtures/acceptance/local-validity.json")
const AMBIGUOUS_TOOL_NAMES = new Set([
  "input_invalid_empty_enum",
  "input_unresolved_ref",
  "output_invalid_pattern_syntax",
  "output_unresolved_ref",
])

export function readAcceptanceSelection(): AcceptanceSelection {
  if (!existsSync(selectionPath)) return { mode: "renderer" }
  return JSON.parse(readFileSync(selectionPath, "utf8")) as AcceptanceSelection
}

export function getSelectedAcceptanceTools(): AcceptanceTool[] {
  const selection = readAcceptanceSelection()
  if (selection.mode === "renderer") return []
  if (selection.mode === "all") return ACCEPTANCE_TOOLS
  if (selection.mode === "ambiguous") {
    return ACCEPTANCE_TOOLS.filter((tool) =>
      AMBIGUOUS_TOOL_NAMES.has(tool.name),
    )
  }
  if (selection.mode === "tool") {
    const tool = ACCEPTANCE_TOOLS.find((item) => item.name === selection.name)
    if (!tool) throw new Error(`Unknown acceptance tool: ${selection.name}`)
    return [tool]
  }

  const validity = JSON.parse(
    readFileSync(validityPath, "utf8"),
  ) as LocalValidity[]
  const safeNames = new Set(
    validity
      .filter((item) => {
        const target = item.output ?? item.input
        return target.metaSchemaValid && target.compileStatus === "ok"
      })
      .map((item) => item.name),
  )
  return ACCEPTANCE_TOOLS.filter((tool) => safeNames.has(tool.name))
}

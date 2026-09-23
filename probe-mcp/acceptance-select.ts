import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import type { AcceptanceSelection } from "./acceptance-selection.js"
import { ACCEPTANCE_TOOLS } from "./acceptance-tools.js"

const mode = process.argv[2] ?? "renderer"
let selection: AcceptanceSelection

switch (mode) {
  case "renderer":
    selection = { mode: "renderer" }
    break
  case "safe":
    selection = { mode: "safe" }
    break
  case "ambiguous":
    selection = { mode: "ambiguous" }
    break
  case "all":
    selection = { mode: "all" }
    break
  case "tool": {
    const name = process.argv[3]
    if (!name || !ACCEPTANCE_TOOLS.some((tool) => tool.name === name)) {
      throw new Error(`Unknown acceptance tool: ${name ?? "<missing>"}`)
    }
    selection = { mode: "tool", name }
    break
  }
  default:
    throw new Error(`Unknown acceptance selection mode: ${mode}`)
}

writeFileSync(
  resolve("fixtures/acceptance/selection.json"),
  `${JSON.stringify(selection, null, 2)}\n`,
)
process.stdout.write(`${JSON.stringify(selection)}\n`)

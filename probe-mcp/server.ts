import { createServer } from "node:http"

import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import {
  getSelectedAcceptanceTools,
  readAcceptanceSelection,
} from "./acceptance-selection.js"
import { ACCEPTANCE_TOOLS } from "./acceptance-tools.js"
import { PROBE_TOOLS } from "./tools.js"

const host = process.env.HOST ?? "127.0.0.1"
const port = Number(process.env.PORT ?? 3210)

function createProbeServer(
  name: string,
  getTools: () => readonly unknown[],
): McpServer {
  const server = new McpServer(
    { name, version: "0.2.0" },
    {
      instructions:
        "Schema compatibility probe. Tools are inert and exist to expose JSON Schema shapes for model-facing rendering tests.",
    },
  )

  server.server.registerCapabilities({ tools: {} })
  server.server.setRequestHandler("tools/list", async () => ({
    // The probe intentionally exercises raw JSON Schema shapes beyond the
    // SDK's compile-time schema type, while keeping the MCP wire shape valid.
    tools: [...getTools()] as never,
  }))
  server.server.setRequestHandler("tools/call", async (request) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          ok: true,
          tool: request.params.name,
          arguments: request.params.arguments ?? {},
        }),
      },
    ],
  }))

  return server
}

const app = createMcpExpressApp({ host: "0.0.0.0", jsonLimit: "2mb" })
const reportError = (error: Error) => console.error("MCP error:", error)
const getActiveTools = (): readonly unknown[] =>
  readAcceptanceSelection().mode === "renderer"
    ? PROBE_TOOLS
    : getSelectedAcceptanceTools()
const mcpHandler = createMcpHandler(
  () => createProbeServer("openai-json-schema-probe", getActiveTools),
  {
    legacy: "stateless",
    onerror: reportError,
  },
)
const nodeMcpHandler = toNodeHandler(mcpHandler, { onerror: reportError })

app.get("/healthz", (_request, response) => {
  const selection = readAcceptanceSelection()
  const selectedAcceptanceTools = getSelectedAcceptanceTools()
  response.json({
    ok: true,
    mode: selection.mode,
    activeTools: getActiveTools().length,
    rendererTools: PROBE_TOOLS.length,
    acceptanceTools: ACCEPTANCE_TOOLS.length,
    acceptanceSelection: selection,
    selectedAcceptanceTools: selectedAcceptanceTools.length,
  })
})

app.all("/mcp", async (request, response) => {
  await nodeMcpHandler(request, response, request.body)
})

const httpServer = createServer(app)
httpServer.listen(port, host, () => {
  const selection = readAcceptanceSelection()
  console.log(`Schema probe MCP listening on http://${host}:${port}/mcp`)
  console.log(`Mode: ${selection.mode}`)
  console.log(`Active tools: ${getActiveTools().length}`)
})

async function shutdown(): Promise<void> {
  await Promise.allSettled([
    mcpHandler.close(),
    new Promise<void>((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()))
    }),
  ])
}

process.once("SIGINT", () => void shutdown().then(() => process.exit(0)))
process.once("SIGTERM", () => void shutdown().then(() => process.exit(0)))

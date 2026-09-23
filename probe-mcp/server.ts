import { createServer } from "node:http"

import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"

import { PROBE_TOOLS } from "./tools.js"

const host = process.env.HOST ?? "127.0.0.1"
const port = Number(process.env.PORT ?? 3210)

function createProbeServer(): McpServer {
  const server = new McpServer(
    { name: "openai-json-schema-probe", version: "0.1.0" },
    {
      instructions:
        "Schema compatibility probe. Tools are inert and exist to expose JSON Schema shapes for model-facing rendering tests.",
    },
  )

  server.server.registerCapabilities({ tools: {} })
  server.server.setRequestHandler("tools/list", async () => ({
    tools: PROBE_TOOLS,
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
const mcpHandler = createMcpHandler(createProbeServer, {
  legacy: "stateless",
  onerror: reportError,
})
const nodeMcpHandler = toNodeHandler(mcpHandler, { onerror: reportError })

app.get("/healthz", (_request, response) => {
  response.json({ ok: true, tools: PROBE_TOOLS.length })
})

app.all("/mcp", async (request, response) => {
  await nodeMcpHandler(request, response, request.body)
})

const httpServer = createServer(app)
httpServer.listen(port, host, () => {
  console.log(`Schema probe MCP listening on http://${host}:${port}/mcp`)
  console.log(`Tools: ${PROBE_TOOLS.length}`)
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

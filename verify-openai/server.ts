import { createServer } from "node:http"

import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler } from "@modelcontextprotocol/server"
import { CONVERSION_CASES } from "./check-conversion/cases.js"
import { INGESTION_CASES } from "./check-ingestion/cases.js"
import { createMcpServer } from "./mcp.js"

const host = process.env.HOST ?? "127.0.0.1"
const port = Number(process.env.PORT ?? 3210)

const requested = process.argv.slice(2)
const selection = (() => {
  if (requested.length === 0) {
    return { mode: "conversion" as const, tools: CONVERSION_CASES }
  }
  if (requested[0] !== "ingestion" || requested.length === 1) {
    throw new Error(
      "Usage: npm run openai:serve [-- ingestion <case-name> [case-name...]]",
    )
  }

  const toolsByName = new Map(INGESTION_CASES.map((tool) => [tool.name, tool]))
  const names = requested.slice(1)
  const tools = names.map((name) => {
    const tool = toolsByName.get(name)
    if (!tool) throw new Error(`Unknown ingestion case: ${name}`)
    return tool
  })
  return { mode: "ingestion" as const, tools, names }
})()

const app = createMcpExpressApp({ host: "0.0.0.0", jsonLimit: "2mb" })
const reportError = (error: Error) => console.error("MCP error:", error)
const mcpHandler = createMcpHandler(
  () => createMcpServer("openai-json-schema-verification", selection.tools),
  {
    legacy: "stateless",
    onerror: reportError,
  },
)
const nodeMcpHandler = toNodeHandler(mcpHandler, { onerror: reportError })

app.get("/healthz", (_request, response) => {
  response.json({
    ok: true,
    mode: selection.mode,
    activeTools: selection.tools.length,
    conversionCases: CONVERSION_CASES.length,
    ingestionCases: INGESTION_CASES.length,
    ...(selection.mode === "ingestion" ? { caseNames: selection.names } : {}),
  })
})

app.all("/mcp", async (request, response) => {
  await nodeMcpHandler(request, response, request.body)
})

const httpServer = createServer(app)
httpServer.listen(port, host, () => {
  console.log(`OpenAI verification MCP listening on http://${host}:${port}/mcp`)
  console.log(`Mode: ${selection.mode}`)
  console.log(`Active tools: ${selection.tools.length}`)
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

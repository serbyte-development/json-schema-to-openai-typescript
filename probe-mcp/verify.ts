import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { resolve } from "node:path"

import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client"
import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"

import { PROBE_TOOLS } from "./tools.js"

const fixturePath = resolve("fixtures/connector-discovery/before.json")
const mode = process.argv[2] ?? "--stdout"

function createProbeServer(): McpServer {
  const server = new McpServer({
    name: "openai-json-schema-probe-verify",
    version: "0.1.0",
  })
  server.server.registerCapabilities({ tools: {} })
  server.server.setRequestHandler("tools/list", async () => ({
    tools: PROBE_TOOLS,
  }))
  server.server.setRequestHandler("tools/call", async () => ({
    content: [{ type: "text", text: "ok" }],
  }))
  return server
}

const app = createMcpExpressApp({ host: "127.0.0.1" })
const mcpHandler = createMcpHandler(createProbeServer, { legacy: "stateless" })
const nodeMcpHandler = toNodeHandler(mcpHandler)
app.all("/mcp", async (request, response) => {
  await nodeMcpHandler(request, response, request.body)
})

const httpServer = createServer(app)
await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve))
const address = httpServer.address()
if (!address || typeof address === "string")
  throw new Error("Probe server did not bind to TCP")

const client = new Client(
  { name: "openai-json-schema-probe-verifier", version: "0.1.0" },
  { versionNegotiation: { mode: "auto" } },
)

try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}/mcp`),
    ),
  )
  const result = await client.listTools()
  if (result.tools.length !== PROBE_TOOLS.length) {
    throw new Error(
      `Expected ${PROBE_TOOLS.length} tools, received ${result.tools.length}`,
    )
  }
  const serialized = `${JSON.stringify(result.tools, null, 2)}\n`
  switch (mode) {
    case "--write":
      writeFileSync(fixturePath, serialized)
      break
    case "--check":
      assert.equal(readFileSync(fixturePath, "utf8"), serialized)
      break
    case "--stdout":
      process.stdout.write(serialized)
      break
    default:
      throw new Error(`Unknown mode: ${mode}`)
  }
} finally {
  await client.close().catch(() => undefined)
  await mcpHandler.close()
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => (error ? reject(error) : resolve()))
  })
}

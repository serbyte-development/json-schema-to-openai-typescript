import { createServer } from "node:http"

import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client"
import { createMcpExpressApp } from "@modelcontextprotocol/express"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"

const MCP_VERSION = "0.2.0"

export function createMcpServer(
  name: string,
  tools: readonly unknown[],
): McpServer {
  const server = new McpServer(
    { name, version: MCP_VERSION },
    {
      instructions:
        "Exposes JSON Schema cases for verifying OpenAI conversion and ingestion behavior. Tools are inert.",
    },
  )

  server.server.registerCapabilities({ tools: {} })
  server.server.setRequestHandler("tools/list", async () => ({
    // Raw-schema cases intentionally include shapes outside the SDK's
    // compile-time schema type while preserving the MCP wire representation.
    tools: [...tools] as never,
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

export async function listToolsThroughOfficialClient(
  tools: readonly unknown[],
  name: string,
) {
  const app = createMcpExpressApp({ host: "127.0.0.1" })
  const handler = createMcpHandler(() => createMcpServer(name, tools), {
    legacy: "stateless",
  })
  const nodeHandler = toNodeHandler(handler)
  app.all("/mcp", async (request, response) => {
    await nodeHandler(request, response, request.body)
  })

  const httpServer = createServer(app)
  await new Promise<void>((resolve) =>
    httpServer.listen(0, "127.0.0.1", resolve),
  )
  const address = httpServer.address()
  if (!address || typeof address === "string") {
    throw new Error("Verification server did not bind to TCP")
  }

  const client = new Client(
    { name: `${name}-client`, version: MCP_VERSION },
    { versionNegotiation: { mode: "auto" } },
  )

  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
      ),
    )
    return (await client.listTools()).tools
  } finally {
    await client.close().catch(() => undefined)
    await handler.close().catch(() => undefined)
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  }
}

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
import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js"

import { ACCEPTANCE_TOOLS, MCP_TRANSPORT_PROBES } from "./acceptance-tools.js"

type JsonSchema = Record<string, unknown>

interface SchemaInspection {
  metaSchemaValid: boolean
  compileStatus:
    | "ok"
    | "invalid-schema"
    | "unresolved-ref"
    | "invalid-regex"
    | "compile-error"
  metaSchemaErrors: string[]
  compileError?: string
}

interface AcceptanceInspection {
  name: string
  input: SchemaInspection
  output?: SchemaInspection
}

interface TransportInspection {
  name: string
  acceptedByOfficialClient: boolean
  error?: string
}

const beforePath = resolve("fixtures/acceptance/before.json")
const validityPath = resolve("fixtures/acceptance/local-validity.json")
const transportPath = resolve("fixtures/acceptance/mcp-transport.json")
const mode = process.argv[2] ?? "--check"

function createAcceptanceServer(): McpServer {
  const server = new McpServer({
    name: "openai-json-schema-acceptance-local",
    version: "0.2.0",
  })
  server.server.registerCapabilities({ tools: {} })
  server.server.setRequestHandler("tools/list", async () => ({
    // Intentional raw-schema probe: nested schemas include cases the SDK's
    // compile-time schema type cannot represent, but the wire codec accepts.
    tools: ACCEPTANCE_TOOLS as never,
  }))
  server.server.setRequestHandler("tools/call", async () => ({
    content: [{ type: "text", text: "ok" }],
  }))
  return server
}

function createSingleToolServer(tool: Record<string, unknown>): McpServer {
  const server = new McpServer({
    name: "openai-json-schema-transport-probe",
    version: "0.2.0",
  })
  server.server.registerCapabilities({ tools: {} })
  server.server.setRequestHandler("tools/list", async () => ({
    // These isolated probes intentionally include invalid MCP tool shapes.
    tools: [tool] as never,
  }))
  return server
}

async function inspectTransportProbe(
  probe: (typeof MCP_TRANSPORT_PROBES)[number],
): Promise<TransportInspection> {
  const app = createMcpExpressApp({ host: "127.0.0.1" })
  const handler = createMcpHandler(() => createSingleToolServer(probe.tool), {
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
  if (!address || typeof address === "string")
    throw new Error("Transport probe server did not bind to TCP")

  const client = new Client(
    { name: "openai-json-schema-transport-verifier", version: "0.2.0" },
    { versionNegotiation: { mode: "auto" } },
  )

  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
      ),
    )
    await client.listTools()
    return { name: probe.name, acceptedByOfficialClient: true }
  } catch (error) {
    return {
      name: probe.name,
      acceptedByOfficialClient: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await client.close().catch(() => undefined)
    await handler.close().catch(() => undefined)
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
  }
}

function inspectSchema(schema: JsonSchema): SchemaInspection {
  const ajv = new Ajv2020({ strict: false, validateFormats: false })
  const metaSchemaValid = ajv.validateSchema(schema)
  const metaSchemaErrors = (ajv.errors ?? []).map(
    (error: ErrorObject) =>
      `${error.instancePath || "/"} ${error.keyword}: ${error.message ?? "invalid"}`,
  )

  if (!metaSchemaValid) {
    return {
      metaSchemaValid: false,
      compileStatus: "invalid-schema",
      metaSchemaErrors,
    }
  }

  try {
    ajv.compile(schema)
    return { metaSchemaValid: true, compileStatus: "ok", metaSchemaErrors }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const lower = message.toLowerCase()
    const compileStatus = lower.includes("can't resolve reference")
      ? "unresolved-ref"
      : lower.includes("invalid regular expression") ||
          lower.includes("invalid pattern")
        ? "invalid-regex"
        : "compile-error"
    return {
      metaSchemaValid: true,
      compileStatus,
      metaSchemaErrors,
      compileError: message,
    }
  }
}

const app = createMcpExpressApp({ host: "127.0.0.1" })
const mcpHandler = createMcpHandler(createAcceptanceServer, {
  legacy: "stateless",
})
const nodeMcpHandler = toNodeHandler(mcpHandler)
app.all("/mcp", async (request, response) => {
  await nodeMcpHandler(request, response, request.body)
})

const httpServer = createServer(app)
await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve))
const address = httpServer.address()
if (!address || typeof address === "string")
  throw new Error("Acceptance probe server did not bind to TCP")

const client = new Client(
  { name: "openai-json-schema-acceptance-verifier", version: "0.2.0" },
  { versionNegotiation: { mode: "auto" } },
)

try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}/mcp`),
    ),
  )
  const result = await client.listTools()
  assert.equal(result.tools.length, ACCEPTANCE_TOOLS.length)

  const before = `${JSON.stringify(result.tools, null, 2)}\n`
  const inspections: AcceptanceInspection[] = result.tools.map((tool) => ({
    name: tool.name,
    input: inspectSchema(tool.inputSchema as JsonSchema),
    ...(tool.outputSchema
      ? { output: inspectSchema(tool.outputSchema as JsonSchema) }
      : {}),
  }))
  const validity = `${JSON.stringify(inspections, null, 2)}\n`
  const transport = `${JSON.stringify(
    await Promise.all(MCP_TRANSPORT_PROBES.map(inspectTransportProbe)),
    null,
    2,
  )}\n`

  switch (mode) {
    case "--write":
      writeFileSync(beforePath, before)
      writeFileSync(validityPath, validity)
      writeFileSync(transportPath, transport)
      break
    case "--check":
      assert.equal(readFileSync(beforePath, "utf8"), before)
      assert.equal(readFileSync(validityPath, "utf8"), validity)
      assert.equal(readFileSync(transportPath, "utf8"), transport)
      break
    case "--stdout":
      process.stdout.write(
        JSON.stringify(
          {
            validity: JSON.parse(validity),
            transport: JSON.parse(transport),
          },
          null,
          2,
        ),
      )
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

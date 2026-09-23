export interface NormalizedConnectorTool {
  name: string
  input: string
  output: string
}

const TYPESCRIPT_FENCE = /```ts\n([\s\S]*?)\n```/gu
const ARGS_MARKER = "(args: "
const RETURN_MARKER = "): Promise<"
const SIGNATURE_SUFFIX = ">;"

export function normalizeConnectorDiscoveryCapture(
  capture: string,
  connectorPrefix: string,
): NormalizedConnectorTool[] {
  const normalized: NormalizedConnectorTool[] = []

  for (const match of capture.matchAll(TYPESCRIPT_FENCE)) {
    const signature = match[1]
    if (signature === undefined) continue
    normalized.push(parseConnectorSignature(signature, connectorPrefix))
  }

  return normalized
}

export function serializeNormalizedConnectorDiscovery(
  tools: readonly NormalizedConnectorTool[],
): string {
  return `${JSON.stringify(tools, null, 2)}\n`
}

function parseConnectorSignature(
  signature: string,
  connectorPrefix: string,
): NormalizedConnectorTool {
  if (!signature.startsWith(connectorPrefix)) {
    throw new Error(`Unexpected connector signature prefix: ${signature}`)
  }

  if (!signature.endsWith(SIGNATURE_SUFFIX)) {
    throw new Error(`Unexpected connector signature suffix: ${signature}`)
  }

  const argsMarkerIndex = signature.indexOf(ARGS_MARKER, connectorPrefix.length)
  if (argsMarkerIndex < 0) {
    throw new Error(
      `Connector signature is missing ${JSON.stringify(ARGS_MARKER)}: ${signature}`,
    )
  }

  const returnMarkerIndex = signature.lastIndexOf(RETURN_MARKER)
  if (returnMarkerIndex < argsMarkerIndex) {
    throw new Error(
      `Connector signature is missing ${JSON.stringify(RETURN_MARKER)} after its arguments: ${signature}`,
    )
  }

  const name = signature.slice(connectorPrefix.length, argsMarkerIndex)
  if (name.length === 0)
    throw new Error(`Connector signature has an empty tool name: ${signature}`)

  return {
    name,
    input: signature.slice(
      argsMarkerIndex + ARGS_MARKER.length,
      returnMarkerIndex,
    ),
    output: signature.slice(
      returnMarkerIndex + RETURN_MARKER.length,
      -SIGNATURE_SUFFIX.length,
    ),
  }
}

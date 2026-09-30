import {
  type ContactRequest,
  parseContactRequest,
} from "@jopy-dev/contact-contract";

export const MAX_BODY_BYTES = 16_384;

export type BodyResult =
  | { kind: "ok"; bytes: Uint8Array }
  | { kind: "too_large" };

export function isJsonMediaType(request: Request): boolean {
  const contentType = request.headers.get("Content-Type") ?? "";
  const [essence = ""] = contentType.split(";");
  return essence.trim().toLowerCase() === "application/json";
}

function declaresTooLarge(request: Request): boolean {
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  return !Number.isFinite(declared) || declared > MAX_BODY_BYTES;
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

// The declared length can be absent or wrong (chunked uploads), so the stream
// is also counted and abandoned the moment it passes the cap; nothing is
// buffered beyond 16 KiB and JSON parsing never sees an oversize body.
export async function readBoundedBody(request: Request): Promise<BodyResult> {
  if (declaresTooLarge(request)) return { kind: "too_large" };
  if (request.body === null) return { kind: "ok", bytes: new Uint8Array() };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    total += next.value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return { kind: "too_large" };
    }
    chunks.push(next.value);
  }
  return { kind: "ok", bytes: concat(chunks, total) };
}

// Malformed UTF-8 is rejected rather than replaced, so the schema always sees
// exactly what the visitor sent.
export function parseSubmission(bytes: Uint8Array): ContactRequest | null {
  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: false,
    }).decode(bytes);
    const result = parseContactRequest(JSON.parse(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

const encoder = new TextEncoder();

// The raw client address never becomes an object name, log field, or stored
// value: only this keyed digest does, and the key lives in a Worker secret.
export async function clientKey(secret: string, address: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(address));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

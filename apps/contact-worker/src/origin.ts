// CORS here only lets the approved site read responses; it is not access
// control. Origin is still checked server-side on every POST.
export function corsHeaders(origin: string): Record<string, string> {
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

// Exact string equality: no wildcard, suffix, or normalization, so look-alike
// hosts and the opaque "null" origin never match.
export function isAllowedOrigin(request: Request, allowed: string): boolean {
  return request.headers.get("Origin") === allowed;
}

function requestsOnlyContentType(request: Request): boolean {
  const requested = request.headers.get("Access-Control-Request-Headers");
  if (requested === null) return true;
  return requested
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .every((name) => name === "content-type");
}

export function isAllowedPreflight(request: Request, allowed: string): boolean {
  return (
    isAllowedOrigin(request, allowed) &&
    request.headers.get("Access-Control-Request-Method") === "POST" &&
    requestsOnlyContentType(request)
  );
}

export function preflightHeaders(origin: string): Record<string, string> {
  return {
    ...corsHeaders(origin),
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

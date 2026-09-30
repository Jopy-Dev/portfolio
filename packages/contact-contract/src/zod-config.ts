import { config } from "zod";

// Zod 4 otherwise probes `Function("")` to JIT-compile parsers; the site's CSP
// forbids eval and Workers disallow it, so always use the interpreter.
config({ jitless: true });

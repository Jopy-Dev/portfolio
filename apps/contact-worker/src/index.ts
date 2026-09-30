import { handleRequest } from "./router.ts";

export { ContactRateLimiter } from "./rate-limit/contact-rate-limiter.ts";

export default {
  fetch(request, env) {
    return handleRequest(request, env, {
      fetch: (input, init) => fetch(input, init),
      now: () => Date.now(),
    });
  },
} satisfies ExportedHandler<Env>;

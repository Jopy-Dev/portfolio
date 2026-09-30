import assert from "node:assert/strict";
import test from "node:test";
import { config } from "zod";
import "../src/index.ts";

test("loading the contract disables Zod's eval-based JIT for CSP-safe parsing", () => {
  assert.equal(config().jitless, true);
});

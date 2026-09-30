import assert from "node:assert/strict";
import test from "node:test";
import { playPressFeedback } from "../../apps/site/src/components/ui/press-feedback.ts";

test("press timing remains 340ms when production CSS converts tokens to seconds", () => {
  const oldWindow = globalThis.window;
  const oldGetComputedStyle = globalThis.getComputedStyle;
  let recorded;
  globalThis.window = {
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  globalThis.getComputedStyle = () => ({
    getPropertyValue: (key) =>
      ({
        "--duration-press": ".12s",
        "--duration-press-release": ".22s",
        "--press-scale": ".96",
        "--ease-editorial": "cubic-bezier(0.16, 1, 0.3, 1)",
      })[key],
  });
  const element = {
    matches: () => false,
    getAnimations: () => [],
    animate: (frames, options) => {
      recorded = { frames, options };
      return {};
    },
  };
  try {
    playPressFeedback(element);
    assert.equal(recorded.options.duration, 340);
    assert.equal(recorded.frames[1].offset, 120 / 340);
  } finally {
    globalThis.window = oldWindow;
    globalThis.getComputedStyle = oldGetComputedStyle;
  }
});

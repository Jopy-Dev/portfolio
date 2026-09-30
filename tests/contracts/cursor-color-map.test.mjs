import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile("apps/site/src/styles/tokens.css", "utf8");
const styles = await readFile("apps/site/src/styles/motion.css", "utf8");
const source = await readFile(
  "apps/site/src/components/motion/cursor-color-disc.tsx",
  "utf8",
);
const stageBlock = source.match(
  /CURSOR_COLOR_STAGES = \[([\s\S]*?)\] as const/,
)?.[1];
assert.ok(stageBlock, "cursor stage order must be explicit");
const stages = [...stageBlock.matchAll(/"([a-z]+)"/g)].map((match) => {
  const rule = styles.match(
    new RegExp(`\\[data-cursor-stage="${match[1]}"\\] \\{([^}]+)\\}`),
  )?.[1];
  assert.ok(rule, `missing style for ${match[1]}`);
  return {
    color: colorToken(rule.match(/background: var\((--[\w-]+)\)/)?.[1]),
    mode: rule.match(/mix-blend-mode: ([a-z-]+)/)?.[1],
  };
});

function colorToken(name) {
  const value = tokens.match(new RegExp(`${name}: ([^;]+);`))?.[1];
  assert.ok(value, `missing palette token ${name}`);
  if (value.startsWith("#")) {
    return [1, 3, 5].map(
      (offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
    );
  }
  return value
    .slice(4, -1)
    .split(/\s+/)
    .map((channel) => Number(channel) / 255);
}

// Independent reference equations from W3C Compositing Level 1, sections 10.1/10.2.
function blend(backdrop, foreground, mode) {
  if (mode === "color") {
    const luminance =
      0.3 * backdrop[0] + 0.59 * backdrop[1] + 0.11 * backdrop[2];
    return [luminance, luminance, luminance];
  }
  return backdrop.map((b, index) => {
    const s = foreground[index];
    switch (mode) {
      case "difference":
        return Math.abs(b - s);
      case "color-burn":
        return b === 1 ? 1 : s === 0 ? 0 : 1 - Math.min(1, (1 - b) / s);
      case "color-dodge":
        return b === 0 ? 0 : s === 1 ? 1 : Math.min(1, b / (1 - s));
      case "screen":
        return b + s - b * s;
      case "overlay":
        return b <= 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s);
      case "multiply":
        return b * s;
      default:
        throw new Error(`Unknown cursor blend stage ${mode}`);
    }
  });
}

function mapped(color) {
  return stages.reduce((b, stage) => blend(b, stage.color, stage.mode), color);
}

function near(actual, expected) {
  actual.forEach((channel, index) => {
    assert.ok(
      Math.abs(channel - expected[index]) * 255 < 0.01,
      `channel ${index}: ${channel * 255} differs from ${expected[index] * 255}`,
    );
  });
}

test("cursor palette maps dark surfaces to brand green, site greens to white, and white to black", () => {
  const green = colorToken("--color-brand-signal");
  const white = colorToken("--color-text-primary");
  for (const name of [
    "--color-canvas",
    "--color-ink-on-menu",
    "--color-surface-raised",
  ]) {
    near(mapped(colorToken(name)), green);
  }
  near(mapped([0, 0, 0]), green);
  near(mapped(green), white);
  near(mapped(colorToken("--color-brand-menu")), white);
  near(mapped(white), [0, 0, 0]);
  near(mapped([1, 1, 1]), [0, 0, 0]);
});

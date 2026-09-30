const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const pw = require(process.argv[2]);
const { launchOptions } = require("./browser-env.cjs");
const out = process.env.BROWSER_TEST_OUTPUT || "test-results/project-catalog";
const previews = [
  "/assets/projects/topspin/dashboard.webp",
  "/assets/projects/canva-clone/dashboard.webp",
  "/assets/projects/zoom-clone/dashboard.webp",
  "/assets/projects/durable-impact-academy/landing.webp",
  "/assets/projects/local-notes/split-side-by-side.webp",
  "/assets/projects/ai-powered-resume/screen-2.webp",
  "/assets/projects/figma-clone/screen-1.webp",
  "/assets/projects/online-notes-management/screen-1.webp",
];

async function checkPreview(page) {
  const rows = page.locator(".project-row");
  for (const index of [7, 6, 5, 4, 3, 2, 1, 0, 7]) {
    // Target the title rather than the row center near the fixed section cue.
    await rows
      .nth(index)
      .locator(".project-row__title")
      .hover({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(550);
    assert.equal(
      await rows.nth(index).evaluate((e) => getComputedStyle(e).opacity),
      "1",
    );
    assert.deepEqual(
      await rows.evaluateAll((elements) =>
        elements.map((e) => getComputedStyle(e).opacity),
      ),
      previews.map((_, rowIndex) => (rowIndex === index ? "1" : "0.3")),
      "Inactive project must retain approved sibling dimming after hash arrival",
    );
    const active = page.locator('.projects__preview img[data-active="true"]');
    assert.equal(await active.getAttribute("src"), previews[index]);
    assert.equal(
      await active.evaluate((e) => getComputedStyle(e).opacity),
      "1",
    );
  }
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await rows.first().focus();
  await page.waitForTimeout(550);
  assert.equal(
    await rows.last().evaluate((e) => getComputedStyle(e).opacity),
    "0.3",
  );
  assert.equal(
    await page
      .locator('.projects__preview img[data-active="true"]')
      .getAttribute("src"),
    "/assets/projects/topspin/dashboard.webp",
  );
}

(async () => {
  await mkdir(out, { recursive: true });
  const results = [];
  for (const engine of process.argv[3] === "focused"
    ? ["chromium"]
    : ["chromium", "firefox", "webkit"]) {
    const browser = await pw[engine].launch(launchOptions(engine));
    try {
      for (const width of process.argv[3] === "focused"
        ? [1280]
        : engine === "chromium"
          ? [375, 768, 1280, 1536, 1920]
          : [375, 1280]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("response", (r) => {
          if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
        });
        await page.goto("http://127.0.0.1:4173/#projects");
        await page.locator(".preloader").waitFor({ state: "hidden" });
        assert.equal(await page.locator(".project-row").count(), 8);
        assert.equal(await page.locator("section").count(), 5);
        assert.deepEqual(
          await page.locator(".project-row__title").allTextContents(),
          [
            "TopSpin",
            "Canva Clone",
            "Zoom Clone",
            "Durable Impact Academy",
            "Offline Local Notes (Desktop)",
            "AI Powered Resume",
            "Figma Clone (Vanilla JavaScript)",
            "Online Notes Management",
          ],
        );
        const expectedSize = Math.max(
          2.6 * 16,
          Math.min(width * 0.06, 4.5 * 16),
        );
        for (const size of await page
          .locator(".project-row__title")
          .evaluateAll((elements) =>
            elements.map((e) => parseFloat(getComputedStyle(e).fontSize)),
          )) {
          assert.ok(
            Math.abs(size - expectedSize) < 0.1,
            `Project title size ${size} must follow requested clamp ${expectedSize}`,
          );
        }
        if (width >= 768) await checkPreview(page);
        else
          assert.ok(
            await page.locator(".project-row__image").last().isVisible(),
          );
        await page
          .getByRole("link", {
            name: "View Online Notes Management project details",
          })
          .click();
        await page.waitForURL("**/projects/online-notes-management/");
        await page.locator(".preloader").waitFor({ state: "hidden" });
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.deepEqual(
          await page.locator(".project-detail__facts dt").allTextContents(),
          ["Tech Stack", "Description", "Key Features", "Technical Highlights"],
        );
        for (let i = 0; i < 3; i++) {
          const link = page.getByRole("link", {
            name: `Expand Online Notes Management image ${i + 1}`,
          });
          await link.click();
          await page.locator("dialog[open]").waitFor();
          assert.match(
            await page
              .locator(".project-image-viewer__image")
              .getAttribute("src"),
            /online-notes-management/,
          );
          await page.getByRole("button", { name: "Close full image" }).click();
          assert.ok(await link.evaluate((e) => document.activeElement === e));
        }
        await page.getByRole("link", { name: "Back to Projects" }).click();
        await page.waitForURL("**/#projects");
        await page.locator(".preloader").waitFor({ state: "hidden" });
        assert.ok(
          await page
            .locator("#projects .section-heading")
            .evaluate((e) => Math.abs(e.getBoundingClientRect().top) < 2),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
          0,
        );
        assert.deepEqual(errors, []);
        results.push({ engine, width, pass: true });
        console.log(JSON.stringify(results.at(-1)));
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

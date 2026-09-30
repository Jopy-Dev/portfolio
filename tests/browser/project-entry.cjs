const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const pw = require(process.argv[2]);
const { isReportOnlyNotice, launchOptions } = require("./browser-env.cjs");
const base = "http://127.0.0.1:4173";
const projectTitle = process.argv[4] || "TopSpin";
const output =
  process.argv[5] ||
  process.env.BROWSER_TEST_OUTPUT ||
  "test-results/project-entry";

async function sampleEntry(page) {
  await page.evaluate(() => {
    window.projectEntry = { done: false, frames: [] };
    let releasedAt = 0;
    const sample = (time) => {
      const detail = document.querySelector("[data-project-detail]");
      const loader = document.querySelector('.preloader[data-mode="reveal"]');
      if (detail && loader) {
        const panel = loader.querySelector(".preloader__panels span");
        if (
          getComputedStyle(loader).display === "none" ||
          panel.getBoundingClientRect().bottom < innerHeight - 5
        ) {
          window.projectEntry.frames.push({ y: scrollY });
        }
        if (loader.dataset.released === "true") {
          releasedAt ||= time;
          if (time - releasedAt > 120) {
            window.projectEntry.done = true;
            return;
          }
        }
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function assertEntry(page) {
  await page.waitForFunction(() => window.projectEntry.done);
  const frames = await page.evaluate(() => window.projectEntry.frames);
  assert.ok(frames.length > 0);
  const wrong = frames.filter((frame) => Math.abs(frame.y) > 1);
  assert.equal(
    wrong.length,
    0,
    `Project must open at top throughout reveal; first wrong=${JSON.stringify(wrong[0])}`,
  );
  assert.ok(
    await page
      .locator(".project-detail__header")
      .evaluate((element) => element.getBoundingClientRect().top < innerHeight),
  );
}

function underline(element) {
  const style = getComputedStyle(element, "::after");
  return {
    duration: style.transitionDuration,
    easing: style.transitionTimingFunction,
    color: style.backgroundColor,
    height: style.height,
  };
}

async function checkLinks(page, reference) {
  for (const selector of [
    ".project-detail__back",
    ".project-detail__links a",
  ]) {
    const link = page.locator(selector);
    assert.deepEqual(await link.evaluate(underline), reference);
    await link.hover();
    await page.waitForFunction(
      (query) =>
        getComputedStyle(document.querySelector(query), "::after").transform ===
        "matrix(1, 0, 0, 1, 0, 0)",
      selector,
    );
    assert.equal(
      await link.evaluate(
        (element) =>
          getComputedStyle(element, "::after").transformOrigin.split(" ")[0],
      ),
      "0px",
    );
    await page.mouse.move(0, 0);
    await page.keyboard.press("Tab");
    await link.focus();
    assert.ok(
      await link.evaluate((element) => element.matches(":focus-visible")),
    );
    await page.waitForFunction(
      (query) =>
        getComputedStyle(document.querySelector(query), "::after").transform ===
        "matrix(1, 0, 0, 1, 0, 0)",
      selector,
    );
    assert.ok(
      await link.evaluate(
        (element) => element.getBoundingClientRect().height >= 44,
      ),
    );
  }
}

(async () => {
  await mkdir(output, { recursive: true });
  const results = [];
  const engines =
    process.argv[3] === "focused"
      ? ["chromium"]
      : ["chromium", "firefox", "webkit"];
  for (const engine of engines) {
    const browser = await pw[engine].launch(launchOptions(engine));
    try {
      for (const [width, reducedMotion] of process.argv[3] === "focused"
        ? [[1280, "no-preference"]]
        : [
            [375, "no-preference"],
            [1280, "no-preference"],
            [375, "reduce"],
          ]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          reducedMotion,
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (entry) => {
          if (entry.type() === "error" && !isReportOnlyNotice(entry.text()))
            errors.push(entry.text());
        });
        page.on("response", (response) => {
          if (response.status() >= 400)
            errors.push(`${response.status()} ${response.url()}`);
        });
        await page.goto(`${base}/#projects`);
        await page.locator(".preloader").waitFor({ state: "hidden" });
        const reference = await page
          .locator(".social-links a")
          .first()
          .evaluate(underline);
        await sampleEntry(page);
        await page
          .getByRole("link", { name: `View ${projectTitle} project details` })
          .click();
        await assertEntry(page);
        console.log(
          JSON.stringify({ engine, width, reducedMotion, entry: true }),
        );
        await page
          .locator(".project-detail__gallery a")
          .last()
          .scrollIntoViewIfNeeded();
        await page.reload();
        await page.locator(".preloader").waitFor({ state: "hidden" });
        assert.equal(
          await page.evaluate(() => scrollY),
          0,
          "Reload starts with project description",
        );
        await page
          .locator(".project-detail__gallery a")
          .last()
          .scrollIntoViewIfNeeded();
        await page.getByRole("link", { name: "Back to Projects" }).click();
        await page.waitForURL("**/#projects");
        await page.locator(".preloader").waitFor({ state: "hidden" });
        await sampleEntry(page);
        await page.goBack();
        await assertEntry(page);
        await checkLinks(page, reference);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        if (engine === "chromium" && reducedMotion === "no-preference")
          await page.screenshot({
            path: `${output}/project-${width}.png`,
          });
        assert.deepEqual(errors, []);
        results.push({ engine, width, reducedMotion, pass: true });
        console.log(JSON.stringify(results.at(-1)));
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    `${output}/entry-results.json`,
    JSON.stringify(results, null, 2),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

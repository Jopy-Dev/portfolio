import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve();

async function readSource(...segments) {
  try {
    return await readFile(path.join(projectRoot, ...segments), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

const [
  layoutSource,
  lifecycleSource,
  preloaderSource,
  heroSource,
  heroArrowSource,
  heroStyles,
  responsiveStyles,
  sectionMotionSource,
  sectionStyles,
  appStyles,
  viewportEffectsSource,
  motionEventsSource,
  footerSource,
  indexHtml,
  skillsMotionSource,
] = await Promise.all([
  readSource("apps", "site", "src", "app", "layout.tsx"),
  readSource(
    "apps",
    "site",
    "src",
    "components",
    "motion",
    "motion-lifecycle-provider.tsx",
  ),
  readSource("apps", "site", "src", "components", "motion", "preloader.tsx"),
  readSource(
    "apps",
    "site",
    "src",
    "components",
    "sections",
    "hero-section.tsx",
  ),
  readSource("apps", "site", "src", "components", "motion", "hero-arrow.tsx"),
  readSource("apps", "site", "src", "styles", "hero.css"),
  readSource("apps", "site", "src", "styles", "responsive.css"),
  readSource(
    "apps",
    "site",
    "src",
    "components",
    "motion",
    "viewport-reveal.ts",
  ),
  readSource("apps", "site", "src", "styles", "sections.css"),
  readSource("apps", "site", "src", "app", "globals.css"),
  readSource(
    "apps",
    "site",
    "src",
    "components",
    "motion",
    "viewport-effects.tsx",
  ),
  readSource("apps", "site", "src", "components", "motion", "motion-events.ts"),
  readSource("apps", "site", "src", "components", "layout", "site-footer.tsx"),
  readSource("apps", "site", "out", "index.html"),
  readSource(
    "apps",
    "site",
    "src",
    "components",
    "motion",
    "skill-scroll-motion.ts",
  ),
]);

test("smooth scrolling is lifecycle-owned and synchronized with ScrollTrigger", () => {
  assert.match(layoutSource, /MotionLifecycleProvider/);
  assert.match(lifecycleSource, /import\("lenis"\)/);
  assert.match(lifecycleSource, /new Lenis\(/);
  assert.match(lifecycleSource, /const LENIS_LERP = 0\.1/);
  assert.match(lifecycleSource, /const LENIS_DURATION_SECONDS = 1\.4/);
  assert.match(lifecycleSource, /lerp:\s*LENIS_LERP/);
  assert.match(lifecycleSource, /duration:\s*LENIS_DURATION_SECONDS/);
  assert.match(lifecycleSource, /respectReducedMotion:\s*true/);
  assert.match(lifecycleSource, /ScrollTrigger\.update\(\)/);
  assert.match(lifecycleSource, /lenis\.on\("scroll",\s*updateScrollTrigger\)/);
  assert.match(lifecycleSource, /gsap\.ticker\.add\(tickLenis\)/);
  assert.match(lifecycleSource, /gsap\.ticker\.remove\(tickLenis\)/);
  assert.match(lifecycleSource, /document\.fonts\.ready/);
  assert.match(motionEventsSource, /jopy:preloader-released/);
  assert.match(lifecycleSource, /PRELOADER_RELEASED_EVENT/);
  assert.match(preloaderSource, /PRELOADER_RELEASED_EVENT/);
  assert.match(appStyles, /lenis\/dist\/lenis\.css/);
});

test("motion lifecycle handles live preference and bfcache transitions without replay", () => {
  assert.match(lifecycleSource, /prefers-reduced-motion:\s*reduce/);
  assert.match(lifecycleSource, /addEventListener\("change"/);
  assert.match(lifecycleSource, /addEventListener\("pagehide"/);
  assert.match(lifecycleSource, /event\.persisted/);
  assert.match(lifecycleSource, /addEventListener\("pageshow"/);
  assert.match(lifecycleSource, /lenis\.stop\(\)/);
  assert.match(lifecycleSource, /lenis\.start\(\)/);
  assert.match(lifecycleSource, /lenis\.destroy\(\)/);
  assert.match(lifecycleSource, /ScrollTrigger\.refresh\(\)/);
  assert.match(viewportEffectsSource, /addEventListener\("change"/);
  assert.match(viewportEffectsSource, /visibilitychange/);
});

test("Hero arrow keeps its draw, fill, fall, and loop animation", () => {
  assert.match(heroSource, /<HeroArrow\s*\/>/);
  assert.match(heroArrowSource, /repeat:\s*-1/);
  assert.match(heroArrowSource, /strokeDasharray/);
  assert.match(heroArrowSource, /strokeDashoffset:\s*0/);
  assert.match(heroArrowSource, /fillOpacity:\s*0\.03/);
  assert.match(heroArrowSource, /y:\s*300/);
  assert.equal((heroArrowSource.match(/<path/g) ?? []).length, 2);
  assert.match(heroStyles, /\.hero-arrow/);
  assert.match(responsiveStyles, /\.hero-arrow/);
});

test("Hero arrow does not access its GSAP context during context initialization", () => {
  assert.doesNotMatch(
    heroArrowSource,
    /const context = gsap\.context\(\(\) => \{[\s\S]*context\.add/,
  );
  assert.match(
    heroArrowSource,
    /document\.removeEventListener\("visibilitychange"/,
  );
});

test("viewport reveals resync exact top and bottom states after layout refresh", async () => {
  const { getViewportRegion } = await import(
    "../../apps/site/src/components/motion/viewport-region.ts"
  );

  const base = {
    edgeRatio: 0.1,
    maxScroll: 10000,
    scrollTop: 0,
    viewportHeight: 1000,
  };
  assert.equal(
    getViewportRegion({ ...base, targetTop: 901, targetExit: 940 }),
    "before",
  );
  assert.equal(
    getViewportRegion({ ...base, targetTop: 900, targetExit: 940 }),
    "inside",
  );
  assert.equal(
    getViewportRegion({ ...base, targetTop: 40, targetExit: 100 }),
    "after",
  );
  assert.equal(
    getViewportRegion({ ...base, targetTop: 40, targetExit: 101 }),
    "inside",
  );
  assert.match(sectionMotionSource, /invalidateOnRefresh:\s*true/);
  assert.match(sectionMotionSource, /onRefresh:/);
});

test("document-end content enters at maximum reachable scroll", async () => {
  const { getViewportEntryScrollPosition, getViewportRegion } = await import(
    "../../apps/site/src/components/motion/viewport-region.ts"
  );
  const footer = {
    edgeRatio: 0.1,
    maxScroll: 5156,
    targetExit: 5998,
    targetTop: 5972,
    viewportHeight: 842,
  };

  assert.equal(getViewportEntryScrollPosition(footer), 5071.8);
  assert.equal(getViewportRegion({ ...footer, scrollTop: 5071 }), "before");
  assert.equal(getViewportRegion({ ...footer, scrollTop: 5072 }), "inside");
  assert.equal(getViewportRegion({ ...footer, scrollTop: 5156 }), "inside");
  assert.match(sectionMotionSource, /getViewportEntryScrollPosition/);
});

test("Skills use scroll-linked individual sequencing", async () => {
  const { createSkillScrollSchedule } = await import(
    "../../apps/site/src/components/motion/skill-scroll-schedule.ts"
  );
  const schedule = createSkillScrollSchedule({
    entryViewportRatio: 0.2,
    exitViewportRatio: 0.1,
    groupBottom: 1400,
    groupTop: 1000,
    items: [
      { exit: 1050, top: 1000 },
      { exit: 1050, top: 1000 },
      { exit: 1100, top: 1050 },
      { exit: 1100, top: 1050 },
    ],
    staggerUnits: 0.4,
    transitionUnits: 0.5,
    viewportHeight: 500,
  });

  assert.equal(schedule.length, 4);
  assert.ok(
    Math.abs(schedule[0].entryStart - 600) < 0.000001,
    "first icon starts when Skills reaches the 80% entry line",
  );
  assert.ok(
    Math.abs(schedule[3].entryEnd - 1000) < 0.000001,
    "last icon finishes when Skills bottom reaches the 80% entry line",
  );
  assert.ok(schedule[1].entryStart > schedule[0].entryStart);
  assert.ok(schedule[1].exitStart > schedule[0].exitStart);
  assert.match(skillsMotionSource, /scrub:\s*SKILL_SCRUB_SECONDS/);
  assert.match(skillsMotionSource, /ease:\s*"none"/);
  assert.doesNotMatch(skillsMotionSource, /SKILL_STAGGER_SECONDS/);
  assert.doesNotMatch(skillsMotionSource, /createSequentialDelayQueue/);
});

test("Skills timelines materialize schedule durations before GSAP placement", () => {
  assert.match(skillsMotionSource, /const entryDuration =/);
  assert.match(skillsMotionSource, /const readingDuration =/);
  assert.match(skillsMotionSource, /const exitDuration =/);
  assert.doesNotMatch(
    skillsMotionSource,
    /function createSkillsMotion[\s\S]*duration:\s*\(\)\s*=>/,
  );
});

test("footer shows the exact design credit", () => {
  assert.match(footerSource, /Design &amp; built by Mark Jommer/);
  assert.doesNotMatch(footerSource, /© 2026 Jopy-Dev/);
  assert.match(indexHtml, /Design &amp; built by Mark Jommer/);
  assert.doesNotMatch(indexHtml, /© 2026 Jopy-Dev/);
});

test("footer Jopy-Dev links to jopy.dev with the GitHub link treatment", () => {
  assert.match(
    indexHtml,
    /<a class="site-footer__home" href="https:\/\/jopy\.dev" target="_blank" rel="noopener noreferrer">Jopy-Dev<svg/,
  );
  for (const state of [
    /\.site-footer__home,\s*\.site-footer__github \{\s*position: relative;/,
    /\.site-footer__home svg,\s*\.site-footer__github svg \{/,
    /\.site-footer__home::after,\s*\.site-footer__github::after \{/,
    /\.site-footer__home:is\(:hover, :focus-visible\)::after,\s*\.site-footer__github:is\(:hover, :focus-visible\)::after \{/,
  ]) {
    assert.match(sectionStyles, state);
  }
});

test("project-link icon draws once per hover or focus activation", () => {
  assert.match(sectionStyles, /\.project-row svg path/);
  assert.match(sectionStyles, /stroke-dasharray:/);
  assert.match(sectionStyles, /stroke-dashoffset:/);
  assert.match(
    sectionStyles,
    /\.project-row:is\(:hover, :focus-visible\) svg path/,
  );
});

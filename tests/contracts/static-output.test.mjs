import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  getFeaturedProject,
  getProjectStaticParams,
  getSectionNavigation,
} from "../../apps/site/src/content/portfolio.ts";
import { navigateToSection } from "../../apps/site/src/lib/section-click-navigation.ts";
import { isWordmarkClearOfTitle } from "../../apps/site/src/lib/viewport-navigation.ts";

const outRoot = path.resolve("apps", "site", "out");
const expectedSections = ["hero", "profile", "skills", "projects", "contact"];
const expectedNavigation = expectedSections.map((section) => `#${section}`);
const [indexHtml, notFoundHtml] = await Promise.all([
  readFile(path.join(outRoot, "index.html"), "utf8"),
  readFile(path.join(outRoot, "404.html"), "utf8"),
]);
const bubbleSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "motion",
    "bubble-cursor-trail.tsx",
  ),
  "utf8",
);
const tokenSource = await readFile(
  path.resolve("apps", "site", "src", "styles", "tokens.css"),
  "utf8",
);
const sectionNavigationSource = await readFile(
  path.resolve("apps", "site", "src", "lib", "section-click-navigation.ts"),
  "utf8",
);
const headerViewSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "layout",
    "site-header.tsx",
  ),
  "utf8",
);
const headerSource =
  headerViewSource +
  (await readFile(
    path.resolve("apps/site/src/components/layout/use-header-navigation.ts"),
    "utf8",
  ));
const headerStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "header.css"),
  "utf8",
);
const heroStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "hero.css"),
  "utf8",
);
const liquidLinkSource = await readFile(
  path.resolve("apps", "site", "src", "components", "ui", "liquid-link.tsx"),
  "utf8",
);
const heroSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "sections",
    "hero-section.tsx",
  ),
  "utf8",
);
const responsiveStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "responsive.css"),
  "utf8",
);
const iconsSource = await readFile(
  path.resolve("apps", "site", "src", "components", "ui", "icons.tsx"),
  "utf8",
);
const sectionMotionSource = (
  await Promise.all([
    readFile(
      path.resolve(
        "apps",
        "site",
        "src",
        "components",
        "motion",
        "section-scroll-motion.tsx",
      ),
      "utf8",
    ),
    readFile(
      path.resolve(
        "apps",
        "site",
        "src",
        "components",
        "motion",
        "viewport-region.ts",
      ),
      "utf8",
    ),
    readFile(
      path.resolve(
        "apps",
        "site",
        "src",
        "components",
        "motion",
        "viewport-reveal.ts",
      ),
      "utf8",
    ),
    readFile(
      path.resolve(
        "apps",
        "site",
        "src",
        "components",
        "motion",
        "skill-scroll-schedule.ts",
      ),
      "utf8",
    ),
    readFile(
      path.resolve(
        "apps",
        "site",
        "src",
        "components",
        "motion",
        "skill-scroll-motion.ts",
      ),
      "utf8",
    ),
  ])
).join("\n");
const viewportEffectsSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "motion",
    "viewport-effects.tsx",
  ),
  "utf8",
);
const motionStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "motion.css"),
  "utf8",
);
const sectionStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "sections.css"),
  "utf8",
);
const contactStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "contact.css"),
  "utf8",
);
const contactDir = path.resolve("apps", "site", "src", "components", "contact");
const contactSource = (
  await Promise.all(
    ["contact-form.tsx", "use-contact-submission.ts"].map((file) =>
      readFile(path.join(contactDir, file), "utf8"),
    ),
  )
).join("\n");
const revealSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "ui",
    "cta-click-reveal.tsx",
  ),
  "utf8",
);
const revealStyles = await readFile(
  path.resolve("apps", "site", "src", "styles", "cta-click-reveal.css"),
  "utf8",
);
const projectDetailSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "projects",
    "project-detail-page.tsx",
  ),
  "utf8",
);
const profileSource = await readFile(
  path.resolve(
    "apps",
    "site",
    "src",
    "components",
    "sections",
    "profile-section.tsx",
  ),
  "utf8",
);
const sitemapSource = await readFile(
  path.resolve("apps", "site", "src", "app", "sitemap.ts"),
  "utf8",
);
const nextConfigSource = await readFile(
  path.resolve("apps", "site", "next.config.ts"),
  "utf8",
);

test("static homepage preserves exact section and navigation order", () => {
  const sectionIds = [
    ...indexHtml.matchAll(/<section\b[^>]*\bid="([^"]+)"/g),
  ].map((match) => match[1]);
  const navigation = indexHtml.match(
    /<nav\b[^>]*\bid="site-menu"[\s\S]*?<\/nav>/,
  )?.[0];
  assert.ok(navigation, "primary navigation must exist");
  const navigationHrefs = [
    ...navigation.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.deepEqual(sectionIds, expectedSections);
  assert.deepEqual(navigationHrefs, expectedNavigation);
});

test("static recovery and approved project remain public", () => {
  assert.match(indexHtml, /href="\/projects\/topspin\/"/);
  assert.doesNotMatch(
    indexHtml,
    /Selected work will appear here after review\./,
  );
  const hero = indexHtml.match(
    /<section[^>]*id="hero"[\s\S]*?<\/section>/,
  )?.[0];
  assert.ok(hero);
  assert.match(
    hero,
    /<div class="hero__action"><p class="availability"><span aria-hidden="true"><\/span><span class="availability__text"><span>Open to global remote opportunities<\/span><span>Flexible across time zones<\/span><\/span><\/p><a class="liquid-button"/,
  );
  assert.doesNotMatch(hero, /Available for full-time opportunities/);
  assert.match(
    hero,
    /<span class="hero__tagline"><span>I build and ship web apps end to end — database,<\/span> <span>auth, API, and the UI people actually use\.<\/span><\/span>/,
  );
  assert.match(hero, /Based in Metro Manila, PH \(GMT\+8\)/);
  assert.match(
    indexHtml,
    /<p><span class="profile__label">Looking for:<\/span> A mid-level full-stack role/,
  );
  assert.match(
    indexHtml,
    /<p>I(?:&#x27;|')ve been building software professionally for 7\+ years, including 6\+ years focused on web development/,
  );
  assert.doesNotMatch(indexHtml, /This site runs on Cloudflare Workers/);
  assert.doesNotMatch(hero, /href="#projects"/);
  assert.match(notFoundHtml, /href="\/"/);
  assert.match(notFoundHtml, /href="\/#contact"/);
});

test("contact form submits natively by POST so fields never enter the URL", () => {
  // Before hydration, or without JavaScript, the browser submits the form
  // itself; a GET would copy name, email, and message into the query string.
  const form = indexHtml.match(/<form[^>]*class="contact-form"[^>]*>/)?.[0];
  assert.ok(form, "contact form missing from static homepage");
  assert.match(form, /\smethod="post"/);
});

test("local dev cannot generate Markdown outside the public allowlist", () => {
  assert.match(nextConfigSource, /agentRules:\s*false/);
});

test("section navigation cycles through all five sections and returns to Hero", () => {
  const expected = [
    ["hero", { target: "profile", label: "Profile", direction: "down" }],
    ["profile", { target: "skills", label: "Skills", direction: "down" }],
    ["skills", { target: "projects", label: "Projects", direction: "down" }],
    ["projects", { target: "contact", label: "Contact", direction: "down" }],
    ["contact", { target: "hero", label: "Up Hero", direction: "up" }],
  ];

  for (const [activeSection, navigation] of expected) {
    assert.deepEqual(getSectionNavigation(activeSection), navigation);
  }
});

test("server output starts with clear wordmark and centered Profile cue", () => {
  assert.match(indexHtml, /data-wordmark-visible="true"/);
  assert.match(indexHtml, /data-active-section="hero"/);
  assert.match(indexHtml, /data-target-section="profile"/);
  assert.match(indexHtml, /data-direction="down"/);
});

test("compiled section cue preserves horizontal centering when press feedback is enabled", async () => {
  const href = indexHtml.match(/href="([^"]+\.css)"/)?.[1];
  assert.ok(href, "static stylesheet must exist");
  const css = await readFile(path.join(outRoot, href), "utf8");
  const cueRule = css.match(/\.section-cue\{([^}]+)\}/)?.[1];
  assert.ok(cueRule, "compiled section cue rule must exist");
  assert.match(
    cueRule,
    /(?:translate:-50%|transform:[^;]*translate(?:X|3d)?\(-50%)/,
  );
});

test("wordmark hides at title overlap and returns only after clearance", () => {
  assert.equal(isWordmarkClearOfTitle(true, 101, 100), true);
  assert.equal(isWordmarkClearOfTitle(true, 100, 100), false);
  assert.equal(isWordmarkClearOfTitle(false, 108, 100), false);
  assert.equal(isWordmarkClearOfTitle(false, 109, 100), true);
  assert.equal(isWordmarkClearOfTitle(false, -200, 100), false);
});

test("Bubble trail preserves source behavior with downward-only Y physics", () => {
  assert.match(indexHtml, /class="bubble-cursor-trail"/);
  assert.match(bubbleSource, /Math\.floor\(Math\.random\(\) \* 60 \+ 60\)/);
  assert.match(bubbleSource, /baseDimension: 4/);
  assert.match(
    bubbleSource,
    /createParticle\(\s*cursorPositionRef\.current\.x,\s*cursorPositionRef\.current\.y,\s*\)/s,
  );
  assert.match(bubbleSource, /document\.body\.addEventListener\("mousemove"/);
  assert.match(bubbleSource, /y: 0\.4 \+ Math\.random\(\)/);
  assert.match(bubbleSource, /velocity\.y \+= Math\.random\(\) \/ 600/);
  assert.doesNotMatch(bubbleSource, /velocity\.y -=|y: -0\.4/);
  assert.doesNotMatch(
    bubbleSource,
    /canvas\.remove\(\)/,
    "React must retain ownership of the Bubble canvas across Strict Mode effect cleanup",
  );
  assert.match(tokenSource, /--color-bubble-fill: #e6f1f7/);
  assert.match(tokenSource, /--color-bubble-stroke: #3a92c5/);
});

test("navigation, menu wordmark, spacing, and section cue shape stay locked", () => {
  assert.match(sectionNavigationSource, /targetId !== HERO_SECTION_ID/);
  assert.match(sectionNavigationSource, /\.section-heading/);
  assert.match(sectionNavigationSource, /window\.scrollTo/);
  assert.match(sectionNavigationSource, /window\.history\.pushState/);
  assert.match(headerSource, /open \|\| pageWordmarkVisible/);
  assert.match(headerSource, /wordmarkRef\.current,[\s\S]*toggleRef\.current/);
  assert.match(headerSource, /handleNavigation\(event, "hero"\)/);
  assert.match(headerStyles, /\.wordmark\[data-menu-open="true"\]/);
  assert.match(headerStyles, /min-height: 12rem/);
  assert.match(headerStyles, /padding: 5\.5rem/);
  assert.match(responsiveStyles, /padding: 6rem 1\.5rem 1\.5rem/);
  assert.match(
    heroStyles,
    /\.section-cue \{[\s\S]*width: 4\.75rem;[\s\S]*height: 4\.75rem;[\s\S]*border-radius: 50%;/,
  );
});

test("exact-title landing ignores an active GSAP entrance translation", () => {
  let scrolledTop;
  const heading = {
    getBoundingClientRect: () => ({ top: 500 }),
  };
  const section = {
    addEventListener: () => {},
    focus: () => {},
    querySelector: () => heading,
    removeAttribute: () => {},
    tabIndex: 0,
  };
  const originalDocument = globalThis.document;
  const originalGetComputedStyle = globalThis.getComputedStyle;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalWindow = globalThis.window;

  globalThis.document = {
    getElementById: (id) => (id === "projects" ? section : null),
  };
  globalThis.getComputedStyle = () => ({
    transform: "matrix(1, 0, 0, 1, 0, 56)",
  });
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  globalThis.window = {
    history: { pushState: () => {}, replaceState: () => {} },
    location: { hash: "#skills" },
    matchMedia: () => ({ matches: false }),
    scrollTo: ({ top }) => {
      scrolledTop = top;
    },
    scrollY: 1000,
  };

  try {
    navigateToSection("projects");
    assert.equal(scrolledTop, 1444);
  } finally {
    globalThis.document = originalDocument;
    globalThis.getComputedStyle = originalGetComputedStyle;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.window = originalWindow;
  }
});

test("section mark, viewport motion, progress rail, and press feedback stay locked", () => {
  assert.match(iconsSource, /viewBox="0 0 25 28\.929"/);
  assert.equal((iconsSource.match(/<path d=\{petal\}/g) ?? []).length, 6);
  assert.match(sectionStyles, /width: 1\.5625rem/);
  assert.match(sectionStyles, /height: 1\.808rem/);
  assert.match(
    sectionStyles,
    /animation: section-mark-rotation 7s linear infinite/,
  );
  assert.match(sectionStyles, /animation-play-state: paused/);
  assert.match(sectionMotionSource, /import\("gsap\/ScrollTrigger"\)/);
  assert.match(sectionMotionSource, /#skills \.skill-group/);
  assert.match(sectionMotionSource, /SKILL_ITEM_SELECTOR = "#skills \.skill"/);
  assert.match(sectionMotionSource, /\[data-motion-project-row\]/);
  assert.match(
    sectionMotionSource,
    /const targets = section\.querySelectorAll\(FOCUS_SAFE_SELECTOR\);[\s\S]*if \(targets\.length === 0\) return;[\s\S]*gsap\.set\(targets/,
  );
  assert.match(motionStyles, /top: 50svh/);
  assert.match(motionStyles, /right: 2%/);
  assert.match(motionStyles, /width: 0\.375rem/);
  assert.match(motionStyles, /height: 6\.25rem/);
  assert.match(
    viewportEffectsSource,
    /translateY\(-\$\{\(1 - progress\) \* 100\}%\)/,
  );
  assert.match(
    headerStyles,
    /transition: visibility 0s linear var\(--duration-reveal\)/,
  );
  assert.match(liquidLinkSource, /playPressFeedback\(event.currentTarget\)/);
  assert.match(contactSource, /playPressFeedback\(event.currentTarget\)/);
});

test("required content uses stable per-target viewport reveals", () => {
  assert.match(sectionMotionSource, /function createDirectionalReveal/);
  assert.match(sectionMotionSource, /#profile \.social-links/);
  assert.match(sectionMotionSource, /#profile \.profile__visual/);
  assert.match(sectionMotionSource, /\.site-footer > \*/);
  assert.match(sectionMotionSource, /exitBoundary: "top"/);
  assert.match(
    responsiveStyles,
    /\.site-footer \{[\s\S]*padding-bottom: calc\(6\.5rem \+ env\(safe-area-inset-bottom\)\)/,
  );
  assert.match(profileSource, /loading="eager"/);
  assert.match(
    sectionMotionSource,
    /for \(const \[index, skill\] of skills\.entries\(\)\)/,
  );
  assert.match(sectionMotionSource, /getLayoutDocumentTop\(target\)/);
  assert.match(sectionMotionSource, /end: "bottom 10%"/);
  assert.doesNotMatch(
    sectionMotionSource,
    /function createProfileMotion(?:(?!function createSkillsMotion)[\s\S])*scrub:/,
  );
  assert.match(sectionMotionSource, /scrub: SKILL_SCRUB_SECONDS/);
  assert.doesNotMatch(
    sectionMotionSource,
    /function createContactMotion(?:(?!export type ViewportRegion)[\s\S])*scrub:/,
  );
});

test("viewport reveals mirror both edges and Skills items enter one by one", () => {
  assert.match(sectionMotionSource, /const SKILL_STAGGER_UNITS = 0\.4/);
  assert.match(sectionMotionSource, /const SKILL_TRANSITION_UNITS = 0\.5/);
  assert.match(
    sectionMotionSource,
    /for \(const \[index, skill\] of skills\.entries\(\)\)/,
  );
  assert.match(
    sectionMotionSource,
    /function createContactMotion[\s\S]*?enterY: 50,[\s\S]*?exitY: -50/,
  );
  assert.match(
    sectionMotionSource,
    /FOOTER_REVEAL_SELECTOR[\s\S]*?enterY: 40,[\s\S]*?exitY: -40/,
  );
  assert.match(
    sectionMotionSource,
    /const activeElement = document\.activeElement;[\s\S]*?target\.contains\(activeElement\)/,
  );
  assert.doesNotMatch(sectionMotionSource, /persistent(?:\?:| =|: true)/);
});

test("Skills use one global scroll schedule with explicit edge geometry", () => {
  assert.match(sectionMotionSource, /function createSkillScrollSchedule/);
  assert.match(
    sectionMotionSource,
    /const skills = gsap\.utils\.toArray<HTMLElement>\(SKILL_ITEM_SELECTOR\)/,
  );
  assert.match(sectionMotionSource, /const SKILL_ENTRY_VIEWPORT_RATIO = 0\.2/);
  assert.match(sectionMotionSource, /const SKILL_EXIT_VIEWPORT_RATIO = 0\.1/);
  assert.match(sectionMotionSource, /scrub: SKILL_SCRUB_SECONDS/);
  assert.match(sectionMotionSource, /ease: "none"/);
  assert.doesNotMatch(sectionMotionSource, /createSequentialDelayQueue/);
  assert.match(sectionMotionSource, /const VIEWPORT_EDGE_RATIO = 0\.1/);
  assert.match(
    sectionMotionSource,
    /import \{ getLayoutDocumentTop \} from "@\/lib\/section-click-navigation"/,
  );
  assert.match(
    sectionMotionSource,
    /start: \(\) =>[\s\S]*?getViewportEntryScrollPosition\([\s\S]*?targetTop: getLayoutDocumentTop\(target\)/,
  );
  assert.match(sectionMotionSource, /viewportHeight \* \(1 - edgeRatio\)/);
  assert.match(sectionMotionSource, /maxScroll - viewportHeight \* edgeRatio/);
  assert.match(
    sectionMotionSource,
    /end: \(\) =>[\s\S]*?getExitScrollPosition\(target, exitBoundary\)/,
  );
  assert.doesNotMatch(sectionMotionSource, /top 88%|top 100%/);
  assert.match(
    sectionMotionSource,
    /for \(const heading of headings\)[\s\S]*?enterY: 90,[\s\S]*?exitY: -90/,
  );
  assert.match(
    sectionMotionSource,
    /function createProjectsMotion[\s\S]*?enterY: 72,[\s\S]*?exitY: -72/,
  );
});

test("Skills progress individually and all reveals share one edge band", () => {
  assert.match(sectionMotionSource, /const SKILL_STAGGER_UNITS = 0\.4/);
  assert.match(sectionMotionSource, /const SKILL_SCRUB_SECONDS = 0\.5/);
  assert.match(sectionMotionSource, /const VIEWPORT_EDGE_RATIO = 0\.1/);
  assert.match(
    sectionMotionSource,
    /for \(const heading of headings\)[\s\S]*?enterY: 90,[\s\S]*?exitY: -90/,
  );
  assert.doesNotMatch(sectionMotionSource, /exitBoundaryRatio/);
  assert.doesNotMatch(sectionMotionSource, /SKILL_STAGGER_SECONDS/);
});

test("Skills schedule is deterministic without mutable delay queues", async () => {
  const { createSkillScrollSchedule } = await import(
    "../../apps/site/src/components/motion/skill-scroll-schedule.ts"
  );
  const input = {
    entryViewportRatio: 0.2,
    exitViewportRatio: 0.1,
    groupBottom: 1400,
    groupTop: 1000,
    items: [
      { exit: 1050, top: 1000 },
      { exit: 1050, top: 1000 },
      { exit: 1100, top: 1050 },
    ],
    staggerUnits: 0.4,
    transitionUnits: 0.5,
    viewportHeight: 500,
  };
  const first = createSkillScrollSchedule(input);
  const second = createSkillScrollSchedule(input);

  assert.deepEqual(first, second);
  assert.ok(
    first.every(
      (item, index) =>
        index === 0 || item.entryStart > first[index - 1].entryStart,
    ),
  );
  assert.ok(
    first.every(
      (item, index) =>
        index === 0 || item.exitStart > first[index - 1].exitStart,
    ),
  );
});

test("Hero CTA keeps its hover label swap alongside the click reveal", () => {
  assert.match(tokenSource, /--duration-cta-hover: 300ms/);
  assert.match(heroStyles, /--liquid-button-width: 13rem/);
  assert.match(heroStyles, /border-radius: var\(--radius-round\)/);
  for (const className of [
    "liquid-button__fill",
    "liquid-button__label--rest",
    "liquid-button__label--hover",
    "liquid-button__click-window",
  ]) {
    assert.match(liquidLinkSource, new RegExp(className));
  }
  assert.match(heroSource, /hoverLabel="Contact me"/);
  assert.match(
    heroStyles,
    /\.liquid-button:is\(:hover, :focus-visible, :active\) \.liquid-button__fill[\s\S]*scale\(44\)/,
  );
  assert.match(
    heroStyles,
    /\.liquid-button:is\(:hover, :focus-visible, :active\)[\s\S]*\.liquid-button__label--rest[\s\S]*translateX\(4rem\)/,
  );
  assert.match(liquidLinkSource, /playPressFeedback\(event.currentTarget\)/);
  assert.match(tokenSource, /--press-scale: 0\.96/);
  assert.doesNotMatch(
    liquidLinkSource,
    /liquid-button__arrow-orb|liquid-button__arrow-track|ArrowUpRightIcon/,
  );
});

test("Contact CTA hides its resting fill and sweeps a curved left-to-right reveal", () => {
  assert.match(tokenSource, /--duration-contact-fill: 420ms/);
  assert.match(contactSource, /activationSequence/);
  assert.match(contactSource, /submit-button__fill/);
  assert.match(contactSource, /submit-button__outline/);
  assert.match(contactSource, /submit-button__click-window/);
  assert.match(
    contactSource,
    /submit-button__label--filled" aria-hidden="true"/,
  );
  assert.match(contactStyles, /clip-path: circle\(0 at 0% 50%\)/);
  assert.match(
    contactStyles,
    /\.submit-button__label--filled[\s\S]*clip-path: circle\(0 at 0% 50%\)/,
  );
  assert.match(
    contactStyles,
    /\.submit-button:is\(:hover, :focus-visible, \.is-activated\)[\s\S]*?:is\(\.submit-button__fill, \.submit-button__label--filled\)[\s\S]*clip-path: circle\(150% at 0% 50%\)/,
  );
  assert.match(
    contactStyles,
    /\.submit-button:is\(:hover, :focus-visible, \.is-activated\)[\s\S]*?\.submit-button__outline \{[\s\S]*?transition-delay: var\(--duration-contact-outline-delay\)/,
  );
  assert.doesNotMatch(
    contactSource,
    /submit-button__orb|submit-button__click-arrow|ArrowRightIcon/,
  );
});

test("CTA decoration preserves native control semantics", () => {
  assert.match(liquidLinkSource, /<a[\s\S]*className=\{`liquid-button/);
  assert.match(
    liquidLinkSource,
    /liquid-button__label--hover" aria-hidden="true"/,
  );
  assert.doesNotMatch(liquidLinkSource, /<button/);
  assert.match(contactSource, /<button[\s\S]*type="submit"/);
  assert.match(revealSource, /aria-hidden="true"/);
  assert.match(revealSource, /event.target === event.currentTarget/);
});

test("CTA click replaces the visible word with directional SVG chevrons", () => {
  assert.match(liquidLinkSource, /direction="down"/);
  assert.match(liquidLinkSource, /label=\{activationLabel\}/);
  assert.match(contactSource, /direction="up"/);
  assert.match(contactSource, /label="Send message"/);
  assert.equal((revealSource.match(/<path /g) ?? []).length, 2);
  assert.match(revealSource, /focusable="false"/);
  assert.match(revealStyles, /--cta-exit-y: -150%/);
  assert.match(revealStyles, /--cta-entry-y: 100%/);
  assert.match(revealStyles, /--cta-exit-y: 150%/);
  assert.match(revealStyles, /--cta-entry-y: -100%/);
  assert.match(revealStyles, /rotate\(180deg\)/);
  assert.match(revealStyles, /scaleY\(0\)/);
  assert.match(revealStyles, /scale\(1\.5\)/);
});

test("Hero CTA navigation stays bounded and Contact actions stay immediate", () => {
  assert.match(tokenSource, /--duration-cta-flip: 500ms/);
  assert.match(
    tokenSource,
    /--ease-cta-flip: cubic-bezier\(0\.4, 0, 0\.2, 1\)/,
  );
  assert.match(revealSource, /window.setTimeout\(onComplete, 650\)/);
  assert.match(revealSource, /window.clearTimeout\(fallback\)/);
  assert.match(
    revealSource,
    /removeEventListener\("change", finishOnReduction\)/,
  );
  assert.match(liquidLinkSource, /navigateToSection\(pendingNavigation\)/);
  assert.match(liquidLinkSource, /prefers-reduced-motion: reduce/);
  assert.match(contactSource, /prefers-reduced-motion: reduce/);
  // Valid submissions start immediately; only validation gates the reveal.
  assert.match(
    contactSource,
    /Object\.keys\(fieldErrors\)\.length === 0 && !prefersReducedMotion\(\)/,
  );
  assert.doesNotMatch(contactSource, /preview only/i);
  assert.doesNotMatch(contactSource, /setTimeout/);
  assert.match(
    liquidLinkSource,
    /event.metaKey[\s\S]*event.ctrlKey[\s\S]*event.shiftKey[\s\S]*event.altKey/,
  );
});

test("project preview choices and renamed route metadata stay in sync", async () => {
  const previews = {
    topspin: "dashboard.webp",
    "canva-clone": "dashboard.webp",
    "zoom-clone": "dashboard.webp",
    "durable-impact-academy": "landing.webp",
    "local-notes": "split-side-by-side.webp",
    "ai-powered-resume": "screen-2.webp",
    "figma-clone": "screen-1.webp",
    "online-notes-management": "screen-1.webp",
  };
  for (const [slug, filename] of Object.entries(previews)) {
    const project = getFeaturedProject(slug);
    assert.equal(project.previewImage, `/assets/projects/${slug}/${filename}`);
    const html = await readFile(
      path.join(outRoot, "projects", slug, "index.html"),
      "utf8",
    );
    assert.ok(html.includes(`<h1>${project.title}</h1>`));
    assert.ok(html.includes(`<title>${project.title} | Jopy Dev</title>`));
    assert.ok(
      html.includes(
        `content="https://portfolio.jopy.dev${project.previewImage}"`,
      ),
    );
  }
  assert.equal(
    getFeaturedProject("topspin").galleryImages[0].src,
    "/assets/projects/topspin/landing.webp",
  );
  assert.equal(
    getFeaturedProject("local-notes").galleryImages[0].src,
    "/assets/projects/local-notes/source.webp",
  );
});

test("homepage title and description lead with web engineering", () => {
  const title = "Mark Jommer | Full-stack TypeScript Developer";
  const description =
    "Full-stack developer in Metro Manila (GMT+8) shipping secure TypeScript web apps with React, Next.js, Node.js, and PostgreSQL. Open to global remote work.";
  assert.ok(description.length <= 155, "description fits search snippet");
  assert.ok(indexHtml.includes(`<title>${title}</title>`));
  for (const tag of [
    `<meta name="description" content="${description}"/>`,
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
  ]) {
    assert.ok(indexHtml.includes(tag), tag);
  }
  assert.doesNotMatch(indexHtml, /AI Automation Engineer<\/title>/);
  assert.ok(
    indexHtml.includes('"jobTitle":"Full-stack Developer"'),
    "structured data job title",
  );
});

test("public metadata uses the portfolio.jopy.dev canonical origin", async () => {
  const origin = "https://portfolio.jopy.dev";
  const [robots, sitemap] = await Promise.all([
    readFile(path.join(outRoot, "robots.txt"), "utf8"),
    readFile(path.join(outRoot, "sitemap.xml"), "utf8"),
  ]);
  assert.match(
    indexHtml,
    /<link rel="canonical" href="https:\/\/portfolio\.jopy\.dev\/"\/>/,
  );
  assert.ok(
    indexHtml.includes(`"url":"${origin}"`),
    "Person structured data url",
  );
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(robots.includes(`Host: ${origin}`));
  assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
  // The apex site appears only as outbound new-tab links (Profile Website +
  // footer Jopy-Dev); head metadata and structured data must never use it.
  const head = indexHtml.match(/<head>[\s\S]*?<\/head>/)?.[0];
  const structuredData = [
    ...indexHtml.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => match[1]);
  assert.ok(head, "document head must exist");
  assert.equal(structuredData.length, 1);
  const apexLinks =
    /<a (?:class="site-footer__home" )?href="https:\/\/jopy\.dev" target="_blank" rel="(?:noreferrer|noopener noreferrer)">/g;
  assert.equal(indexHtml.match(apexLinks)?.length, 2);
  assert.doesNotMatch(
    `${head}${structuredData.join("")}${robots}${sitemap}`,
    /https:\/\/jopy\.dev/,
    "bare apex origin must not appear in public metadata",
  );
  await assert.rejects(readFile(path.join(outRoot, "CNAME"), "utf8"));
});

test("forced-colors rules target only rendered CTA and surface elements", () => {
  const forced = responsiveStyles.match(
    /@media \(forced-colors: active\) \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(forced, "forced-colors block missing");
  assert.doesNotMatch(forced, /liquid-button__orb/);
  assert.match(
    forced,
    /\.submit-button,\s*\.turnstile-shell,\s*\.profile__plate \{\s*border: var\(--border-hairline\) solid CanvasText;/,
  );
});

test("project detail title uses the specified scale and balanced two-line wrapping", async () => {
  const styles = await readFile(
    path.resolve("apps/site/src/styles/project-detail.css"),
    "utf8",
  );
  const rule = styles.match(/\.project-detail__header h1 \{[^}]*\}/)?.[0];
  assert.ok(rule, "project detail title rule missing");
  assert.match(rule, /font-size: clamp\(3\.5rem, 8vw, 4\.5rem\);/);
  assert.match(rule, /max-width: 16ch;/);
  assert.match(rule, /text-wrap: balance;/);
  assert.doesNotMatch(rule, /11ch|7rem/);
});

test("approved project details export only supplied content", async () => {
  assert.deepEqual(getProjectStaticParams(), [
    { slug: "topspin" },
    { slug: "canva-clone" },
    { slug: "zoom-clone" },
    { slug: "durable-impact-academy" },
    { slug: "local-notes" },
    { slug: "ai-powered-resume" },
    { slug: "figma-clone" },
    { slug: "online-notes-management" },
  ]);
  assert.equal(getFeaturedProject("not-approved"), undefined);
  assert.match(projectDetailSource, /Back to Projects/);
  assert.match(projectDetailSource, /ProjectGallery project=\{project\}/);
  assert.match(projectDetailSource, /project\.liveUrl/);
  assert.match(projectDetailSource, /project\.sourceUrl/);
  assert.match(sitemapSource, /FEATURED_PROJECTS\.map/);
  const html = await readFile(
    path.join(outRoot, "projects/topspin/index.html"),
    "utf8",
  );
  assert.match(html, /Tech Stack/);
  assert.match(html, /Key Features/);
  assert.match(html, /https:\/\/top-spin.gr\//);
  assert.doesNotMatch(
    html,
    /<dt>Year|<dt>My Role|Technical Highlights|section-cue/,
  );
  assert.match(html, /https:\/\/portfolio\.jopy\.dev\/projects\/topspin\//);
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.ok(gallery);
  assert.equal((gallery.match(/<img /g) ?? []).length, 3);
  assert.equal(getFeaturedProject("topspin").keyFeatures.length, 7);
});

test("Canva Clone publishes supplied details and three gallery images", async () => {
  const project = getFeaturedProject("canva-clone");
  assert.ok(project, "Second approved project must be present");
  assert.equal(project.technologies.length, 13);
  assert.equal(project.keyFeatures.length, 9);
  assert.equal(project.technicalHighlights.length, 11);
  const html = await readFile(
    path.join(outRoot, "projects/canva-clone/index.html"),
    "utf8",
  );
  assert.match(html, /Canva Clone/);
  assert.match(html, /Technical Highlights/);
  assert.match(html, /Fabric\.js/);
  assert.match(html, /https:\/\/canva-clone-ali\.vercel\.app\//);
  assert.match(html, /https:\/\/portfolio\.jopy\.dev\/projects\/canva-clone\//);
  assert.doesNotMatch(html, /<dt>Year|<dt>My Role|section-cue/);
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.equal((gallery?.match(/<img /g) ?? []).length, 3);
  assert.match(indexHtml, /href="\/projects\/canva-clone\/"/);
});

test("Zoom Clone publishes third approved record and supplied gallery", async () => {
  const project = getFeaturedProject("zoom-clone");
  assert.ok(project, "Third approved project must be present");
  assert.equal(project.title, "Zoom Clone");
  assert.equal(project.technologies.length, 8);
  assert.equal(project.keyFeatures.length, 11);
  assert.equal(project.technicalHighlights.length, 10);
  assert.equal(project.liveUrl, "https://zoom-clone-iota-six.vercel.app/");
  const html = await readFile(
    path.join(outRoot, "projects/zoom-clone/index.html"),
    "utf8",
  );
  assert.match(html, /Technical Highlights/);
  assert.match(html, /Stream Video SDK/);
  assert.match(html, /https:\/\/portfolio\.jopy\.dev\/projects\/zoom-clone\//);
  assert.doesNotMatch(html, /section-cue|<dt>My Role|<dt>Year/);
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.equal((gallery?.match(/<img /g) ?? []).length, 3);
  assert.match(indexHtml, /href="\/projects\/zoom-clone\/"/);
});

test("Online Notes Management exports eighth record and ordered gallery", async () => {
  const project = getFeaturedProject("online-notes-management");
  assert.ok(project, "Eighth approved project must be present");
  assert.equal(project.title, "Online Notes Management");
  assert.equal(project.technologies.length, 8);
  assert.equal(project.keyFeatures.length, 8);
  assert.equal(project.technicalHighlights.length, 8);
  assert.equal(project.liveUrl, "https://notes-crud-2025.vercel.app/");
  const html = await readFile(
    path.join(outRoot, "projects/online-notes-management/index.html"),
    "utf8",
  );
  assert.match(
    html,
    /href="https:\/\/notes-crud-2025\.vercel\.app\/" target="_blank" rel="noreferrer"/,
  );
  assert.match(
    html,
    /https:\/\/portfolio\.jopy\.dev\/projects\/online-notes-management\//,
  );
  assert.match(html, /Next.js 15.5.4, React 19.1/);
  assert.doesNotMatch(
    html,
    /<dt>Installation|<dt>Usage|View source code|section-cue/,
  );
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.ok(gallery);
  assert.deepEqual(
    [...gallery.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]),
    project.galleryImages.map((image) => image.src),
  );
  assert.match(indexHtml, /href="\/projects\/online-notes-management\/"/);
});

test("Figma Clone exports seventh record and supplied editor gallery", async () => {
  const project = getFeaturedProject("figma-clone");
  assert.ok(project, "Seventh approved project must be present");
  assert.equal(project.title, "Figma Clone (Vanilla JavaScript)");
  assert.equal(project.technologies.length, 8);
  assert.equal(project.keyFeatures.length, 12);
  assert.equal(project.technicalHighlights.length, 11);
  assert.equal(project.liveUrl, "https://figclo.vercel.app/");
  const html = await readFile(
    path.join(outRoot, "projects/figma-clone/index.html"),
    "utf8",
  );
  assert.match(
    html,
    /href="https:\/\/figclo\.vercel\.app\/" target="_blank" rel="noreferrer"/,
  );
  assert.match(html, /https:\/\/portfolio\.jopy\.dev\/projects\/figma-clone\//);
  assert.match(html, /10%–400%/);
  assert.doesNotMatch(
    html,
    /<dt>Installation|<dt>Usage|View source code|section-cue/,
  );
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.ok(gallery);
  assert.deepEqual(
    [...gallery.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]),
    project.galleryImages.map((image) => image.src),
  );
  assert.match(indexHtml, /href="\/projects\/figma-clone\/"/);
});

test("AI Powered Resume exports sixth record and ordered supplied gallery", async () => {
  const project = getFeaturedProject("ai-powered-resume");
  assert.ok(project, "Sixth approved project must be present");
  assert.equal(project.title, "AI Powered Resume");
  assert.equal(project.technologies.length, 9);
  assert.equal(project.keyFeatures.length, 8);
  assert.equal(project.technicalHighlights.length, 8);
  assert.equal(project.liveUrl, "https://resume-roaster.vercel.app/");
  const html = await readFile(
    path.join(outRoot, "projects/ai-powered-resume/index.html"),
    "utf8",
  );
  assert.match(
    html,
    /href="https:\/\/resume-roaster\.vercel\.app\/" target="_blank" rel="noreferrer"/,
  );
  assert.match(
    html,
    /https:\/\/portfolio\.jopy\.dev\/projects\/ai-powered-resume\//,
  );
  assert.match(html, /upload → analysis → tailoring/);
  assert.match(html, /PDF &amp; DOCX Support/);
  assert.doesNotMatch(
    html,
    /<dt>Installation|<dt>Usage|View source code|section-cue/,
  );
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.ok(gallery);
  assert.deepEqual(
    [...gallery.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]),
    project.galleryImages.map((image) => image.src),
  );
  assert.match(indexHtml, /href="\/projects\/ai-powered-resume\/"/);
});

test("Offline Local Notes exports source-only link and optional usage facts", async () => {
  const project = getFeaturedProject("local-notes");
  assert.ok(project, "Fifth approved project must be present");
  assert.equal(project.title, "Offline Local Notes (Desktop)");
  assert.equal(project.technologies.length, 9);
  assert.equal(project.keyFeatures.length, 8);
  assert.equal(project.technicalHighlights.length, 9);
  assert.equal(project.sourceUrl, "https://github.com/Jopy-Dev/local-notes");
  assert.equal(project.liveUrl, undefined);
  const html = await readFile(
    path.join(outRoot, "projects/local-notes/index.html"),
    "utf8",
  );
  const facts = html.match(
    /<dl class="project-detail__facts">[\s\S]*?<\/dl>/,
  )?.[0];
  assert.ok(facts);
  assert.deepEqual(
    [...facts.matchAll(/<dt>(.*?)<\/dt>/g)].map((match) => match[1]),
    [
      "Tech Stack",
      "Description",
      "Installation",
      "Usage",
      "Key Features",
      "Technical Highlights",
    ],
  );
  assert.match(facts, /<dd>npx local-notes<\/dd>/);
  assert.match(facts, /<dd>Local URL: http:\/\/127\.0\.0\.1:8989<\/dd>/);
  assert.match(
    html,
    /href="https:\/\/github\.com\/Jopy-Dev\/local-notes" target="_blank" rel="noreferrer"/,
  );
  assert.match(html, /View source code/);
  assert.doesNotMatch(
    html,
    /View live project|href="http:\/\/127\.0\.0\.1:8989|section-cue/,
  );
  assert.match(html, /https:\/\/portfolio\.jopy\.dev\/projects\/local-notes\//);
  assert.match(indexHtml, /href="\/projects\/local-notes\/"/);
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.ok(gallery);
  assert.deepEqual(
    [...gallery.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]),
    project.galleryImages.map((image) => image.src),
  );
  for (const slug of [
    "topspin",
    "canva-clone",
    "zoom-clone",
    "durable-impact-academy",
  ]) {
    const previous = await readFile(
      path.join(outRoot, "projects", slug, "index.html"),
      "utf8",
    );
    assert.doesNotMatch(previous, /<dt>Installation<\/dt>|<dt>Usage<\/dt>/);
  }
});

test("Durable Impact Academy publishes fourth approved record and gallery", async () => {
  const project = getFeaturedProject("durable-impact-academy");
  assert.ok(project, "Fourth approved project must be present");
  assert.equal(project.technologies.length, 9);
  assert.equal(project.keyFeatures.length, 11);
  assert.equal(project.technicalHighlights.length, 10);
  assert.equal(project.liveUrl, "https://www.durableimpactacademy.com/");
  const html = await readFile(
    path.join(outRoot, "projects/durable-impact-academy/index.html"),
    "utf8",
  );
  assert.match(html, /Durable Impact Academy/);
  assert.match(html, /Technical Highlights/);
  assert.match(html, /English\/French localized routes/);
  assert.match(
    html,
    /https:\/\/portfolio\.jopy\.dev\/projects\/durable-impact-academy\//,
  );
  assert.doesNotMatch(html, /section-cue|<dt>My Role|<dt>Year/);
  const gallery = html.match(
    /<figure class="project-detail__gallery">[\s\S]*?<\/figure>/,
  )?.[0];
  assert.equal((gallery?.match(/<img /g) ?? []).length, 3);
  assert.match(indexHtml, /href="\/projects\/durable-impact-academy\/"/);
});

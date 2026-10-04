import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const outRoot = path.join(root, "apps", "site", "out");
const expectedSections = ["hero", "profile", "skills", "projects", "contact"];
const expectedHrefs = expectedSections.map((section) => `#${section}`);
const expectedSkillFiles = [
  "chat-gpt.svg",
  "claude.svg",
  "csharp.svg",
  "css.svg",
  "expressjs-light.svg",
  "file-type-reactjs.svg",
  "git.svg",
  "glm-v.svg",
  "go.svg",
  "html.svg",
  "java.svg",
  "javascript.svg",
  "kimi.svg",
  "nextjs-solid.svg",
  "node-js.svg",
  "numpy.svg",
  "pandas-icon.svg",
  "playwright.svg",
  "postgresql.svg",
  "python.svg",
  "rest-api.svg",
  "rust.svg",
  "scikitlearn.svg",
  "sql.svg",
  "tailwind-css.svg",
  "tensorflow.svg",
  "typescript.svg",
  "visualbasic.svg",
].sort();

const index = await readFile(path.join(outRoot, "index.html"), "utf8");
const notFound = await readFile(path.join(outRoot, "404.html"), "utf8");
const bubbleSource = await readFile(
  path.join(
    root,
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
  path.join(root, "apps", "site", "src", "styles", "tokens.css"),
  "utf8",
);
const sectionNavigationSource = await readFile(
  path.join(root, "apps", "site", "src", "lib", "section-click-navigation.ts"),
  "utf8",
);
const headerViewSource = await readFile(
  path.join(
    root,
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
  path.join(root, "apps", "site", "src", "styles", "header.css"),
  "utf8",
);
const heroStyles = await readFile(
  path.join(root, "apps", "site", "src", "styles", "hero.css"),
  "utf8",
);
const liquidLinkSource = await readFile(
  path.join(root, "apps", "site", "src", "components", "ui", "liquid-link.tsx"),
  "utf8",
);
const iconsSource = await readFile(
  path.join(root, "apps", "site", "src", "components", "ui", "icons.tsx"),
  "utf8",
);
const sectionMotionSource = (
  await Promise.all([
    readFile(
      path.join(
        root,
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
      path.join(
        root,
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
      path.join(
        root,
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
      path.join(
        root,
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
      path.join(
        root,
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
  path.join(
    root,
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
  path.join(root, "apps", "site", "src", "styles", "motion.css"),
  "utf8",
);
const sectionStyles = await readFile(
  path.join(root, "apps", "site", "src", "styles", "sections.css"),
  "utf8",
);
const contactStyles = await readFile(
  path.join(root, "apps", "site", "src", "styles", "contact.css"),
  "utf8",
);
const contactDir = path.join(
  root,
  "apps",
  "site",
  "src",
  "components",
  "contact",
);
const contactSource = (
  await Promise.all(
    ["contact-form.tsx", "use-contact-submission.ts"].map((file) =>
      readFile(path.join(contactDir, file), "utf8"),
    ),
  )
).join("\n");
const revealSource = await readFile(
  path.join(
    root,
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
  path.join(root, "apps", "site", "src", "styles", "cta-click-reveal.css"),
  "utf8",
);
const projectDetailSource = await readFile(
  path.join(
    root,
    "apps",
    "site",
    "src",
    "components",
    "projects",
    "project-detail-page.tsx",
  ),
  "utf8",
);
const sitemapSource = await readFile(
  path.join(root, "apps", "site", "src", "app", "sitemap.ts"),
  "utf8",
);
const sectionIds = [...index.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(
  (match) => match[1],
);
assertArray(sectionIds, expectedSections, "homepage section order");

const menu = index.match(/<nav\b[^>]*\bid="site-menu"[\s\S]*?<\/nav>/)?.[0];
if (!menu) throw new Error("Primary navigation missing from static output.");
const menuHrefs = [...menu.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(
  (match) => match[1],
);
assertArray(menuHrefs, expectedHrefs, "homepage navigation order");

assertIncludes(index, 'href="/projects/topspin/"', "approved TopSpin project");
assertIncludes(
  index,
  "Open to global remote opportunities",
  "Hero availability status",
);
assertIncludes(index, "Flexible across time zones", "Hero time-zone status");
assertIncludes(index, 'data-wordmark-visible="true"', "wordmark clear state");
assertIncludes(
  index,
  'data-target-section="profile"',
  "initial section cue target",
);
assertIncludes(index, 'data-direction="down"', "initial section cue direction");
assertIncludes(index, 'data-menu-open="false"', "closed menu wordmark state");
assertIncludes(index, 'class="bubble-cursor-trail"', "Bubble cursor canvas");
if (
  !/createParticle\(\s*cursorPositionRef\.current\.x,\s*cursorPositionRef\.current\.y,\s*\)/s.test(
    bubbleSource,
  )
) {
  throw new Error("eased decorative-cursor Bubble origin missing.");
}
assertIncludes(bubbleSource, "y: 0.4 + Math.random()", "downward initial Y");
assertIncludes(
  bubbleSource,
  "particle.velocity.y += Math.random() / 600",
  "downward Y acceleration",
);
assertIncludes(tokenSource, "--color-bubble-fill: #e6f1f7", "Bubble fill");
assertIncludes(tokenSource, "--color-bubble-stroke: #3a92c5", "Bubble stroke");
assertIncludes(
  sectionNavigationSource,
  "targetId !== HERO_SECTION_ID",
  "Hero landing exception",
);
assertIncludes(
  sectionNavigationSource,
  'querySelector<HTMLElement>(".section-heading")',
  "exact section-title target",
);
assertIncludes(
  sectionNavigationSource,
  "scrollToDestination(destinationTop, immediate)",
  "exact-title scroll",
);
assertIncludes(
  headerSource,
  "open || pageWordmarkVisible",
  "open-menu wordmark override",
);
assertIncludes(
  headerSource,
  "wordmarkRef.current",
  "wordmark focus-trap membership",
);
assertIncludes(
  headerStyles,
  '.wordmark[data-menu-open="true"]',
  "menu wordmark style",
);
assertIncludes(headerStyles, "min-height: 12rem", "lowered desktop menu");
assertIncludes(heroStyles, "width: 4.75rem", "circular cue width");
assertIncludes(heroStyles, "height: 4.75rem", "circular cue height");
assertIncludes(heroStyles, "border-radius: 50%", "circular cue shape");
assertIncludes(
  iconsSource,
  'viewBox="0 0 25 28.929"',
  "six-petal mark viewBox",
);
if ((iconsSource.match(/<path d=\{petal\}/g) ?? []).length !== 6) {
  throw new Error("Section mark must contain exactly six teardrop petals.");
}
assertIncludes(sectionStyles, "width: 1.5625rem", "section mark width");
assertIncludes(sectionStyles, "height: 1.808rem", "section mark height");
assertIncludes(
  sectionStyles,
  "animation: section-mark-rotation 7s linear infinite",
  "section mark duration",
);
assertIncludes(
  sectionMotionSource,
  'import("gsap/ScrollTrigger")',
  "ScrollTrigger motion",
);
assertIncludes(
  sectionMotionSource,
  'const SKILL_HEADING_SELECTOR = "#skills .skill-group h3"',
  "Skills category geometry",
);
assertIncludes(
  sectionMotionSource,
  'const SKILL_ITEM_SELECTOR = "#skills .skill"',
  "individual Skills motion",
);
assertIncludes(
  sectionMotionSource,
  "[data-motion-project-row]",
  "individual project motion",
);
assertIncludes(
  sectionMotionSource,
  "function createDirectionalReveal",
  "stable per-target viewport reveal",
);
assertIncludes(
  sectionMotionSource,
  "#profile .social-links",
  "Profile social-link visibility owner",
);
assertIncludes(
  sectionMotionSource,
  "#profile .profile__visual",
  "Profile visual visibility owner",
);
assertIncludes(
  sectionMotionSource,
  "for (const [index, skill] of skills.entries())",
  "individual Skills geometry",
);
assertIncludes(
  sectionMotionSource,
  "const SKILL_STAGGER_UNITS = 0.4",
  "Skills stagger cadence",
);
assertIncludes(
  sectionMotionSource,
  "const SKILL_TRANSITION_UNITS = 0.5",
  "Skills transition cadence",
);
assertIncludes(
  sectionMotionSource,
  "const SKILL_SCRUB_SECONDS = 0.5",
  "Skills scrub smoothing",
);
assertIncludes(
  sectionMotionSource,
  "function createSkillScrollSchedule",
  "global Skills scroll schedule",
);
assertIncludes(
  sectionMotionSource,
  "for (const [index, skill] of skills.entries())",
  "individual Skills timeline ownership",
);
assertIncludes(
  sectionMotionSource,
  "scrub: SKILL_SCRUB_SECONDS",
  "scroll-linked Skills sequence",
);
assertIncludes(
  sectionMotionSource,
  "const SKILL_ENTRY_VIEWPORT_RATIO = 0.2",
  "Skills lower entry band",
);
assertIncludes(
  sectionMotionSource,
  "const SKILL_EXIT_VIEWPORT_RATIO = 0.1",
  "Skills upper exit band",
);
assertIncludes(sectionMotionSource, 'ease: "none"', "linear Skills motion");
for (const prohibitedSkillsBatch of [
  "createSequentialDelayQueue",
  "skillShowQueue",
  "skillHideQueue",
  "SKILL_STAGGER_SECONDS",
]) {
  if (sectionMotionSource.includes(prohibitedSkillsBatch)) {
    throw new Error(
      `Grouped Skills sequence remains: ${prohibitedSkillsBatch}`,
    );
  }
}
assertIncludes(
  sectionMotionSource,
  "const VIEWPORT_EDGE_RATIO = 0.1",
  "equal viewport edge ratio",
);
assertIncludes(
  sectionMotionSource,
  "getLayoutDocumentTop(target)",
  "transform-neutral viewport trigger geometry",
);
assertIncludes(
  sectionMotionSource,
  "getViewportEntryScrollPosition",
  "reachability-clamped bottom viewport trigger",
);
assertIncludes(
  sectionMotionSource,
  "viewportHeight * (1 - edgeRatio)",
  "equal bottom viewport trigger ratio",
);
assertIncludes(
  sectionMotionSource,
  "maxScroll - viewportHeight * edgeRatio",
  "document-end viewport reachability",
);
assertIncludes(
  sectionMotionSource,
  "getExitScrollPosition(target, exitBoundary)",
  "equal top viewport trigger geometry",
);
if (sectionMotionSource.includes("exitBoundaryRatio")) {
  throw new Error("Viewport edge ratio override remains.");
}
for (const asymmetricStart of ["top 88%", "top 100%"])
  if (sectionMotionSource.includes(asymmetricStart))
    throw new Error(`Asymmetric viewport trigger remains: ${asymmetricStart}`);
assertIncludes(
  sectionMotionSource,
  "exitY: -50",
  "Contact mirrored viewport exit",
);
assertIncludes(
  sectionMotionSource,
  "exitY: -40",
  "Skills/footer mirrored viewport exit",
);
if (sectionMotionSource.includes("persistent")) {
  throw new Error("Entrance-only viewport motion remains.");
}
assertIncludes(
  sectionMotionSource,
  "target.contains(activeElement)",
  "focused viewport target visibility",
);
for (const supersededMotion of [
  'trigger: "#profile"',
  'gsap.to("#skills .skill-groups"',
  'gsap.from(".site-footer > *"',
]) {
  if (sectionMotionSource.includes(supersededMotion)) {
    throw new Error(`Superseded scrubbed reveal: ${supersededMotion}`);
  }
}
assertIncludes(motionStyles, "top: 50svh", "centered progress rail");
assertIncludes(motionStyles, "right: 2%", "progress rail right inset");
assertIncludes(motionStyles, "width: 0.375rem", "progress rail width");
assertIncludes(motionStyles, "height: 6.25rem", "progress rail height");
assertIncludes(
  viewportEffectsSource,
  "translateY(-$" + "{(1 - progress) * 100}%)",
  "translated progress fill",
);
assertIncludes(
  headerStyles,
  "transition: visibility 0s linear var(--duration-reveal)",
  "reversible menu close visibility",
);
assertIncludes(
  liquidLinkSource,
  "playPressFeedback(event.currentTarget)",
  "Hero CTA press feedback",
);
assertIncludes(
  tokenSource,
  "--duration-cta-hover: 300ms",
  "CTA hover duration",
);
assertIncludes(
  tokenSource,
  "--duration-cta-flip: 500ms",
  "CTA click reveal duration",
);
assertIncludes(
  tokenSource,
  "--ease-cta-flip: cubic-bezier(0.4, 0, 0.2, 1)",
  "CTA click reveal easing",
);
assertIncludes(
  tokenSource,
  "--duration-contact-fill: 420ms",
  "Contact left-to-right fill duration",
);
assertIncludes(heroStyles, "--liquid-button-width: 13rem", "Hero pill width");
assertIncludes(
  liquidLinkSource,
  "liquid-button__label--hover",
  "Hero Contact me hover label",
);
assertIncludes(liquidLinkSource, "liquid-button__fill", "Hero expanding dot");
assertIncludes(
  liquidLinkSource,
  "liquid-button__click-window",
  "Hero click reveal window",
);
assertIncludes(heroStyles, "scale(44)", "Hero expanding dot coverage");
assertIncludes(liquidLinkSource, 'direction="down"', "Hero downward reveal");
assertIncludes(
  revealStyles,
  "--cta-entry-y: -100%",
  "Hero incoming layer above",
);
assertIncludes(revealStyles, "inset: 0", "Full-height click clip");
assertIncludes(
  liquidLinkSource,
  "pendingNavigationRef",
  "Hero bounded post-animation navigation",
);
assertIncludes(
  revealSource,
  "window.setTimeout(onComplete, 650)",
  "Bounded animation fallback",
);
assertIncludes(
  contactSource,
  "playPressFeedback(event.currentTarget)",
  "submit press feedback",
);
assertIncludes(
  contactSource,
  "activationSequence",
  "Contact repeatable activation sequence",
);
assertIncludes(
  contactSource,
  "submit-button__click-window",
  "Contact click reveal window",
);
assertIncludes(
  contactStyles,
  "clip-path: circle(0 at 0% 50%)",
  "Contact hidden resting fill",
);
assertIncludes(
  contactStyles,
  "clip-path: circle(150% at 0% 50%)",
  "Contact curved left-to-right fill",
);
assertIncludes(
  contactStyles,
  "transition-delay: var(--duration-contact-outline-delay)",
  "Contact midpoint outline highlight",
);
assertIncludes(contactSource, 'direction="up"', "Contact upward reveal");
assertIncludes(
  revealStyles,
  "--cta-entry-y: 100%",
  "Contact incoming layer below",
);
for (const supersededCta of [
  "--liquid-orb-travel",
  "--liquid-label-travel",
  "--duration-cta-arrow",
  "--duration-submit-arrow",
  "getNearestPointerEntryDirection",
  "data-entry-direction",
  "submit-fill-start",
  "liquid-button__arrow-orb",
  "liquid-button__arrow-track",
  "submit-button__orb",
  "submit-button__click-arrow",
]) {
  if (
    heroStyles.includes(supersededCta) ||
    liquidLinkSource.includes(supersededCta) ||
    contactSource.includes(supersededCta) ||
    contactStyles.includes(supersededCta) ||
    tokenSource.includes(supersededCta)
  ) {
    throw new Error(`Superseded CTA behavior remains: ${supersededCta}`);
  }
}
assertIncludes(
  projectDetailSource,
  "Back to Projects",
  "project detail recovery",
);
assertIncludes(
  projectDetailSource,
  "ProjectGallery project={project}",
  "approved project gallery",
);
assertIncludes(
  sitemapSource,
  "FEATURED_PROJECTS.map",
  "project sitemap mapping",
);
if (index.includes("Selected work will appear here after review.")) {
  throw new Error(
    "Empty Projects state rendered despite approved TopSpin record.",
  );
}
for (const prohibitedBubbleChange of [
  "this.velocity.y -=",
  "y: -0.4",
  "MAX_PARTICLES",
  "emitDistance",
]) {
  if (bubbleSource.includes(prohibitedBubbleChange)) {
    throw new Error(`Prohibited Bubble change: ${prohibitedBubbleChange}`);
  }
}
assertIncludes(notFound, 'href="/"', "404 Home recovery");
assertIncludes(notFound, 'href="/#contact"', "404 Contact recovery");
assertIncludes(
  index,
  "Mark Jommer | Full-stack Engineer &amp; AI Automation Engineer",
  "exact title",
);
assertIncludes(
  index,
  "Full-stack engineer in Metro Manila building production-grade web applications, secure backend systems, and AI-driven automation.",
  "exact description",
);

for (const prohibited of [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "scikit-learn.svg",
  "rest-api-mit.svg",
  "sql-mit.svg",
]) {
  if (index.includes(prohibited))
    throw new Error(`Prohibited public output value: ${prohibited}`);
}

const skillFiles = (
  await readdir(path.join(outRoot, "assets", "icons", "skills"))
).sort();
assertArray(skillFiles, expectedSkillFiles, "approved skill asset set");
for (const filename of ["css.svg", "go.svg", "scikitlearn.svg"]) {
  assertIncludes(index, `/assets/icons/skills/${filename}`, "user skill icon");
}
process.stdout.write("STATIC_CONTRACTS_PASS\n");

function assertArray(actual, expected, label) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(
      `${label} mismatch. Actual=${JSON.stringify(actual)} Expected=${JSON.stringify(expected)}`,
    );
  }
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) throw new Error(`${label} missing.`);
}

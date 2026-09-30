import type { HomepageSectionId } from "@/content/portfolio";

const HERO_SECTION_ID: HomepageSectionId = "hero";

type SectionScroller = (top: number, immediate?: boolean) => void;
let sectionScroller: SectionScroller | null = null;

export function registerSectionScroller(scroller: SectionScroller): () => void {
  sectionScroller = scroller;
  return () => {
    if (sectionScroller === scroller) sectionScroller = null;
  };
}

export function usesExactHeadingLanding(targetId: HomepageSectionId): boolean {
  return targetId !== HERO_SECTION_ID;
}

export function scrollToPageTop(): void {
  scrollToDestination(0, true);
}

export function navigateToSection(
  targetId: HomepageSectionId,
  immediate = false,
): void {
  const section = document.getElementById(targetId);
  if (!section) return;

  const heading = usesExactHeadingLanding(targetId)
    ? section.querySelector<HTMLElement>(".section-heading")
    : null;
  const destinationTop = heading
    ? getLayoutDocumentTop(heading)
    : window.scrollY + section.getBoundingClientRect().top;
  const hash = `#${targetId}`;

  if (window.location.hash !== hash) {
    window.history.pushState(null, "", hash);
  }
  scrollToDestination(destinationTop, immediate);

  focusSection(section, immediate);
}

export function usesNativeSectionActivation(event: {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  currentTarget: { target: string };
}): boolean {
  const modified = [
    event.metaKey,
    event.ctrlKey,
    event.shiftKey,
    event.altKey,
  ].some(Boolean);
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    modified ||
    Boolean(
      event.currentTarget.target && event.currentTarget.target !== "_self",
    )
  );
}

function scrollToDestination(destinationTop: number, immediate = false) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: destinationTop, behavior: "auto" });
    return;
  }
  if (sectionScroller) {
    sectionScroller(destinationTop, immediate);
  } else {
    window.scrollTo({
      top: destinationTop,
      behavior: immediate ? "instant" : "smooth",
    });
  }
}

export function getLayoutDocumentTop(destination: HTMLElement): number {
  const transformedTop = destination.getBoundingClientRect().top;
  const translateY = getTranslateY(getComputedStyle(destination).transform);
  return window.scrollY + transformedTop - translateY;
}

function getTranslateY(transform: string): number {
  if (transform === "none") return 0;

  const values = transform
    .slice(transform.indexOf("(") + 1, -1)
    .split(",")
    .map(Number);
  const translateYIndex = transform.startsWith("matrix3d(") ? 13 : 5;
  const translateY = values[translateYIndex];
  return typeof translateY === "number" && Number.isFinite(translateY)
    ? translateY
    : 0;
}

function focusSection(section: HTMLElement, immediate: boolean): void {
  const focus = () => {
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
    section.addEventListener(
      "blur",
      () => section.removeAttribute("tabindex"),
      { once: true },
    );
  };
  if (immediate) focus();
  else requestAnimationFrame(focus);
}

import { getLayoutDocumentTop } from "@/lib/section-click-navigation";
import {
  getViewportEntryScrollPosition,
  getViewportRegion,
} from "./viewport-region";

const VIEWPORT_EDGE_RATIO = 0.1;

type Gsap = typeof import("gsap")["gsap"];
type ScrollTriggerApi = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];

type RevealOptions = {
  enterY: number;
  exitBoundary?: "bottom" | "top";
  exitY: number;
};

export function createDirectionalReveal(
  gsap: Gsap,
  ScrollTrigger: ScrollTriggerApi,
  target: HTMLElement,
  { enterY, exitBoundary = "bottom", exitY }: RevealOptions,
) {
  const show = (fromY: number) => {
    gsap.killTweensOf(target);
    if (isFocusProtected(target)) {
      gsap.set(target, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      target,
      { opacity: 0, y: fromY },
      {
        opacity: 1,
        y: 0,
        duration: 0.48,
        ease: "power3.out",
        overwrite: true,
      },
    );
  };
  const hide = (toY: number) => {
    if (isFocusProtected(target)) {
      gsap.killTweensOf(target);
      gsap.set(target, { opacity: 1, y: 0 });
      return;
    }
    gsap.killTweensOf(target);
    gsap.to(target, {
      opacity: 0,
      y: toY,
      duration: 0.36,
      ease: "power2.in",
      overwrite: true,
    });
  };

  const syncToViewport = () => {
    const layoutTop = getLayoutDocumentTop(target);
    const layoutExit =
      exitBoundary === "top" ? layoutTop : layoutTop + target.offsetHeight;
    const maxScroll = getMaxScroll();
    const region = getViewportRegion({
      targetTop: layoutTop,
      targetExit: layoutExit,
      scrollTop: window.scrollY,
      viewportHeight: window.innerHeight,
      edgeRatio: VIEWPORT_EDGE_RATIO,
      maxScroll,
    });
    const focusInside = isFocusProtected(target);
    gsap.killTweensOf(target);
    if (focusInside || region === "inside") {
      gsap.set(target, { opacity: 1, y: 0 });
    } else if (region === "before") {
      gsap.set(target, { opacity: 0, y: enterY });
    } else {
      gsap.set(target, { opacity: 0, y: exitY });
    }
  };

  syncToViewport();

  ScrollTrigger.create({
    trigger: target,
    start: () =>
      getViewportEntryScrollPosition({
        targetTop: getLayoutDocumentTop(target),
        viewportHeight: window.innerHeight,
        edgeRatio: VIEWPORT_EDGE_RATIO,
        maxScroll: getMaxScroll(),
      }),
    end: () => getExitScrollPosition(target, exitBoundary),
    invalidateOnRefresh: true,
    onEnter: () => show(enterY),
    onEnterBack: () => show(exitY),
    onLeave: () => hide(exitY),
    onLeaveBack: () => hide(enterY),
    onRefresh: syncToViewport,
  });
}

function isFocusProtected(target: HTMLElement): boolean {
  const activeElement = document.activeElement;
  return Boolean(
    activeElement &&
      (target.contains(activeElement) ||
        (activeElement.matches(".section") && activeElement.contains(target))),
  );
}

function getMaxScroll() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

function getExitScrollPosition(
  target: HTMLElement,
  exitBoundary: "bottom" | "top",
) {
  const layoutTop = getLayoutDocumentTop(target);
  const layoutExit =
    exitBoundary === "top" ? layoutTop : layoutTop + target.offsetHeight;
  return layoutExit - window.innerHeight * VIEWPORT_EDGE_RATIO;
}

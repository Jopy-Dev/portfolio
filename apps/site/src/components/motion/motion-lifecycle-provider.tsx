"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { PRELOADER_RELEASED_EVENT } from "@/components/motion/motion-events";
import { registerSectionScroller } from "@/lib/section-click-navigation";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const LENIS_LERP = 0.1;
const LENIS_DURATION_SECONDS = 1.4;
const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_GSAP_LAG_THRESHOLD_MS = 500;
const DEFAULT_GSAP_ADJUSTED_LAG_MS = 33;

type LenisInstance = InstanceType<typeof import("lenis").default>;
type Gsap = typeof import("gsap")["gsap"];
type ScrollTriggerApi = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];

type MotionRuntime = {
  gsap: Gsap;
  lenis: LenisInstance;
  removeScrollListener: () => void;
  removeSectionScroller: () => void;
  ScrollTrigger: ScrollTriggerApi;
  tickLenis: (timeSeconds: number) => void;
};

export function MotionLifecycleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const preference = window.matchMedia(MOTION_QUERY);
    let disposed = false;
    let suspended = document.hidden;
    let generation = 0;
    let refreshFrame = 0;
    let runtime: MotionRuntime | null = null;
    const runtimeCanStart = () =>
      !disposed && !suspended && !preference.matches && runtime === null;

    const refreshLayout = () => {
      refreshFrame = 0;
      runtime?.lenis.resize();
      runtime?.ScrollTrigger.refresh();
    };
    const scheduleRefresh = () => {
      if (refreshFrame) cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(refreshLayout);
    };
    const destroyRuntime = () => {
      generation += 1;
      if (!runtime) return;
      const {
        gsap,
        lenis,
        removeScrollListener,
        removeSectionScroller,
        tickLenis,
      } = runtime;
      runtime = null;
      removeScrollListener();
      removeSectionScroller();
      gsap.ticker.remove(tickLenis);
      gsap.ticker.lagSmoothing(
        DEFAULT_GSAP_LAG_THRESHOLD_MS,
        DEFAULT_GSAP_ADJUSTED_LAG_MS,
      );
      lenis.destroy();
      document.documentElement.removeAttribute("data-motion-enhanced");
    };
    const startRuntime = async () => {
      if (!runtimeCanStart()) return;
      const requestedGeneration = ++generation;
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
      if (requestedGeneration !== generation || !runtimeCanStart()) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({
        lerp: LENIS_LERP,
        duration: LENIS_DURATION_SECONDS,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        anchors: false,
        respectReducedMotion: true,
      });
      const updateScrollTrigger = () => ScrollTrigger.update();
      const removeScrollListener = lenis.on("scroll", updateScrollTrigger);
      const removeSectionScroller = registerSectionScroller(
        (top, immediate) => {
          if (immediate) lenis.resize();
          lenis.scrollTo(top, { immediate });
        },
      );
      const tickLenis = (timeSeconds: number) =>
        lenis.raf(timeSeconds * MILLISECONDS_PER_SECOND);
      gsap.ticker.add(tickLenis);
      gsap.ticker.lagSmoothing(0);
      runtime = {
        gsap,
        lenis,
        removeScrollListener,
        removeSectionScroller,
        ScrollTrigger,
        tickLenis,
      };
      document.documentElement.dataset.motionEnhanced = "true";
      scheduleRefresh();
    };
    const resumeRuntime = () => {
      if (preference.matches) return;
      if (!runtime) {
        void startRuntime();
        return;
      }
      runtime.lenis.start();
      scheduleRefresh();
    };
    const handlePreferenceChange = () => {
      if (preference.matches) destroyRuntime();
      else resumeRuntime();
    };
    const handleVisibilityChange = () => {
      suspended = document.hidden;
      if (suspended) runtime?.lenis.stop();
      else resumeRuntime();
    };
    const handlePageHide = (event: PageTransitionEvent) => {
      suspended = true;
      if (event.persisted) runtime?.lenis.stop();
      else destroyRuntime();
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      suspended = false;
      resumeRuntime();
      if (event.persisted) scheduleRefresh();
    };

    preference.addEventListener("change", handlePreferenceChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("load", scheduleRefresh);
    window.addEventListener(PRELOADER_RELEASED_EVENT, scheduleRefresh);
    void document.fonts.ready.then(() => {
      if (!disposed) scheduleRefresh();
    });
    void startRuntime();

    return () => {
      disposed = true;
      if (refreshFrame) cancelAnimationFrame(refreshFrame);
      preference.removeEventListener("change", handlePreferenceChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("load", scheduleRefresh);
      window.removeEventListener(PRELOADER_RELEASED_EVENT, scheduleRefresh);
      destroyRuntime();
    };
  }, []);

  return children;
}

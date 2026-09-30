"use client";

import { type RefObject, useEffect, useState } from "react";
import {
  HOMEPAGE_SECTION_ORDER,
  type HomepageSectionId,
} from "@/content/portfolio";
import { isWordmarkClearOfTitle } from "@/lib/viewport-navigation";

const ACTIVE_SECTION_VIEWPORT_RATIO = 0.4;

type ViewportNavigationState = {
  activeSection: HomepageSectionId;
  wordmarkVisible: boolean;
};

const INITIAL_STATE: ViewportNavigationState = {
  activeSection: "hero",
  wordmarkVisible: true,
};

export function useViewportNavigation(
  wordmarkRef: RefObject<HTMLAnchorElement | null>,
): ViewportNavigationState {
  const [navigation, setNavigation] =
    useState<ViewportNavigationState>(INITIAL_STATE);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const decisionLine = window.innerHeight * ACTIVE_SECTION_VIEWPORT_RATIO;
      const wordmark = wordmarkRef.current;
      const heroTitle = document.querySelector<HTMLElement>(".hero__title");
      let nextSection: HomepageSectionId = "hero";

      for (const sectionId of HOMEPAGE_SECTION_ORDER) {
        const section = document.getElementById(sectionId);
        if (!section || section.getBoundingClientRect().top > decisionLine) {
          break;
        }
        nextSection = sectionId;
      }

      const titleTop = heroTitle?.getBoundingClientRect().top;
      const wordmarkBottom = wordmark?.getBoundingClientRect().bottom;
      setNavigation((current) => {
        const wordmarkVisible =
          titleTop === undefined || wordmarkBottom === undefined
            ? true
            : isWordmarkClearOfTitle(
                current.wordmarkVisible,
                titleTop,
                wordmarkBottom,
              );

        if (
          current.activeSection === nextSection &&
          current.wordmarkVisible === wordmarkVisible
        ) {
          return current;
        }
        return { activeSection: nextSection, wordmarkVisible };
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("pageshow", requestUpdate);
    update();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("pageshow", requestUpdate);
    };
  }, [wordmarkRef]);

  return navigation;
}

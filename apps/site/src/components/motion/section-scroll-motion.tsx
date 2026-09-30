"use client";

import { useEffect, useLayoutEffect } from "react";
import { HOMEPAGE_SECTION_ORDER } from "@/content/portfolio";
import { whenMotionAllowed } from "@/lib/motion-preference";
import { navigateToSection } from "@/lib/section-click-navigation";
import {
  PAGE_ARRIVAL_READY_EVENT,
  PRELOADER_RELEASED_EVENT,
} from "./motion-events";
import { createSkillItemsMotion } from "./skill-scroll-motion";
import { createDirectionalReveal } from "./viewport-reveal";

const HEADING_SELECTOR = ".section-heading";
const PROFILE_REVEAL_SELECTOR =
  "#profile .profile__statement, #profile .profile__copy > p:not(.profile__statement), #profile .profile__meta, #profile .social-links, #profile .profile__visual, #profile .experience > h3, #profile .experience__item";
const SKILL_HEADING_SELECTOR = "#skills .skill-group h3";
const SKILL_ITEM_SELECTOR = "#skills .skill";
const SKILL_GROUPS_SELECTOR = "#skills .skill-groups";
const PROJECT_REVEAL_SELECTOR =
  "#projects .projects__empty, #projects [data-motion-project-row]";
const CONTACT_REVEAL_SELECTOR =
  "#contact .contact__intro, #contact .contact-required, #contact .form-field, #contact .turnstile-shell, #contact .submit-button, #contact .form-status";
const FOOTER_REVEAL_SELECTOR = ".site-footer > *";
const FOCUS_SAFE_SELECTOR =
  ".section-heading, .profile__grid, .profile__copy > *, .profile__visual, .experience > h3, .experience__item, .skill-groups, .skill-group h3, .projects__list, .contact__grid, .form-field, .submit-button";

export function SectionScrollMotion() {
  useLayoutEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const destination = HOMEPAGE_SECTION_ORDER.find(
      (id) => `#${id}` === window.location.hash,
    );
    if (destination) navigateToSection(destination, true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    let disposeArrival = () => {};

    // Hash restore and the arrival signal run on every path; with motion they
    // wait until the scroll triggers exist so the landing measures real layout.
    const wireArrival = (refresh: () => void) => {
      let restoreFrame = 0;
      const restoreHash = () => {
        if (restoreFrame) cancelAnimationFrame(restoreFrame);
        restoreFrame = requestAnimationFrame(() => {
          if (cancelled) return;
          refresh();
          const destination = HOMEPAGE_SECTION_ORDER.find(
            (id) => `#${id}` === window.location.hash,
          );
          if (destination) navigateToSection(destination, true);
          const main = document.getElementById("main-content");
          if (main) main.dataset.arrivalReady = "true";
          window.dispatchEvent(new Event(PAGE_ARRIVAL_READY_EVENT));
        });
      };
      window.addEventListener(PRELOADER_RELEASED_EVENT, restoreHash);
      void document.fonts.ready.then(restoreHash);
      return () => {
        window.removeEventListener(PRELOADER_RELEASED_EVENT, restoreHash);
        cancelAnimationFrame(restoreFrame);
      };
    };

    const initialize = async (withArrival: boolean) => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const headings = gsap.utils.toArray<HTMLElement>(HEADING_SELECTOR);
        let disposeSkills = () => {};
        const context = gsap.context(() => {
          for (const heading of headings) {
            createDirectionalReveal(gsap, ScrollTrigger, heading, {
              enterY: 90,
              exitY: -90,
              exitBoundary: "top",
            });
          }

          createHeroExit(gsap);
          createProfileMotion(gsap, ScrollTrigger);
          disposeSkills = createSkillsMotion(gsap, ScrollTrigger);
          createProjectsMotion(gsap, ScrollTrigger);
          createContactMotion(gsap, ScrollTrigger);
        }, document.body);

        const visibleHeadings = new WeakSet<HTMLElement>();
        const syncHeadingState = (heading: HTMLElement) => {
          heading.classList.toggle(
            "is-motion-active",
            visibleHeadings.has(heading) &&
              document.visibilityState === "visible",
          );
        };
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const heading = entry.target as HTMLElement;
              if (entry.isIntersecting) visibleHeadings.add(heading);
              else visibleHeadings.delete(heading);
              syncHeadingState(heading);
            }
          },
          { rootMargin: "18% 0px 18%", threshold: 0.01 },
        );
        for (const heading of headings) observer.observe(heading);

        const handleVisibility = () => {
          for (const heading of headings) syncHeadingState(heading);
        };
        const handleFocus = (event: FocusEvent) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const section = target.closest<HTMLElement>(".section");
          if (!section) return;
          const targets = section.querySelectorAll(FOCUS_SAFE_SELECTOR);
          if (targets.length === 0) return;
          gsap.killTweensOf(targets);
          gsap.set(targets, {
            opacity: 1,
            y: 0,
          });
        };
        const handlePageShow = () => ScrollTrigger.refresh();
        document.addEventListener("visibilitychange", handleVisibility);
        document.addEventListener("focusin", handleFocus);
        window.addEventListener("pageshow", handlePageShow);

        return () => {
          disposeSkills();
          observer.disconnect();
          document.removeEventListener("visibilitychange", handleVisibility);
          document.removeEventListener("focusin", handleFocus);
          window.removeEventListener("pageshow", handlePageShow);
          for (const heading of headings) {
            heading.classList.remove("is-motion-active");
          }
          context.revert();
        };
      });

      if (withArrival) {
        disposeArrival = wireArrival(() => ScrollTrigger.refresh());
      }
      dispose = () => media.revert();
    };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) disposeArrival = wireArrival(() => {});
    const stopWaiting = whenMotionAllowed(() => void initialize(!reduced));
    return () => {
      cancelled = true;
      stopWaiting();
      disposeArrival();
      dispose();
    };
  }, []);

  return null;
}

type Gsap = typeof import("gsap")["gsap"];
type ScrollTriggerApi = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];

function createHeroExit(gsap: Gsap) {
  gsap.to(".hero__title, .hero__identity, .hero__action, .hero__proof > div", {
    y: -150,
    opacity: 0,
    stagger: 0.02,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "bottom 70%",
      end: "bottom 10%",
      scrub: 1,
    },
  });
}

function createProfileMotion(gsap: Gsap, ScrollTrigger: ScrollTriggerApi) {
  const targets = gsap.utils.toArray<HTMLElement>(PROFILE_REVEAL_SELECTOR);
  for (const target of targets) {
    createDirectionalReveal(gsap, ScrollTrigger, target, {
      enterY: 72,
      exitY: -72,
    });
  }
}

function createSkillsMotion(
  gsap: Gsap,
  ScrollTrigger: ScrollTriggerApi,
): () => void {
  const headings = gsap.utils.toArray<HTMLElement>(SKILL_HEADING_SELECTOR);
  for (const heading of headings) {
    createDirectionalReveal(gsap, ScrollTrigger, heading, {
      enterY: 40,
      exitY: -40,
    });
  }

  const groups = document.querySelector<HTMLElement>(SKILL_GROUPS_SELECTOR);
  const skills = gsap.utils.toArray<HTMLElement>(SKILL_ITEM_SELECTOR);
  if (!groups || skills.length === 0) return () => {};
  return createSkillItemsMotion(gsap, ScrollTrigger, groups, skills);
}

function createProjectsMotion(gsap: Gsap, ScrollTrigger: ScrollTriggerApi) {
  const list = document.querySelector<HTMLElement>(".projects__list");
  if (list) {
    gsap.fromTo(
      list,
      { y: 150, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "power1.out",
        scrollTrigger: {
          trigger: list,
          start: "top bottom",
          end: "top 80%",
          scrub: 1,
          toggleActions: "restart none none reverse",
          invalidateOnRefresh: true,
        },
      },
    );
    return;
  }
  const targets = gsap.utils.toArray<HTMLElement>(PROJECT_REVEAL_SELECTOR);
  for (const target of targets) {
    createDirectionalReveal(gsap, ScrollTrigger, target, {
      enterY: 72,
      exitY: -72,
    });
  }
}

function createContactMotion(gsap: Gsap, ScrollTrigger: ScrollTriggerApi) {
  const contactTargets = gsap.utils.toArray<HTMLElement>(
    CONTACT_REVEAL_SELECTOR,
  );
  for (const target of contactTargets) {
    createDirectionalReveal(gsap, ScrollTrigger, target, {
      enterY: 50,
      exitY: -50,
    });
  }
  const footerTargets = gsap.utils.toArray<HTMLElement>(FOOTER_REVEAL_SELECTOR);
  for (const target of footerTargets) {
    createDirectionalReveal(gsap, ScrollTrigger, target, {
      enterY: 40,
      exitY: -40,
    });
  }
}

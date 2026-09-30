import { getLayoutDocumentTop } from "@/lib/section-click-navigation";
import {
  createSkillScrollSchedule,
  type SkillScrollWindow,
} from "./skill-scroll-schedule";

const SKILL_ENTRY_VIEWPORT_RATIO = 0.2;
const SKILL_EXIT_VIEWPORT_RATIO = 0.1;
const SKILL_STAGGER_UNITS = 0.4;
const SKILL_TRANSITION_UNITS = 0.5;
const SKILL_SCRUB_SECONDS = 0.5;
const MIN_TIMELINE_DURATION = 0.001;

type Gsap = typeof import("gsap")["gsap"];
type ScrollTriggerApi = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];

export function createSkillItemsMotion(
  gsap: Gsap,
  ScrollTrigger: ScrollTriggerApi,
  groups: HTMLElement,
  skills: HTMLElement[],
): () => void {
  let schedule = buildSchedule(groups, skills);
  const rebuildSchedule = () => {
    schedule = buildSchedule(groups, skills);
  };
  const getWindow = (index: number) => requireWindow(schedule, index);

  ScrollTrigger.addEventListener("refreshInit", rebuildSchedule);
  for (const [index, skill] of skills.entries()) {
    createSkillTimeline(gsap, skill, index, getWindow);
  }

  return () =>
    ScrollTrigger.removeEventListener("refreshInit", rebuildSchedule);
}

function buildSchedule(
  groups: HTMLElement,
  skills: HTMLElement[],
): SkillScrollWindow[] {
  const groupTop = getLayoutDocumentTop(groups);
  const items = skills.map((skill) => {
    const top = getLayoutDocumentTop(skill);
    return { top, exit: top + skill.offsetHeight };
  });

  return createSkillScrollSchedule({
    items,
    groupTop,
    groupBottom: groupTop + groups.offsetHeight,
    viewportHeight: window.innerHeight,
    entryViewportRatio: SKILL_ENTRY_VIEWPORT_RATIO,
    exitViewportRatio: SKILL_EXIT_VIEWPORT_RATIO,
    staggerUnits: SKILL_STAGGER_UNITS,
    transitionUnits: SKILL_TRANSITION_UNITS,
  });
}

function requireWindow(
  schedule: SkillScrollWindow[],
  index: number,
): SkillScrollWindow {
  const motionWindow = schedule[index];
  if (!motionWindow) throw new Error("Skills motion schedule is incomplete");
  return motionWindow;
}

function createSkillTimeline(
  gsap: Gsap,
  skill: HTMLElement,
  index: number,
  getWindow: (index: number) => SkillScrollWindow,
) {
  const motionWindow = getWindow(index);
  const entryDuration = motionWindow.entryEnd - motionWindow.entryStart;
  const readingDuration = Math.max(
    MIN_TIMELINE_DURATION,
    motionWindow.exitStart - motionWindow.entryEnd,
  );
  const exitDuration = motionWindow.exitEnd - motionWindow.exitStart;

  gsap
    .timeline({
      scrollTrigger: {
        trigger: skill,
        start: () => getWindow(index).entryStart,
        end: () => getWindow(index).exitEnd,
        scrub: SKILL_SCRUB_SECONDS,
        invalidateOnRefresh: true,
      },
    })
    .fromTo(
      skill,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: entryDuration,
        ease: "none",
      },
    )
    .to(skill, {
      opacity: 1,
      y: 0,
      duration: readingDuration,
      ease: "none",
    })
    .to(skill, {
      opacity: 0,
      y: -40,
      duration: exitDuration,
      ease: "none",
    });
}

"use client";

import type { MouseEvent } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import {
  highlightOutline,
  playPressFeedback,
} from "@/components/ui/press-feedback";
import {
  getSectionNavigation,
  type HomepageSectionId,
  type SectionNavigation,
} from "@/content/portfolio";
import {
  navigateToSection,
  usesNativeSectionActivation,
} from "@/lib/section-click-navigation";

type SectionNavigatorProps = {
  activeSection: HomepageSectionId;
};

export function SectionNavigator({ activeSection }: SectionNavigatorProps) {
  const navigation = getSectionNavigation(activeSection);

  return (
    <a
      className="section-cue"
      href={`#${navigation.target}`}
      aria-label={getCueAriaLabel(navigation)}
      data-active-section={activeSection}
      data-target-section={navigation.target}
      data-direction={navigation.direction}
      onClick={(event) => {
        playPressFeedback(event.currentTarget);
        highlightOutline(
          event.currentTarget.querySelector(".section-cue__outline"),
        );
        handleNavigation(event, navigation.target);
      }}
    >
      <span className="section-cue__outline" aria-hidden="true" />
      <SectionCueContent navigation={navigation} />
    </a>
  );
}

function SectionCueContent({ navigation }: { navigation: SectionNavigation }) {
  return (
    <span
      className="section-cue__content"
      key={`${navigation.target}-${navigation.direction}`}
    >
      <span className="section-cue__icon" aria-hidden="true">
        <ChevronDownIcon />
      </span>
      <span className="section-cue__label">{navigation.label}</span>
    </span>
  );
}

function getCueAriaLabel(navigation: SectionNavigation): string {
  return navigation.direction === "up"
    ? "Return to Hero"
    : `Continue to ${navigation.label}`;
}

function handleNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  targetId: HomepageSectionId,
): void {
  if (usesNativeSectionActivation(event)) return;
  event.preventDefault();
  navigateToSection(targetId);
}

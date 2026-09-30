export type SkillScrollWindow = {
  entryStart: number;
  entryEnd: number;
  exitStart: number;
  exitEnd: number;
};

type SkillLayout = {
  top: number;
  exit: number;
};

type SkillScrollScheduleInput = {
  items: readonly SkillLayout[];
  groupTop: number;
  groupBottom: number;
  viewportHeight: number;
  entryViewportRatio: number;
  exitViewportRatio: number;
  staggerUnits: number;
  transitionUnits: number;
};

export function createSkillScrollSchedule({
  items,
  groupTop,
  groupBottom,
  viewportHeight,
  entryViewportRatio,
  exitViewportRatio,
  staggerUnits,
  transitionUnits,
}: SkillScrollScheduleInput): SkillScrollWindow[] {
  if (items.length === 0) return [];
  validateInputs({
    groupTop,
    groupBottom,
    viewportHeight,
    entryViewportRatio,
    exitViewportRatio,
    staggerUnits,
    transitionUnits,
  });

  const totalUnits = transitionUnits + (items.length - 1) * staggerUnits;
  const unitScroll = (groupBottom - groupTop) / totalUnits;
  const staggerScroll = staggerUnits * unitScroll;
  const transitionScroll = transitionUnits * unitScroll;
  const entryBase = groupTop - viewportHeight * (1 - entryViewportRatio);
  const exitOffset = viewportHeight * exitViewportRatio;
  let previousExitStart = Number.NEGATIVE_INFINITY;

  return items.map((item, index) => {
    const entryStart = entryBase + index * staggerScroll;
    const entryEnd = entryStart + transitionScroll;
    const desiredExitStart = item.exit - exitOffset;
    const exitStart = Math.max(
      desiredExitStart,
      previousExitStart + staggerScroll,
      entryEnd,
    );
    previousExitStart = exitStart;
    return {
      entryStart,
      entryEnd,
      exitStart,
      exitEnd: exitStart + transitionScroll,
    };
  });
}

type ValidatedInputs = Omit<SkillScrollScheduleInput, "items">;

function validateInputs({
  groupTop,
  groupBottom,
  viewportHeight,
  entryViewportRatio,
  exitViewportRatio,
  staggerUnits,
  transitionUnits,
}: ValidatedInputs) {
  requireAscending(groupTop, groupBottom);
  requirePositive(viewportHeight, "viewportHeight");
  requireRatio(entryViewportRatio);
  requireRatio(exitViewportRatio);
  requirePositive(staggerUnits, "staggerUnits");
  requirePositive(transitionUnits, "transitionUnits");
}

function requireAscending(start: number, end: number) {
  if (end > start) return;
  throw new RangeError("groupBottom must be greater than groupTop");
}

function requirePositive(value: number, label: string) {
  if (value > 0) return;
  throw new RangeError(`${label} must be greater than 0`);
}

function requireRatio(value: number) {
  if (value >= 0 && value < 0.5) return;
  throw new RangeError("viewport ratios must be at least 0 and below 0.5");
}

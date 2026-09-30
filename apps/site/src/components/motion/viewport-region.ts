export type ViewportRegion = "before" | "inside" | "after";

type ViewportRegionInput = {
  targetTop: number;
  targetExit: number;
  scrollTop: number;
  viewportHeight: number;
  edgeRatio: number;
  maxScroll: number;
};

type ViewportEntryInput = Pick<
  ViewportRegionInput,
  "targetTop" | "viewportHeight" | "edgeRatio" | "maxScroll"
>;

export function getViewportEntryScrollPosition({
  targetTop,
  viewportHeight,
  edgeRatio,
  maxScroll,
}: ViewportEntryInput): number {
  validateViewport(viewportHeight, edgeRatio, maxScroll);
  const desiredEntry = targetTop - viewportHeight * (1 - edgeRatio);
  const finalViewportEntry = Math.max(
    0,
    maxScroll - viewportHeight * edgeRatio,
  );
  return Math.min(desiredEntry, finalViewportEntry);
}

export function getViewportRegion({
  targetTop,
  targetExit,
  scrollTop,
  viewportHeight,
  edgeRatio,
  maxScroll,
}: ViewportRegionInput): ViewportRegion {
  validateViewport(viewportHeight, edgeRatio, maxScroll);

  const entryScroll = getViewportEntryScrollPosition({
    targetTop,
    viewportHeight,
    edgeRatio,
    maxScroll,
  });
  const upperBoundary = scrollTop + viewportHeight * edgeRatio;
  if (scrollTop < entryScroll) return "before";
  if (targetExit <= upperBoundary) return "after";
  return "inside";
}

function validateViewport(
  viewportHeight: number,
  edgeRatio: number,
  maxScroll: number,
) {
  if (!(edgeRatio >= 0 && edgeRatio < 0.5)) {
    throw new RangeError("edgeRatio must be at least 0 and below 0.5");
  }
  if (!(viewportHeight > 0)) {
    throw new RangeError("viewportHeight must be greater than 0");
  }
  if (!(maxScroll >= 0)) {
    throw new RangeError("maxScroll must be at least 0");
  }
}

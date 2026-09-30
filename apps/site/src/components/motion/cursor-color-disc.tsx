import type { RefObject } from "react";

const CURSOR_COLOR_STAGES = [
  "luminance",
  "floor",
  "restore",
  "pivot",
  "invert",
  "window",
  "gain",
  "curve",
  "palette",
] as const;

type CursorColorDiscProps = { cursorRef: RefObject<HTMLDivElement | null> };

export function CursorColorDisc({ cursorRef }: CursorColorDiscProps) {
  return (
    <div ref={cursorRef} className="decorative-cursor" aria-hidden="true">
      {CURSOR_COLOR_STAGES.map((stage) => (
        <span
          className="decorative-cursor__layer"
          data-cursor-stage={stage}
          key={stage}
        />
      ))}
    </div>
  );
}

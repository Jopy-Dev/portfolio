type CursorPosition = { x: number; y: number };

export function trackPointer(cursor: HTMLDivElement, position: CursorPosition) {
  let targetX = -40;
  let targetY = -40;
  let currentX = -40;
  let currentY = -40;
  let frame = 0;
  const handleMove = (event: PointerEvent) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.style.setProperty("--cursor-opacity", "1");
  };
  const handleLeave = () => {
    cursor.style.setProperty("--cursor-opacity", "0");
  };
  const animate = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    position.x = currentX;
    position.y = currentY;
    cursor.style.setProperty(
      "--cursor-position",
      `translate3d(${currentX}px, ${currentY}px, 0)`,
    );
    frame = requestAnimationFrame(animate);
  };
  window.addEventListener("pointermove", handleMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", handleLeave);
  frame = requestAnimationFrame(animate);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", handleMove);
    document.documentElement.removeEventListener("pointerleave", handleLeave);
  };
}

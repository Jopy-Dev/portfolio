const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";

// Runs `start` once motion is allowed: immediately, or on the first switch
// away from reduced motion. Reduced-motion visitors never download the
// animation code; once started, gsap.matchMedia handles later switches.
export function whenMotionAllowed(start: () => void): () => void {
  const query = window.matchMedia(MOTION_ALLOWED_QUERY);
  if (query.matches) {
    start();
    return () => {};
  }
  const handleChange = () => {
    if (!query.matches) return;
    query.removeEventListener("change", handleChange);
    start();
  };
  query.addEventListener("change", handleChange);
  return () => query.removeEventListener("change", handleChange);
}

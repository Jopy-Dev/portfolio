export const WORDMARK_CLEARANCE_HYSTERESIS_PX = 8;

export function isWordmarkClearOfTitle(
  wasVisible: boolean,
  titleTop: number,
  wordmarkBottom: number,
): boolean {
  const clearance = wasVisible ? 0 : WORDMARK_CLEARANCE_HYSTERESIS_PX;
  return titleTop > wordmarkBottom + clearance;
}

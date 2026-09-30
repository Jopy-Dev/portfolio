// Limits are user-visible characters (code points), not UTF-16 units,
// so an emoji counts once on both client and Worker.
export function codePointLength(value: string): number {
  let count = 0;
  for (const _ of value) count += 1;
  return count;
}

export function withinCodePoints(value: string, min: number, max: number) {
  const length = codePointLength(value);
  return length >= min && length <= max;
}

// Controls and Unicode line/paragraph separators could split email headers
// or disguise content, so single-line fields reject them outright.
const SINGLE_LINE_FORBIDDEN = /[\p{Cc}\p{Zl}\p{Zp}]/u;
const MULTILINE_FORBIDDEN = /(?![\n\t])[\p{Cc}\p{Zl}\p{Zp}]/u;

export function isSafeSingleLine(value: string): boolean {
  return value.isWellFormed() && !SINGLE_LINE_FORBIDDEN.test(value);
}

export function isSafeMultiline(value: string): boolean {
  return value.isWellFormed() && !MULTILINE_FORBIDDEN.test(value);
}

export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

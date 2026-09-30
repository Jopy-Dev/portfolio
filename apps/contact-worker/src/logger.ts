import type { WorkerResponseCode } from "@jopy-dev/contact-contract";

const BUCKETS = [
  [250, "lt_250ms"],
  [500, "lt_500ms"],
  [1_000, "lt_1s"],
  [3_000, "lt_3s"],
  [6_000, "lt_6s"],
  [12_000, "lt_12s"],
] as const;

export type DurationBucket = (typeof BUCKETS)[number][1] | "gte_12s";

export function durationBucket(elapsedMs: number): DurationBucket {
  const match = BUCKETS.find(([limitMs]) => elapsedMs < limitMs);
  return match ? match[1] : "gte_12s";
}

// The only log shape the Worker emits: no names, addresses, message text,
// tokens, client IPs, or destination ever reach logs.
export type LogEntry = {
  event: "contact.accepted" | "contact.outcome";
  requestId: string;
  code: WorkerResponseCode;
  durationBucket: DurationBucket;
  messageId?: string;
};

export function logEvent(entry: LogEntry): void {
  console.log(JSON.stringify(entry));
}

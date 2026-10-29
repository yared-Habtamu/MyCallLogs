import type { CallLogEntry } from "./CallLogReader";

export interface ContactSummary {
  /** normalized key: digits (+ leading), used to group records */
  key: string;
  number: string;
  /** best-known display name from the log (CACHED_NAME) */
  name: string | null;
  totalSeconds: number;
  callCount: number;
  /** completed calls (incoming + outgoing) used for the average */
  talkCount: number;
  incomingCount: number;
  outgoingCount: number;
  missedCount: number;
  avgSeconds: number;
  longestSeconds: number;
  /** earliest timestamp within the fetched window */
  firstCallAt: number | null;
  lastCallAt: number | null;
}

/** Strip spaces/dashes/parentheses so the same number in different formats groups together. */
export function normalizeNumber(raw: string | null): string {
  if (!raw) return "unknown";
  const digits = raw.replace(/[^\d+]/g, "");
  return digits || "unknown";
}

const TALK_TYPES = new Set(["incoming", "outgoing"]);

export function groupByContact(calls: CallLogEntry[]): ContactSummary[] {
  const map = new Map<string, ContactSummary>();

  for (const call of calls) {
    const key = normalizeNumber(call.number);
    let entry = map.get(key);
    if (!entry) {
      entry = {
        key,
        number: call.number ?? key,
        name: null,
        totalSeconds: 0,
        callCount: 0,
        talkCount: 0,
        incomingCount: 0,
        outgoingCount: 0,
        missedCount: 0,
        avgSeconds: 0,
        longestSeconds: 0,
        firstCallAt: null,
        lastCallAt: null,
      };
      map.set(key, entry);
    }

    if (call.name && !entry.name) entry.name = call.name;
    entry.callCount += 1;
    if (TALK_TYPES.has(call.typeLabel)) {
      const seconds = Math.max(0, call.duration);
      entry.totalSeconds += seconds;
      entry.talkCount += 1;
      entry.longestSeconds = Math.max(entry.longestSeconds, seconds);
    }
    if (call.typeLabel === "incoming") entry.incomingCount += 1;
    if (call.typeLabel === "outgoing") entry.outgoingCount += 1;
    if (call.typeLabel === "missed") entry.missedCount += 1;
    if (entry.lastCallAt === null || call.timestamp > entry.lastCallAt) {
      entry.lastCallAt = call.timestamp;
    }
    if (entry.firstCallAt === null || call.timestamp < entry.firstCallAt) {
      entry.firstCallAt = call.timestamp;
    }
  }

  for (const entry of map.values()) {
    entry.avgSeconds =
      entry.talkCount > 0 ? Math.round(entry.totalSeconds / entry.talkCount) : 0;
  }

  return [...map.values()].sort((a, b) => b.totalSeconds - a.totalSeconds);
}

/** Case-insensitive match on display name or number substring. */
export function filterByContact(
  summaries: ContactSummary[],
  query: string,
): ContactSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return summaries;
  return summaries.filter(
    (s) =>
      s.name?.toLowerCase().includes(q) ||
      s.number.toLowerCase().includes(q) ||
      normalizeNumber(s.number).includes(normalizeNumber(q)),
  );
}

export function totalSecondsFor(summaries: ContactSummary[]): number {
  return summaries.reduce((sum, s) => sum + s.totalSeconds, 0);
}

export interface OverallStats {
  totalTalkSeconds: number;
  totalCalls: number;
  contactCount: number;
  missedTotal: number;
  topContact: ContactSummary | null;
}

export function overallStats(summaries: ContactSummary[]): OverallStats {
  return {
    totalTalkSeconds: totalSecondsFor(summaries),
    totalCalls: summaries.reduce((sum, s) => sum + s.callCount, 0),
    contactCount: summaries.length,
    missedTotal: summaries.reduce((sum, s) => sum + s.missedCount, 0),
    topContact: summaries[0] ?? null,
  };
}

/** 4925 -> "1h 22m" ; 180 -> "3m" ; 45 -> "45s" */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

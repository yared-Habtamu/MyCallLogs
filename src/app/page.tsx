"use client";

import { useMemo, useState } from "react";
import { useCallLogs } from "@/hooks/useCallLogs";
import {
  filterByContact,
  formatDuration,
  groupByContact,
  overallStats,
  type ContactSummary,
} from "@/lib/aggregate";

const FETCH_LIMIT = 2000;

function formatDate(ts: number | null): string {
  if (ts === null) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shareLabel(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

const RANK_BADGES: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-neutral-300 text-neutral-700",
  3: "bg-orange-300 text-orange-950",
};

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
      <dt className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function ContactRow({
  summary,
  rank,
  topSeconds,
  totalSeconds,
  open,
  onToggle,
}: {
  summary: ContactSummary;
  rank: number;
  topSeconds: number;
  totalSeconds: number;
  open: boolean;
  onToggle: () => void;
}) {
  const barPct = topSeconds > 0 ? (summary.totalSeconds / topSeconds) * 100 : 0;

  return (
    <li className="px-4 py-3">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              RANK_BADGES[rank] ?? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            {rank}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{summary.name ?? summary.number}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {summary.name ? `${summary.number} · ` : ""}
              {summary.incomingCount} in · {summary.outgoingCount} out
              {summary.missedCount > 0 && ` · ${summary.missedCount} missed`}
            </p>
            <div className="mt-1.5 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                style={{ width: `${Math.max(barPct, 2)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-semibold tabular-nums">
            {formatDuration(summary.totalSeconds)}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {shareLabel(summary.totalSeconds, totalSeconds)} of talk time
          </p>
        </div>
      </button>

      {open && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <DetailCell label="First call (in window)" value={formatDate(summary.firstCallAt)} />
          <DetailCell label="Last call" value={formatDate(summary.lastCallAt)} />
          <DetailCell label="Total calls" value={`${summary.callCount}`} />
          <DetailCell label="Avg call" value={formatDuration(summary.avgSeconds)} />
          <DetailCell label="Longest call" value={formatDuration(summary.longestSeconds)} />
          <DetailCell label="Missed" value={`${summary.missedCount}`} />
        </dl>
      )}
    </li>
  );
}

export default function Home() {
  const { calls, status, error, isNative, fetchedAt, refetch } = useCallLogs();
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const summaries = useMemo(() => groupByContact(calls), [calls]);
  const filtered = useMemo(
    () => filterByContact(summaries, query),
    [summaries, query],
  );
  const stats = useMemo(() => overallStats(summaries), [summaries]);
  const topSeconds = stats.topContact?.totalSeconds ?? 0;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Call Logs</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Total talk time per contact, ranked — from your phone&apos;s latest{" "}
          {FETCH_LIMIT.toLocaleString()} calls.
        </p>
      </header>

      {!isNative && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Call logs are only available inside the installed Android app — you
          are viewing this in a browser.
        </p>
      )}

      <section className="mb-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => refetch(FETCH_LIMIT)}
          disabled={status === "loading" || !isNative}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {status === "loading" ? "Reading call log…" : status === "ready" ? "Refresh" : "Load call logs"}
        </button>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find contact, e.g. Mr. X or 07123…"
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:focus:border-white dark:focus:ring-white/10"
        />
      </section>

      {error && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {status === "ready" && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Talk time</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatDuration(stats.totalTalkSeconds)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Calls</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{stats.totalCalls}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Contacts</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{stats.contactCount}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Missed</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{stats.missedTotal}</p>
            </div>
          </div>

          {stats.topContact && (
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              #1 contact:{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {stats.topContact.name ?? stats.topContact.number}
              </span>{" "}
              · {formatDuration(stats.topContact.totalSeconds)}
              {fetchedAt && (
                <span className="ml-1 text-xs">
                  · updated {new Date(fetchedAt).toLocaleTimeString()}
                </span>
              )}
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              {calls.length === 0
                ? "No calls found on this device."
                : "No contacts match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {filtered.map((s, i) => {
                const rank = query.trim()
                  ? summaries.indexOf(s) + 1
                  : i + 1;
                return (
                  <ContactRow
                    key={s.key}
                    summary={s}
                    rank={rank}
                    topSeconds={topSeconds}
                    totalSeconds={stats.totalTalkSeconds}
                    open={openKey === s.key}
                    onToggle={() => setOpenKey(openKey === s.key ? null : s.key)}
                  />
                );
              })}
            </ul>
          )}
        </>
      )}

      {status === "idle" && (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-12 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          Tap “Load call logs” to read your call history and grant the
          call-log permission when prompted.
        </p>
      )}
    </main>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import CallLogReader, { type CallLogEntry } from "@/lib/CallLogReader";

export type CallLogStatus = "idle" | "loading" | "ready" | "error";

interface State {
  status: CallLogStatus;
  calls: CallLogEntry[];
  error: string | null;
  fetchedAt: number | null;
}

export function useCallLogs() {
  const [state, setState] = useState<State>({
    status: "idle",
    calls: [],
    error: null,
    fetchedAt: null,
  });

  const isNative = Capacitor.isNativePlatform();

  const fetchCallLogs = useCallback(async (limit?: number) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const result = await CallLogReader.getCallLogs(
        limit ? { limit } : undefined,
      );
      setState({
        status: "ready",
        calls: result.calls ?? [],
        error: null,
        fetchedAt: Date.now(),
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to read call logs";
      setState((s) => ({ ...s, status: "error", error: message }));
    }
  }, []);

  return {
    ...state,
    isNative,
    refetch: fetchCallLogs,
  };
}

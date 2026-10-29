import { registerPlugin } from "@capacitor/core";

export interface CallLogEntry {
  number: string | null;
  name: string | null;
  /** seconds, as stored by Android */
  duration: number;
  /** epoch milliseconds */
  timestamp: number;
  /** raw Android call type int */
  type: number;
  typeLabel: "incoming" | "outgoing" | "missed" | "rejected" | "blocked" | "voicemail" | "other";
}

export interface GetCallLogsOptions {
  /** max rows to return, newest first. Omit for all. */
  limit?: number;
}

export interface GetCallLogsResult {
  calls: CallLogEntry[];
}

export interface CallLogReaderPlugin {
  getCallLogs(options?: GetCallLogsOptions): Promise<GetCallLogsResult>;
}

// Implemented natively in android/app/.../CallLogPlugin.java and registered in MainActivity
const CallLogReader = registerPlugin<CallLogReaderPlugin>("CallLogReader");

export default CallLogReader;

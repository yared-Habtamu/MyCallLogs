# AGENTS.md - Development & Architecture Guide for AI Assistants

This repository contains a local Android application built using **Next.js (Static Export)** wrapped for mobile deployment via **Capacitor**, designed to track and aggregate call durations per contact by querying Android system logs.

---

## 1. Project Overview & Tech Stack

* **Framework:** Next.js (configured with `output: 'export'`)
* **Mobile Wrapper:** Capacitor (`@capacitor/android`, `@capacitor/core`)
* **Styling:** Tailwind CSS
* **Language:** TypeScript (Frontend) / Java or Kotlin (Android Native Plugin)
* **Target OS:** Android (Local Sideloading / Personal Use)

---

## 2. Core Architecture & Native Bridge

Since Capacitor lacks a built-in API for reading device call logs, interaction requires a **Custom Capacitor Plugin** bridging web JavaScript to native Android `ContentResolver` APIs.

### Key Components:
1. **Android Manifest (`AndroidManifest.xml`):**
   * Must include the runtime permission: `<uses-permission android:name="android.permission.READ_CALL_LOG" />`
2. **Native Plugin Class (`CallLogPlugin.java` or `.kt`):**
   * Extends `com.getcapacitor.Plugin`
   * Annotated with `@CapacitorPlugin(name = "CallLogReader", permissions = { @Permission(strings = { Manifest.permission.READ_CALL_LOG }, alias = "callLog") })`
   * Implements a `@PluginMethod()` to query `CallLog.Calls.CONTENT_URI`, parsing cursor records (Number, Duration, Date, Type) into a JSON array.
3. **Next.js / Frontend Layer:**
   * Uses `@capacitor/core` to register and invoke the custom plugin (`registerPlugin<CallLogPluginInterface>('CallLogReader')`).
   * Aggregates raw logs using JavaScript/TypeScript reduce/filter functions to calculate cumulative hours/minutes per phone number or contact.

---

## 3. Implementation Workflow & Guidelines for AI Assistants

When modifying, debugging, or adding features to this repository, adhere to these rules:

* **Static Export Constraints:** Never introduce Next.js server-side features (`api/` routes, `getServerSideProps`, Server Actions) since the app runs as a fully static export inside a mobile webview via Capacitor.
* **Permission Handling:** Always check and handle Android runtime permissions (`READ_CALL_LOG`) gracefully before executing queries.
* **Data Aggregation Logic:** Ensure call durations (stored in seconds in Android systems) are correctly parsed, filtered by target contacts (e.g., Mr. X), and formatted into readable hours/minutes.
* **Clean UI State:** Keep components lightweight and responsive using Tailwind CSS classes.

---

## 4. Common Commands

* **Sync Capacitor Native Assets:**
  ```bash
  npx cap sync android
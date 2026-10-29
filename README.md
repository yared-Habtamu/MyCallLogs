# My Call Logs

A local Android app built with **Next.js (static export)** + **Capacitor** that reads
the device call log and aggregates total talk time per contact.

All processing happens on-device. Nothing is uploaded anywhere — the only network
permission is unused boilerplate from the Capacitor template.

## How it works

- `android/app/src/main/java/com/mycalllogs/app/CallLogPlugin.java` — custom
  Capacitor plugin (native, Java). Declares the `READ_CALL_LOG` runtime permission,
  requests it on first use, and queries `CallLog.Calls.CONTENT_URI`, returning
  `{ number, name, duration (seconds), timestamp (ms), type, typeLabel }` rows.
- `android/app/src/main/java/com/mycalllogs/app/MainActivity.java` — registers the
  plugin with the Capacitor bridge (`registerPlugin(...)` before `super.onCreate`).
- `src/lib/CallLogReader.ts` — `registerPlugin<CallLogReaderPlugin>("CallLogReader")`
  typed bridge for the web layer.
- `src/lib/aggregate.ts` — group-by-contact, filter by name/number, sum durations,
  format `h/m/s`.
- `src/hooks/useCallLogs.ts` + `src/app/page.tsx` — fetch-on-click UI with search
  (Tailwind CSS).

## Commands

```bash
npm run build          # next build → out/ (static export)
npm run android:sync   # build + npx cap sync android
npm run android:apk    # ./gradlew assembleDebug → APK in android/app/build/outputs/apk/debug/
npm run android:open   # open the project in Android Studio
```

Daily loop: edit web code → `npm run android:sync` → rebuild APK (or run from
Android Studio).

## Install on your phone

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

On first use, tap **Load call logs** and grant the phone-calls permission when
Android asks. If you deny it, the app shows an error banner; grant it manually
under Settings → Apps → My Call Logs → Permissions.

## Browser development

`npm run dev` works for UI iteration, but call-log reading only functions inside
the installed Android app (the UI shows a notice when running in a browser).

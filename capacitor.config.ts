import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration — "live shell" mode.
 *
 * The APK is a thin native wrapper that loads the deployed Vercel app
 * inside a WebView. All AI calls, auth, and DB reads continue to work
 * exactly as they do in the browser, and any new web deploy ships to
 * users immediately without rebuilding the APK.
 */
const config: CapacitorConfig = {
  appId: "com.kilimanjaro.app",
  appName: "Kilimanjaro",
  // webDir is required by the schema but unused in live-shell mode —
  // we point it at `public/` so it always exists.
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    url: "https://kilimanjaro-six.vercel.app",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;

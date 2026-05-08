import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration.
 *
 * Build flow for native APK/IPA:
 *   1. BUILD_TARGET=capacitor next build      # produces ./out
 *   2. npx cap add android                    # first time only
 *   3. npx cap sync                           # copy /out into native
 *   4. npx cap open android                   # build APK in Android Studio
 *
 * In live-web mode, Capacitor can also load the hosted Vercel URL
 * directly by setting `server.url` below.
 */
const config: CapacitorConfig = {
  appId: "com.motivation.app",
  appName: "מוטיבציה",
  webDir: "out",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "always",
  },
  // To run as a thin shell over a hosted web app, uncomment:
  // server: {
  //   url: "https://your-app.vercel.app",
  //   cleartext: false,
  // },
};

export default config;

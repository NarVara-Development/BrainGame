// ============================================================
// Firebase Analytics wrapper — defensive: no-ops when the native
// module (@react-native-firebase/analytics) is unavailable (Expo Go / web).
// Auto-collection (app_open, screen_view, etc.) is handled natively once
// google-services.json + the SDK are present; these helpers add explicit events.
// ============================================================
let analyticsMod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  analyticsMod = require('@react-native-firebase/analytics').default;
} catch {
  analyticsMod = null;
}

export const isAnalyticsAvailable = Boolean(analyticsMod);

export async function logAppOpen(): Promise<void> {
  if (!analyticsMod) return;
  try {
    await analyticsMod().logAppOpen();
  } catch {
    /* ignore */
  }
}

/** Log a custom event (e.g. game finished, premium bought). No-op when unavailable. */
export async function logEvent(name: string, params?: Record<string, any>): Promise<void> {
  if (!analyticsMod) return;
  try {
    await analyticsMod().logEvent(name, params);
  } catch {
    /* ignore */
  }
}

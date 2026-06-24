// ============================================================
// AdMob wrapper — defensive: no-ops when the native module
// (react-native-google-mobile-ads) is unavailable (Expo Go / web).
//
// Ad inventory (matches NutritionSnap):
//  • Banner            — persistent, adaptive, on content screens.
//  • Rewarded video    — full-screen VIDEO shown after a game finishes
//    (interstitial)      (random 1–10 game cadence + 30s cooldown).
// Both are skipped for Premium users.
// ============================================================
import { usePurchaseStore } from '@/stores/purchaseStore';

export const ADMOB_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '';
export const ADMOB_INTERSTITIAL_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '';
export const ADMOB_REWARDED_ID = process.env.EXPO_PUBLIC_ADMOB_REWARD_ID ?? '';

let ads: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ads = require('react-native-google-mobile-ads');
} catch {
  ads = null;
}

export const isAdMobAvailable = Boolean(ads);

// Devices that should always receive TEST ads (safe to click).
// Only applied in development — production builds serve real ads.
const TEST_DEVICE_IDS = __DEV__ ? ['e9170c5a-6292-4971-b3cc-10ca1ad1abe1'] : [];

/** Resolve unit IDs — Google's official test IDs in dev / when env is missing. */
function bannerUnitId(): string {
  const { TestIds } = ads;
  return __DEV__ ? TestIds.BANNER : ADMOB_BANNER_ID || TestIds.BANNER;
}
function rewardedUnitId(): string {
  const { TestIds } = ads;
  return __DEV__ ? TestIds.REWARDED_INTERSTITIAL : ADMOB_REWARDED_ID || TestIds.REWARDED_INTERSTITIAL;
}

export async function initAdMob(): Promise<void> {
  if (!ads) return;
  try {
    await ads.default().setRequestConfiguration({ testDeviceIdentifiers: TEST_DEVICE_IDS });
    await ads.default().initialize();
    ensureRewarded(); // warm up the first video ad
  } catch {
    /* ignore */
  }
}

// ---------------- Rewarded Interstitial (VIDEO) ----------------
// Full-screen video shown at the transition after a game ends. Uses
// RewardedInterstitial so it can show without an opt-in dialog. A cooldown
// prevents two videos back-to-back (annoying + against AdMob policy).
let rewarded: any = null;
let rewardedLoaded = false;
let lastVideoAt = 0;
const VIDEO_COOLDOWN_MS = 30000; // at least 30s between videos

/** Create + load the video ad once; reloads itself after each close. */
function ensureRewarded(): void {
  if (!ads || rewarded) return;
  try {
    const { RewardedInterstitialAd, RewardedAdEventType, AdEventType } = ads;
    rewarded = RewardedInterstitialAd.createForAdRequest(rewardedUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });
    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
    });
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      // No functional reward — the ad is purely for monetisation.
    });
    rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedLoaded = false;
      rewarded.load(); // preload the next one
    });
    rewarded.addAdEventListener(AdEventType.ERROR, () => {
      rewardedLoaded = false;
    });
    rewarded.load();
  } catch {
    /* ignore */
  }
}

// Random cadence: show a video ad every 1–3 finished games (non-premium).
let gamesSinceAd = 0;
let nextThreshold = randomThreshold();
function randomThreshold(): number {
  return Math.floor(Math.random() * 3) + 1; // 1..3
}

/**
 * Call after each game finishes. Shows the preloaded video ad on the random
 * 1–10 cadence (non-premium), guarded by a 30s cooldown. No-op when the
 * module/ad isn't ready — in that case it kicks a load and retries next game.
 */
export function maybeShowVideoAd(): void {
  const isPremium = usePurchaseStore.getState().isPremium;
  if (isPremium || !ads) return;

  gamesSinceAd += 1;
  if (gamesSinceAd < nextThreshold) return;

  const now = Date.now();
  if (now - lastVideoAt < VIDEO_COOLDOWN_MS) return; // cooldown — retry next game

  ensureRewarded();
  if (rewardedLoaded) {
    try {
      rewarded.show();
      lastVideoAt = now;
      gamesSinceAd = 0;
      nextThreshold = randomThreshold(); // new random gap for next time
    } catch {
      /* ignore */
    }
  } else {
    // Not ready yet (still loading / no fill) — load now, retry next game.
    rewarded?.load();
  }
}

// ---------------- Banner ----------------
/** Returns the BannerAd component + props, or null when ads aren't available. */
export function getBanner(): { Component: any; unitId: string; size: any } | null {
  if (!ads) return null;
  const { BannerAd, BannerAdSize } = ads;
  return {
    Component: BannerAd,
    unitId: bannerUnitId(),
    size: BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  };
}

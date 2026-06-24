import { create } from 'zustand';
import { Alert } from 'react-native';
import { storage } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const PREMIUM_KEY = 'is_premium';
/** One-time, non-consumable managed product — create this id in Google Play Console. */
export const PREMIUM_SKU = 'narvara_braingame_premium';

// react-native-iap is a native module → load defensively so Expo Go / web still boot.
let IAP: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  IAP = require('react-native-iap');
} catch {
  IAP = null;
}

export const isBillingAvailable = Boolean(IAP);

interface PurchaseState {
  isPremium: boolean;
  busy: boolean;
  loadPremium: () => Promise<void>;
  setPremium: (value: boolean) => void;
  buyPremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

let connected = false;
let listenersBound = false;

async function ensureConnection(): Promise<boolean> {
  if (!IAP) return false;
  if (connected) return true;
  try {
    await IAP.initConnection();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

async function grantPremium() {
  storage.set(PREMIUM_KEY, 'true');
  usePurchaseStore.getState().setPremium(true);
  // mirror entitlement to Supabase (best-effort)
  if (isSupabaseConfigured) {
    const user = useAuthStore.getState().user;
    if (user) {
      await supabase
        .from('braingame_user_stats')
        .upsert({ user_id: user.id, game_type: 'premium', is_premium: true }, { onConflict: 'user_id,game_type' });
    }
  }
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
  isPremium: storage.getBoolean(PREMIUM_KEY) ?? false,
  busy: false,

  loadPremium: async () => {
    set({ isPremium: storage.getBoolean(PREMIUM_KEY) ?? false });

    // bind purchase listeners once
    if (IAP && !listenersBound) {
      listenersBound = true;
      try {
        IAP.purchaseUpdatedListener(async (purchase: any) => {
          try {
            await grantPremium();
            await IAP.finishTransaction({ purchase, isConsumable: false });
          } catch {
            /* ignore */
          }
        });
        IAP.purchaseErrorListener(() => set({ busy: false }));
      } catch {
        /* ignore */
      }
    }

    // server entitlement check
    if (isSupabaseConfigured) {
      const user = useAuthStore.getState().user;
      if (user) {
        const { data } = await supabase
          .from('braingame_user_stats')
          .select('is_premium')
          .eq('user_id', user.id)
          .eq('is_premium', true)
          .limit(1)
          .maybeSingle();
        if (data?.is_premium) {
          storage.set(PREMIUM_KEY, 'true');
          set({ isPremium: true });
        }
      }
    }
  },

  setPremium: (value) => {
    storage.set(PREMIUM_KEY, value ? 'true' : 'false');
    set({ isPremium: value });
  },

  buyPremium: async () => {
    if (!IAP) {
      Alert.alert('Premium', 'In-app purchase is only available in the published Play Store build.');
      return;
    }
    const ok = await ensureConnection();
    if (!ok) {
      Alert.alert('Premium', 'Could not connect to Google Play. Try again later.');
      return;
    }
    set({ busy: true });
    try {
      await IAP.fetchProducts({ skus: [PREMIUM_SKU], type: 'in-app' });
      await IAP.requestPurchase({
        request: {
          google: { skus: [PREMIUM_SKU] },
          apple: { sku: PREMIUM_SKU },
        },
        type: 'in-app',
      });
      // success is handled by purchaseUpdatedListener
    } catch {
      set({ busy: false });
    }
  },

  restorePurchases: async () => {
    if (!IAP) return;
    const ok = await ensureConnection();
    if (!ok) return;
    try {
      const purchases: any[] = (await IAP.getAvailablePurchases()) ?? [];
      const owned = purchases.some((p) => (p.productId ?? p.sku) === PREMIUM_SKU);
      if (owned) await grantPremium();
    } catch {
      /* ignore */
    }
  },
}));

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getBanner } from '@/lib/admob';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { COLORS } from '@/theme/theme';

/** Renders an AdMob banner for non-premium users; no-ops otherwise. */
export function BannerSlot() {
  const isPremium = usePurchaseStore((s) => s.isPremium);
  if (isPremium) return null;
  const banner = getBanner();
  if (!banner) return null;
  const { Component, unitId, size } = banner;
  return (
    <View style={styles.wrap}>
      <Component unitId={unitId} size={size} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', borderTopWidth: 3, borderColor: COLORS.ink, paddingVertical: 4 },
});

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BannerSlot } from '@/components/shared/BannerSlot';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { DifficultySelector } from '@/components/shared/DifficultySelector';
import { useAuthStore } from '@/stores/authStore';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/utils/languageManager';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useGameStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const username = useAuthStore((s) => s.username);
  const signOut = useAuthStore((s) => s.signOut);
  const isPremium = usePurchaseStore((s) => s.isPremium);
  const buyPremium = usePurchaseStore((s) => s.buyPremium);
  const restorePurchases = usePurchaseStore((s) => s.restorePurchases);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={[TYPE.h1, styles.title]}>⚙️ YOU</Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 16 }}>
        {/* account */}
        <Card padded color={COLORS.white}>
          <Text style={[TYPE.label, { marginBottom: 6 }]}>{t('username', lang)}</Text>
          <Text style={[TYPE.h2, { fontSize: 22 }]}>{username}</Text>
          <Text style={[TYPE.body, { color: COLORS.muted, marginTop: 2 }]}>
            {user ? user.email : t('guest', lang)}
          </Text>
          <View style={{ marginTop: 14 }}>
            {user ? (
              <Button label={t('logout', lang)} color={COLORS.red} textColor={COLORS.white} onPress={signOut} />
            ) : (
              <Button label={`${t('login', lang)} / ${t('register', lang)}`} color={COLORS.blue} textColor={COLORS.white} onPress={() => router.push('/(auth)/login')} />
            )}
          </View>
        </Card>

        {/* premium */}
        <Card padded color={isPremium ? COLORS.green : COLORS.yellow}>
          <Text style={[TYPE.h2, { fontSize: 20 }]}>{isPremium ? `⭐ ${t('premiumActive', lang)}` : '💎 PREMIUM'}</Text>
          <Text style={[TYPE.body, { marginTop: 6, textTransform: 'none' }]}>
            {isPremium ? t('noAds', lang) : t('premiumDesc', lang)}
          </Text>
          {!isPremium && (
            <>
              <Button
                label={`${t('goPremium', lang)} · $10`}
                color={COLORS.ink}
                textColor={COLORS.white}
                onPress={buyPremium}
                style={{ marginTop: 14 }}
              />
              <Button
                label={t('restorePurchase', lang)}
                color={COLORS.white}
                onPress={restorePurchases}
                style={{ marginTop: 10 }}
              />
            </>
          )}
        </Card>

        {/* prefs */}
        <Card padded>
          <Text style={[TYPE.label, { marginBottom: 10 }]}>{t('language', lang)}</Text>
          <LanguageToggle />
          <View style={{ height: 18 }} />
          <DifficultySelector />
        </Card>

        <View style={[styles.foot, hardShadow(4)]}>
          <Text style={[TYPE.label, { color: COLORS.white, fontSize: 10, textAlign: 'center' }]}>NARVARA BRAINGAME v1.0 · 10 GAME · 50.000 SOAL{'\n'}© NARVARA TECH LAB</Text>
        </View>
      </ScrollView>
      <BannerSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  title: { paddingHorizontal: 16, marginBottom: 12 },
  foot: { backgroundColor: COLORS.ink, padding: 12, alignItems: 'center' },
});

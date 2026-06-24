import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_TYPES } from '@/types';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameCard } from '@/components/shared/GameCard';
import { Marquee } from '@/components/shared/Marquee';
import { DifficultySelector } from '@/components/shared/DifficultySelector';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { BannerSlot } from '@/components/shared/BannerSlot';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { json } from '@/lib/storage';
import { t } from '@/utils/languageManager';

function totalStreak(): number {
  let best = 0;
  for (const g of GAME_TYPES) {
    const s = json.get<{ current: number }>(`streak_${g}`);
    if (s?.current) best = Math.max(best, s.current);
  }
  return best;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const username = useAuthStore((s) => s.username);
  const user = useAuthStore((s) => s.user);
  const lang = useGameStore((s) => s.language);
  const isPremium = usePurchaseStore((s) => s.isPremium);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.kicker}>
              <Text style={[TYPE.label, { color: COLORS.white }]}>NARVARA</Text>
            </View>
            <Pressable
              onPress={() => router.push(user ? '/(tabs)/settings' : '/(auth)/login')}
              style={[styles.loginChip, { backgroundColor: user ? COLORS.green : COLORS.blue }]}
            >
              <Text style={[TYPE.label, { color: COLORS.white, fontSize: 12 }]}>
                {user ? `👤 ${username}` : `👤 ${t('login', lang)}`}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.heroTitle}>BRAIN</Text>
          <View style={styles.heroRow}>
            <Text style={[styles.heroTitle, styles.heroOutline]}>GAME</Text>
            <View style={styles.heroDot} />
          </View>
          <Text style={[TYPE.bodyBold, styles.heroSub]}>
            {`${t('hello', lang)}, ${username}. ${t('trainBrain', lang)}`}
          </Text>
        </View>

        <Marquee text="10 GAME × 50.000 SOAL × LOGIC × MATH × WORD × CROSSWORD × MEMORY × SLIDE × SIMON" />

        {/* CONTROLS */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <LanguageToggle />
            <StreakBadge count={totalStreak()} />
          </View>
          <DifficultySelector />
        </View>

        {/* GAME GRID */}
        <View style={styles.grid}>
          {GAME_TYPES.map((g, i) => (
            <GameCard key={g} game={g} index={i} />
          ))}
        </View>

        {isPremium ? (
          <View style={[styles.footerTag, hardShadow(5), { backgroundColor: COLORS.green }]}>
            <Text style={[TYPE.label, { color: COLORS.white, fontSize: 11 }]}>{`⭐ PREMIUM · ${t('noAds', lang)}`}</Text>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/settings')} style={[styles.footerTag, hardShadow(5)]}>
            <Text style={[TYPE.label, { color: COLORS.white, fontSize: 11 }]}>
              {t('buyPremiumCta', lang)}
            </Text>
          </Pressable>
        )}
      </ScrollView>
      <BannerSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  hero: { paddingHorizontal: 20, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kicker: { backgroundColor: COLORS.ink, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4 },
  loginChip: { borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 6, ...hardShadow(4) },
  heroTitle: { ...TYPE.hero, fontSize: 64, lineHeight: 60, color: COLORS.ink },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroOutline: { color: COLORS.pink },
  heroDot: { width: 26, height: 26, backgroundColor: COLORS.yellow, borderWidth: 3, borderColor: COLORS.ink, marginTop: 8 },
  heroSub: { marginTop: 12, fontSize: 15 },
  controls: { paddingHorizontal: 20, paddingVertical: 18, gap: 16 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  footerTag: { marginHorizontal: 20, marginTop: 4, backgroundColor: COLORS.blue, borderWidth: 3, borderColor: COLORS.ink, paddingVertical: 10, alignItems: 'center' },
});

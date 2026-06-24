import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { Button } from '@/components/ui/Button';
import { BrainLogo } from '@/components/shared/BrainLogo';
import { Marquee } from '@/components/shared/Marquee';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { GAME_TYPES } from '@/types';
import { json } from '@/lib/storage';
import { t } from '@/utils/languageManager';

function topStreak(): number {
  let best = 0;
  for (const g of GAME_TYPES) {
    const s = json.get<{ current: number }>(`streak_${g}`);
    if (s?.current) best = Math.max(best, s.current);
  }
  return best;
}

export default function MainMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useGameStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const username = useAuthStore((s) => s.username);

  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [rise]);

  const menuTranslate = rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  const onExit = () => {
    if (Platform.OS === 'android') BackHandler.exitApp();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
      {/* top bar */}
      <View style={styles.topbar}>
        <LanguageToggle />
        <Pressable
          onPress={() => router.push(user ? '/(tabs)/settings' : '/(auth)/login')}
          style={[styles.loginChip, { backgroundColor: user ? COLORS.green : COLORS.blue }]}
        >
          <Text style={[TYPE.label, { color: COLORS.white, fontSize: 12 }]}>
            {user ? `👤 ${username}` : `👤 ${t('login', lang)}`}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* hero */}
        <View style={styles.hero}>
          <BrainLogo size={100} />
          <Text style={[styles.titleBrain, { marginTop: 14 }]}>BRAIN</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.titleBrain, { color: COLORS.pink }]}>GAME</Text>
            <View style={styles.dot} />
          </View>
          <View style={styles.kicker}>
            <Text style={[TYPE.label, { color: COLORS.white, fontSize: 11 }]}>BY NARVARA</Text>
          </View>
          <Text style={[TYPE.bodyBold, styles.tagline]}>{t('tagline', lang)}</Text>
        </View>

        {/* menu buttons */}
        <Animated.View style={[styles.menu, { opacity: rise, transform: [{ translateY: menuTranslate }] }]}>
          <View style={styles.streakWrap}>
            <StreakBadge count={topStreak()} />
          </View>
          <Button label={`▶  ${t('play', lang)}`} color={COLORS.green} fullWidth size="lg" onPress={() => router.push('/(tabs)')} />
          <Button label={`🏆  ${t('leaderboard', lang)}`} color={COLORS.blue} textColor={COLORS.white} fullWidth onPress={() => router.push('/(tabs)/leaderboard')} style={{ marginTop: 14 }} />
          <Button label={`⚙️  ${t('settings', lang)}`} color={COLORS.yellow} fullWidth onPress={() => router.push('/(tabs)/settings')} style={{ marginTop: 14 }} />
          {Platform.OS === 'android' && (
            <Button label={`✕  ${t('exit', lang)}`} color={COLORS.white} fullWidth onPress={onExit} style={{ marginTop: 14 }} />
          )}
        </Animated.View>
      </ScrollView>

      <Marquee text={`${t('tapToPlay', lang)}  ★  10 GAME  ★  50.000 SOAL  ★`} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  loginChip: { borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 6, ...hardShadow(4) },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingTop: 18, paddingBottom: 16 },
  hero: { alignItems: 'center', gap: 2, marginBottom: 24 },
  kicker: { backgroundColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 4, marginTop: 18 },
  titleBrain: { ...TYPE.hero, fontSize: 54, lineHeight: 52, color: COLORS.ink },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 22, height: 22, backgroundColor: COLORS.yellow, borderWidth: 3, borderColor: COLORS.ink, marginTop: 6 },
  tagline: { marginTop: 10, fontSize: 14 },
  menu: { paddingHorizontal: 24 },
  streakWrap: { alignItems: 'center', marginBottom: 12 },
});

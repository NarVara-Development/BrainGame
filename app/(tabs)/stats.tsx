import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GAME_META, GAME_TYPES } from '@/types';
import { json } from '@/lib/storage';
import { BannerSlot } from '@/components/shared/BannerSlot';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/utils/languageManager';

interface LocalStat {
  games_played: number;
  best_score: number;
  total_score: number;
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const lang = useGameStore((s) => s.language);

  const stats = GAME_TYPES.map((g) => {
    const s = json.get<LocalStat>(`stat_${g}`) ?? { games_played: 0, best_score: 0, total_score: 0 };
    const streak = json.get<{ current: number; longest: number }>(`streak_${g}`) ?? { current: 0, longest: 0 };
    return { game: g, ...s, ...streak };
  });

  const totalGames = stats.reduce((a, s) => a + s.games_played, 0);
  const totalScore = stats.reduce((a, s) => a + s.total_score, 0);
  const bestStreak = stats.reduce((a, s) => Math.max(a, s.longest), 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={[TYPE.h1, styles.title]}>📊 STATS</Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View style={styles.summaryRow}>
          <Summary label={t('games', lang)} value={totalGames} color={COLORS.blue} />
          <Summary label={t('totalScore', lang)} value={totalScore} color={COLORS.green} />
          <Summary label={`🔥 ${t('streak', lang)}`} value={bestStreak} color={COLORS.orange} />
        </View>

        {stats.map((s) => (
          <View key={s.game} style={[styles.card, hardShadow(5)]}>
            <View style={[styles.cardHead, { backgroundColor: GAME_META[s.game].color }]}>
              <Text style={[TYPE.h3, { fontSize: 16 }]}>{GAME_META[s.game].emoji} {GAME_META[s.game].title}</Text>
            </View>
            <View style={styles.cardBody}>
              <Stat label={t('played', lang)} value={s.games_played} />
              <Stat label={t('best', lang)} value={s.best_score} />
              <Stat label={t('streak', lang)} value={`${s.current}/${s.longest}`} />
            </View>
          </View>
        ))}
      </ScrollView>
      <BannerSlot />
    </View>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.summary, hardShadow(4), { backgroundColor: color }]}>
      <Text style={[TYPE.h2, { fontSize: 22 }]}>{value.toLocaleString()}</Text>
      <Text style={[TYPE.label, { fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[TYPE.h3, { fontSize: 18 }]}>{value}</Text>
      <Text style={[TYPE.label, { fontSize: 9, color: COLORS.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  title: { paddingHorizontal: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  summary: { flex: 1, borderWidth: 3, borderColor: COLORS.ink, padding: 12, alignItems: 'center' },
  card: { backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.ink, marginBottom: 14 },
  cardHead: { borderBottomWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 8 },
  cardBody: { flexDirection: 'row', paddingVertical: 14 },
});

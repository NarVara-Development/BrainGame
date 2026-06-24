import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GAME_META, GAME_TYPES, GameType } from '@/types';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { BannerSlot } from '@/components/shared/BannerSlot';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useGameStore } from '@/stores/gameStore';
import { shareText } from '@/utils/share';
import { t } from '@/utils/languageManager';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const lang = useGameStore((s) => s.language);
  const [game, setGame] = useState<GameType>('math');
  const entries = useLeaderboardStore((s) => s.entries[game]);
  const loading = useLeaderboardStore((s) => s.loading);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchLeaderboard);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    fetchLeaderboard(game);
  }, [game, fetchLeaderboard]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <Text style={[TYPE.h1]}>🏆 RANKS</Text>
        <Pressable
          onPress={() => shareText(t('shareLeaderboard', lang))}
          style={[styles.shareBtn, hardShadow(4)]}
        >
          <Text style={[TYPE.label, { fontSize: 12 }]}>📤 {t('share', lang)}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {GAME_TYPES.map((g) => {
          const active = g === game;
          return (
            <Pressable key={g} onPress={() => setGame(g)} style={[styles.tab, active && hardShadow(4), { backgroundColor: active ? GAME_META[g].color : COLORS.white }]}>
              <Text style={[TYPE.label, { fontSize: 12 }]}>{GAME_META[g].emoji} {GAME_META[g].title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {!isSupabaseConfigured ? (
          <Empty text={t('offlineBoard', lang)} />
        ) : loading ? (
          <Empty text={t('loading', lang)} />
        ) : entries.length === 0 ? (
          <Empty text={t('noScores', lang)} />
        ) : (
          entries.map((e, i) => <LeaderboardRow key={e.user_id + game} entry={e} rank={i + 1} me={e.user_id === userId} />)
        )}
      </ScrollView>
      <BannerSlot />
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={[styles.empty, hardShadow(5)]}>
      <Text style={[TYPE.bodyBold, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  shareBtn: { backgroundColor: COLORS.cyan, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 8 },
  tabs: { flexGrow: 0, marginBottom: 8 },
  tab: { borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 8 },
  empty: { backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.ink, padding: 24, marginTop: 20 },
});

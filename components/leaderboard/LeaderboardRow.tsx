import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import type { LeaderboardEntry } from '@/types';

const MEDAL = ['🥇', '🥈', '🥉'];

export function LeaderboardRow({ entry, rank, me }: { entry: LeaderboardEntry; rank: number; me?: boolean }) {
  return (
    <View style={[styles.row, me && hardShadow(5), me && { backgroundColor: COLORS.yellow, borderWidth: 4 }]}>
      <View style={styles.rankBox}>
        <Text style={[TYPE.label, { fontSize: 14 }]}>{rank <= 3 ? MEDAL[rank - 1] : `#${rank}`}</Text>
      </View>
      <Text style={[TYPE.bodyBold, styles.name]} numberOfLines={1}>
        {entry.username}
        {entry.is_premium ? ' ⭐' : ''}
        {me ? ' ←' : ''}
      </Text>
      <Text style={[TYPE.h3, { fontSize: 16 }]}>{entry.high_score.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rankBox: { width: 44 },
  name: { flex: 1 },
});

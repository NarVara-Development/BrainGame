import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/utils/languageManager';

interface Props {
  score: number;
  streak?: number;
  timeLeft?: number;
  accent?: string;
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.stat, hardShadow(4), { backgroundColor: color }]}>
      <Text style={[TYPE.label, styles.statLabel]}>{label}</Text>
      <Text style={[TYPE.h3, styles.statValue]}>{value}</Text>
    </View>
  );
}

export function GameHeader({ score, streak, timeLeft, accent = COLORS.yellow }: Props) {
  const lang = useGameStore((s) => s.language);
  const danger = timeLeft !== undefined && timeLeft <= 5;

  return (
    <View style={styles.row}>
      <Stat label={t('score', lang)} value={score} color={accent} />
      {streak !== undefined && <Stat label={t('streak', lang)} value={`${streak}x`} color={COLORS.green} />}
      {timeLeft !== undefined && (
        <Stat label={t('time', lang)} value={`${timeLeft}s`} color={danger ? COLORS.red : COLORS.cyan} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: {
    flex: 1,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statLabel: { fontSize: 10, color: COLORS.ink },
  statValue: { color: COLORS.ink },
});

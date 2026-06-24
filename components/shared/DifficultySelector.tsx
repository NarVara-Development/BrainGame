import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import type { Difficulty } from '@/types';
import { DIFFICULTIES } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/utils/languageManager';

const COLOR: Record<Difficulty, string> = {
  easy: COLORS.green,
  medium: COLORS.yellow,
  hard: COLORS.red,
};

export function DifficultySelector() {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  return (
    <View>
      <Text style={[TYPE.label, { marginBottom: 8 }]}>{t('difficulty', lang)}</Text>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => {
          const active = d === difficulty;
          return (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[
                styles.chip,
                active && hardShadow(5),
                { backgroundColor: active ? COLOR[d] : COLORS.white },
              ]}
            >
              <Text style={[TYPE.label, { fontSize: 12 }]}>{t(d, lang)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingVertical: 12,
    alignItems: 'center',
  },
});

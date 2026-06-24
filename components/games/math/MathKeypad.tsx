import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '−'];

export function MathKeypad({
  onPress,
  onDelete,
  onToggleSign,
}: {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onToggleSign: () => void;
}) {
  const handle = (k: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (k === '⌫') onDelete();
    else if (k === '−') onToggleSign();
    else onPress(k);
  };
  return (
    <View style={styles.grid}>
      {KEYS.map((k) => (
        <Pressable key={k} onPress={() => handle(k)} style={[styles.key, hardShadow(4), k === '⌫' && { backgroundColor: COLORS.red }, k === '−' && { backgroundColor: COLORS.yellow }]}>
          <Text style={[TYPE.h2, { color: k === '⌫' ? COLORS.white : COLORS.ink }]}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  key: {
    width: '30%',
    aspectRatio: 1.6,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

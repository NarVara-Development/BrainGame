import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import type { Language } from '@/types';
import { useGameStore } from '@/stores/gameStore';

const LANGS: { code: Language; label: string }[] = [
  { code: 'id', label: '🇮🇩 ID' },
  { code: 'en', label: '🇬🇧 EN' },
];

export function LanguageToggle() {
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);

  return (
    <View style={[styles.row, hardShadow(4)]}>
      {LANGS.map((l) => {
        const active = l.code === language;
        return (
          <Pressable
            key={l.code}
            onPress={() => setLanguage(l.code)}
            style={[styles.chip, { backgroundColor: active ? COLORS.blue : COLORS.white }]}
          >
            <Text style={[TYPE.label, { fontSize: 12, color: active ? COLORS.white : COLORS.ink }]}>
              {l.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 3, borderColor: COLORS.ink, alignSelf: 'flex-start' },
  chip: { paddingVertical: 8, paddingHorizontal: 14 },
});

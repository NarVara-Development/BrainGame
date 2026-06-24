import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';

export function StreakBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, hardShadow(4)]}>
      <Text style={styles.text}>🔥 {count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.orange,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  text: { ...TYPE.label, fontSize: 14, color: COLORS.ink },
});

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, hardShadow } from '@/theme/theme';

interface Props {
  children: React.ReactNode;
  color?: string;
  offset?: number;
  border?: number;
  style?: ViewStyle;
  padded?: boolean;
}

/** Brutalist surface: thick border + hard offset shadow, square corners. */
export function Card({ children, color = COLORS.white, offset = 6, border = 3, style, padded }: Props) {
  return (
    <View
      style={[
        styles.card,
        hardShadow(offset),
        { backgroundColor: color, borderWidth: border },
        padded && { padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: COLORS.ink,
    borderRadius: 0,
  },
});

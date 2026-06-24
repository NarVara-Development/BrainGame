import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';

interface Props {
  label: string;
  onPress?: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Brutalist button: thick black border + hard offset shadow.
 * Pressing "slams" it into the shadow (translate + shadow collapse).
 */
export function Button({
  label,
  onPress,
  color = COLORS.yellow,
  textColor = COLORS.ink,
  disabled,
  fullWidth,
  size = 'md',
  icon,
  style,
}: Props) {
  const press = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.spring(press, { toValue: to, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const translate = press.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });

  const pad = size === 'lg' ? 20 : size === 'sm' ? 8 : 14;
  const fontSize = size === 'lg' ? 20 : size === 'sm' ? 13 : 16;

  return (
    <Animated.View
      style={[
        styles.wrap,
        fullWidth && { alignSelf: 'stretch' },
        hardShadow(6),
        { transform: [{ translateX: translate }, { translateY: translate }] },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Pressable
        onPressIn={() => {
          if (disabled) return;
          animate(1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }}
        onPressOut={() => animate(0)}
        onPress={disabled ? undefined : onPress}
        style={[styles.btn, { backgroundColor: color, paddingVertical: pad }]}
      >
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={[TYPE.label, styles.label, { color: textColor, fontSize }]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  btn: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { flexShrink: 1 },
  icon: { marginRight: 8 },
});

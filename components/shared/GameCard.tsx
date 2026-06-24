import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GAME_META, GameType } from '@/types';

export function GameCard({ game, index }: { game: GameType; index: number }) {
  const router = useRouter();
  const meta = GAME_META[game];
  const press = useRef(new Animated.Value(0)).current;
  const tilt = index % 2 === 0 ? '-1.5deg' : '1.5deg';

  const animate = (to: number) =>
    Animated.spring(press, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const t = press.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        hardShadow(8),
        { transform: [{ rotate: tilt }, { translateX: t }, { translateY: t }] },
      ]}
    >
      <Pressable
        onPressIn={() => {
          animate(1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }}
        onPressOut={() => animate(0)}
        onPress={() => router.push(`/play/${game}`)}
        style={[styles.card, { backgroundColor: meta.color }]}
      >
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <View style={styles.titleBox}>
          <Text style={[TYPE.h3, styles.title]} numberOfLines={1}>
            {meta.title}
          </Text>
        </View>
        <View style={styles.numBadge}>
          <Text style={styles.num}>0{index + 1}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '47%', marginBottom: 18 },
  card: {
    borderWidth: 4,
    borderColor: COLORS.ink,
    aspectRatio: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  emoji: { fontSize: 52 },
  titleBox: { backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 6, paddingVertical: 4, alignSelf: 'flex-start' },
  title: { fontSize: 15 },
  numBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.ink, paddingHorizontal: 8, paddingVertical: 2 },
  num: { ...TYPE.label, color: COLORS.white, fontSize: 12 },
});

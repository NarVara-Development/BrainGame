import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';

/** Brutalist BrainGame mark: framed brain block with offset accent squares. */
export function BrainLogo({ size = 120, animated = true }: { size?: number; animated?: boolean }) {
  const pop = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start();
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated, pop, float]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const rotate = pop.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '-4deg'] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
      {/* accent squares behind */}
      <View style={[styles.accent, { width: size * 0.34, height: size * 0.34, top: -size * 0.12, left: -size * 0.12, backgroundColor: COLORS.pink }]} />
      <View style={[styles.accent, { width: size * 0.28, height: size * 0.28, bottom: -size * 0.1, right: -size * 0.1, backgroundColor: COLORS.blue }]} />
      {/* main framed block */}
      <Animated.View
        style={[
          styles.block,
          hardShadow(Math.round(size * 0.07)),
          { width: size, height: size, transform: [{ rotate }] },
        ]}
      >
        <Text style={{ fontSize: size * 0.52 }}>🧠</Text>
        <View style={styles.tag}>
          <Text style={[TYPE.label, { fontSize: size * 0.1, color: COLORS.white }]}>NB</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: COLORS.yellow,
    borderWidth: 5,
    borderColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: { position: 'absolute', borderWidth: 4, borderColor: COLORS.ink },
  tag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});

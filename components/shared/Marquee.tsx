import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPE } from '@/theme/theme';

interface Props {
  text: string;
  color?: string;
  textColor?: string;
  speed?: number; // px per second
  height?: number;
}

/** Infinite horizontal scrolling banner — brutalist ticker tape. */
export function Marquee({ text, color = COLORS.ink, textColor = COLORS.yellow, speed = 60, height = 44 }: Props) {
  const x = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const phrase = `   ${text}   ★   `;

  useEffect(() => {
    if (width === 0) return;
    const duration = (width / speed) * 1000;
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: -width,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    x.setValue(0);
    anim.start();
    return () => anim.stop();
  }, [width, speed, x]);

  return (
    <View style={[styles.wrap, { backgroundColor: color, height }]}>
      <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
        <Text
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={[TYPE.label, { color: textColor, fontSize: 16 }]}
          numberOfLines={1}
        >
          {phrase}
        </Text>
        <Text style={[TYPE.label, { color: textColor, fontSize: 16 }]} numberOfLines={1}>
          {phrase}
        </Text>
        <Text style={[TYPE.label, { color: textColor, fontSize: 16 }]} numberOfLines={1}>
          {phrase}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: COLORS.ink,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  track: { flexDirection: 'row', alignItems: 'center' },
});

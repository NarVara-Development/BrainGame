import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPE } from '@/theme/theme';

export interface CardModel {
  key: string;
  pairId: number;
  face: string;
  flipped: boolean;
  matched: boolean;
}

export function MemoryCard({ card, size, onPress }: { card: CardModel; size: number; onPress: () => void }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rot, {
      toValue: card.flipped || card.matched ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [card.flipped, card.matched, rot]);

  const frontRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const fontSize = card.face.length > 2 ? size * 0.26 : size * 0.5;

  return (
    <Pressable
      onPress={() => {
        if (card.flipped || card.matched) return;
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={{ width: size, height: size }}
    >
      {/* back (hidden side) */}
      <Animated.View style={[styles.face, styles.back, { transform: [{ rotateY: frontRotate }] }]}>
        <Text style={styles.q}>?</Text>
      </Animated.View>
      {/* front (revealed) */}
      <Animated.View
        style={[
          styles.face,
          styles.front,
          card.matched && { backgroundColor: COLORS.green },
          { transform: [{ rotateY: backRotate }] },
        ]}
      >
        <Text style={[styles.faceText, { fontSize }]} numberOfLines={2} adjustsFontSizeToFit>
          {card.face}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  back: { backgroundColor: COLORS.blue },
  front: { backgroundColor: COLORS.yellow },
  q: { ...TYPE.h1, color: COLORS.white },
  faceText: { ...TYPE.bodyBold, textAlign: 'center', color: COLORS.ink },
});

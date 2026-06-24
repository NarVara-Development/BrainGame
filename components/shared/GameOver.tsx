import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { Button } from '@/components/ui/Button';
import { BannerSlot } from '@/components/shared/BannerSlot';
import { useGameStore } from '@/stores/gameStore';
import { t } from '@/utils/languageManager';
import { shareResult } from '@/utils/share';

interface Props {
  score: number;
  isNewBest?: boolean;
  accent?: string;
  detail?: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function GameOver({ score, isNewBest, accent = COLORS.yellow, detail, onPlayAgain, onHome }: Props) {
  const lang = useGameStore((s) => s.language);
  const insets = useSafeAreaInsets();
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.scroll}>
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingBottom: 24, paddingTop: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, hardShadow(10), { transform: [{ scale }] }]}>
        <Text style={[TYPE.h1, styles.title]}>{t('gameOver', lang)}</Text>
        <View style={[styles.scoreBox, { backgroundColor: accent }]}>
          <Text style={[TYPE.label, { fontSize: 11 }]}>{t('score', lang)}</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        {isNewBest && (
          <View style={styles.best}>
            <Text style={[TYPE.label, { color: COLORS.white }]}>★ {t('newBest', lang)} ★</Text>
          </View>
        )}
        {detail ? <Text style={[TYPE.body, styles.detail]}>{detail}</Text> : null}
        <Button label={t('playAgain', lang)} color={COLORS.green} fullWidth onPress={onPlayAgain} style={{ marginTop: 18 }} />
        <Button
          label={t('shareResultBtn', lang)}
          color={COLORS.cyan}
          fullWidth
          onPress={() => shareResult(score, lang)}
          style={{ marginTop: 12 }}
        />
        <Button label={t('backHome', lang)} color={COLORS.white} fullWidth onPress={onHome} style={{ marginTop: 12 }} />
      </Animated.View>
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom }}>
        <BannerSlot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.paper,
    borderWidth: 5,
    borderColor: COLORS.ink,
    padding: 24,
  },
  title: { textAlign: 'center', marginBottom: 16 },
  scoreBox: {
    borderWidth: 4,
    borderColor: COLORS.ink,
    alignItems: 'center',
    paddingVertical: 16,
    ...hardShadow(6),
  },
  score: { ...TYPE.hero, fontSize: 56, lineHeight: 58 },
  best: {
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: COLORS.pink,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  detail: { textAlign: 'center', marginTop: 14 },
});

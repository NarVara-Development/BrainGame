import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { streakMultiplier, wrongTimePenalty } from '@/utils/scoreCalculator';
import { getBank } from '@/data';
import { P_shuffle } from '@/utils/rand';
import { t } from '@/utils/languageManager';

const TF_TIME = 60;
interface TFQ { id: string; text: string; answer: boolean }

export function TrueFalseGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('truefalse');

  const [round, setRound] = useState(0);
  const queue = useMemo(() => {
    const bank = getBank<{ questions: TFQ[] }>('truefalse', difficulty, lang).questions;
    return P_shuffle(bank);
  }, [difficulty, lang, round]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;

  const { timeLeft, start, reset, setTimeLeft } = useCountdown(TF_TIME, () => endGame(score));
  const started = useRef(false);
  if (!started.current) { started.current = true; start(); }

  const eq = queue[idx % queue.length];

  const endGame = async (finalScore: number) => {
    setPhase('over');
    const res = await finish({ gameType: 'truefalse', score: finalScore, level: 1, durationSec: TF_TIME, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const answer = (val: boolean) => {
    const ok = val === eq.answer;
    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: ok ? 1 : -1, duration: 80, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
    if (ok) {
      setScore((s) => s + Math.round(100 * streakMultiplier(streak)));
      setStreak((s) => s + 1);
      setWrongStreak(0);
      setCorrect((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      const ws = wrongStreak + 1;
      const lost = wrongTimePenalty(ws);
      setWrongStreak(ws);
      setStreak(0);
      setPenalty(lost);
      setTimeLeft((t) => Math.max(0, t - lost)); // salah = waktu berkurang, beruntun makin besar
      setTimeout(() => setPenalty(0), 700);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setIdx(0); setScore(0); setStreak(0); setCorrect(0); setIsNewBest(false);
    setWrongStreak(0); setPenalty(0);
    setRound((r) => r + 1); setPhase('play'); reset(TF_TIME); start();
  };

  const bg = flash.interpolate({ inputRange: [-1, 0, 1], outputRange: [COLORS.red, COLORS.white, COLORS.green] });

  if (phase === 'over') {
    return (
      <GameOver score={score} isNewBest={isNewBest} accent={COLORS.truefalse}
        detail={`${correct} ${t('correct', lang)}`} onPlayAgain={restart} onHome={onExit} />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={streak} timeLeft={timeLeft} accent={COLORS.truefalse} />
      {penalty > 0 && (
        <View style={styles.penalty}>
          <Text style={[TYPE.label, { color: COLORS.white }]}>−{penalty}s ⏱️</Text>
        </View>
      )}
      <Animated.View style={[styles.eqBox, hardShadow(8), { backgroundColor: bg }]}>
        <Text style={styles.eq}>{eq.text}</Text>
      </Animated.View>
      <Text style={[TYPE.body, { textAlign: 'center', marginVertical: 18, textTransform: 'none' }]}>
        {t('trueFalseHint', lang)}
      </Text>
      <View style={styles.btnRow}>
        <Button label={`✓ ${t('trueLabel', lang)}`} color={COLORS.green} size="lg" fullWidth onPress={() => answer(true)} style={{ flex: 1 }} />
        <Button label={`✕ ${t('falseLabel', lang)}`} color={COLORS.red} textColor={COLORS.white} size="lg" fullWidth onPress={() => answer(false)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: 'center' },
  penalty: { alignSelf: 'center', backgroundColor: COLORS.red, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  eqBox: { borderWidth: 5, borderColor: COLORS.ink, paddingVertical: 40, alignItems: 'center' },
  eq: { ...TYPE.hero, fontSize: 48, lineHeight: 52 },
  btnRow: { flexDirection: 'row', gap: 14 },
});

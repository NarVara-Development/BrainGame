import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { MathKeypad } from '@/components/games/math/MathKeypad';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getMathBank } from '@/data';
import { mathScore, streakMultiplier, wrongTimePenalty } from '@/utils/scoreCalculator';
import { P_shuffle } from '@/utils/rand';
import type { MathQuestion } from '@/types';
import { t } from '@/utils/languageManager';

const TOTAL = 60;

export function MathGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('math');

  const [round, setRound] = useState(0);
  const questions = useMemo<MathQuestion[]>(() => {
    const bank = getMathBank(difficulty, lang).questions as MathQuestion[];
    return P_shuffle(bank);
  }, [difficulty, lang, round]);

  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;

  const { timeLeft, start, reset, setTimeLeft } = useCountdown(TOTAL, () => endGame(score));

  const current = questions[idx % questions.length];

  const begin = () => {
    setPhase('play');
    reset(TOTAL);
    start();
  };

  const endGame = async (finalScore: number) => {
    setPhase('over');
    const res = await finish({
      gameType: 'math',
      score: finalScore,
      level: 1,
      durationSec: TOTAL,
      difficulty,
      language: lang,
    });
    setIsNewBest(res.isNewBest);
  };

  const flashColor = (ok: boolean) => {
    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: ok ? 1 : -1, duration: 90, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start();
  };

  const submit = () => {
    if (input === '' || input === '-') return;
    const val = parseInt(input, 10);
    const ok = val === current.answer;
    if (ok) {
      const gained = mathScore(true, timeLeft, streak);
      setScore((s) => s + gained);
      setStreak((s) => s + 1);
      setWrongStreak(0);
      setCorrectCount((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      const ws = wrongStreak + 1;
      const lost = wrongTimePenalty(ws);
      setWrongStreak(ws);
      setStreak(0);
      setPenalty(lost);
      setTimeLeft((t) => Math.max(0, t - lost)); // salah = waktu berkurang (makin beruntun makin besar)
      setTimeout(() => setPenalty(0), 700);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    flashColor(ok);
    setInput('');
    setIdx((i) => i + 1);
  };

  const bg = flash.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [COLORS.red, COLORS.white, COLORS.green],
  });

  if (phase === 'over') {
    return (
      <GameOver
        score={score}
        isNewBest={isNewBest}
        accent={COLORS.math}
        detail={`${correctCount} ${t('correct', lang)} · ${streakMultiplier(streak).toFixed(1)}×`}
        onPlayAgain={() => {
          setIdx(0); setInput(''); setScore(0); setStreak(0); setCorrectCount(0);
          setWrongStreak(0); setPenalty(0);
          setRound((r) => r + 1); // fresh shuffle of the 5000-soal bank
          begin();
        }}
        onHome={onExit}
      />
    );
  }

  if (phase === 'ready') {
    return (
      <View style={styles.center}>
        <Text style={[TYPE.h1, { textAlign: 'center' }]}>⚡ SPEEDMATH</Text>
        <Text style={[TYPE.body, { textAlign: 'center', marginVertical: 16 }]}>
          {t('mathReady', lang)}
        </Text>
        <Button label={t('start', lang)} color={COLORS.math} onPress={begin} size="lg" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={streak} timeLeft={timeLeft} accent={COLORS.math} />
      {penalty > 0 && (
        <View style={styles.penalty}>
          <Text style={[TYPE.label, { color: COLORS.white }]}>−{penalty}s ⏱️</Text>
        </View>
      )}
      <Animated.View style={[styles.qBox, hardShadow(8), { backgroundColor: bg }]}>
        <Text style={styles.expr}>{current.expression}</Text>
        <View style={styles.inputBox}>
          <Text style={styles.input}>{input === '' ? '?' : input}</Text>
        </View>
      </Animated.View>
      <MathKeypad
        onPress={(d) => setInput((v) => (v.length < 7 ? v + d : v))}
        onDelete={() => setInput((v) => v.slice(0, -1))}
        onToggleSign={() => setInput((v) => (v.startsWith('-') ? v.slice(1) : '-' + v))}
      />
      <Button label={`${t('check', lang)} ✓`} color={COLORS.green} fullWidth onPress={submit} style={{ marginTop: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  penalty: { alignSelf: 'center', backgroundColor: COLORS.red, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  qBox: { borderWidth: 4, borderColor: COLORS.ink, padding: 20, marginBottom: 18, alignItems: 'center' },
  expr: { ...TYPE.hero, fontSize: 46, lineHeight: 50 },
  inputBox: { marginTop: 12, backgroundColor: COLORS.ink, paddingHorizontal: 24, paddingVertical: 6, minWidth: 120, alignItems: 'center' },
  input: { ...TYPE.h1, color: COLORS.yellow },
});

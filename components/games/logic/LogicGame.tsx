import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/stores/gameStore';
import { useFinishGame } from '@/hooks/useGame';
import { getLogicBank } from '@/data';
import { LOGIC_CONFIG } from '@/utils/difficultyManager';
import { logicScore, wrongPointPenalty } from '@/utils/scoreCalculator';
import { P_shuffle } from '@/utils/rand';
import type { LogicQuestion } from '@/types';
import { t } from '@/utils/languageManager';

export function LogicGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('logic');
  const cfg = LOGIC_CONFIG[difficulty];

  const [round, setRound] = useState(0);
  const questions = useMemo<LogicQuestion[]>(() => {
    const bank = getLogicBank(difficulty, lang).questions as LogicQuestion[];
    return P_shuffle(bank).slice(0, cfg.questionCount);
  }, [difficulty, lang, cfg.questionCount, round]);

  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [qTime, setQTime] = useState(cfg.secondsPerQuestion);
  const [isNewBest, setIsNewBest] = useState(false);
  const startedAt = useRef(Date.now());

  const current = questions[idx];

  // per-question countdown
  useEffect(() => {
    if (phase !== 'play' || picked !== null) return;
    if (qTime <= 0) {
      handlePick(-1);
      return;
    }
    const id = setTimeout(() => setQTime((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [qTime, phase, picked]);

  const next = (newScore: number, newCorrect: number) => {
    if (idx + 1 >= questions.length) {
      endGame(newScore, newCorrect);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
      setQTime(cfg.secondsPerQuestion);
      startedAt.current = Date.now();
    }
  };

  const handlePick = (option: number) => {
    if (picked !== null) return;
    setPicked(option);
    const answerTime = (Date.now() - startedAt.current) / 1000;
    const ok = option === current.answer;
    let delta: number;
    if (ok) {
      delta = logicScore({ correct: true, difficulty, answerTimeSec: answerTime, streak: streak + 1 });
      setWrongStreak(0);
    } else {
      const ws = wrongStreak + 1; // escalating penalty for consecutive wrong answers
      setWrongStreak(ws);
      delta = -wrongPointPenalty(ws);
    }
    const ns = Math.max(0, score + delta);
    const nc = ok ? correct + 1 : correct;
    setScore(ns);
    setCorrect(nc);
    setStreak(ok ? streak + 1 : 0);
    Haptics.notificationAsync(
      ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
    setTimeout(() => next(ns, nc), 900);
  };

  const endGame = async (finalScore: number, finalCorrect: number) => {
    setPhase('over');
    const res = await finish({
      gameType: 'logic',
      score: finalScore,
      level: 1,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      difficulty,
      language: lang,
    });
    setIsNewBest(res.isNewBest);
  };

  const restart = () => {
    setIdx(0); setScore(0); setStreak(0); setCorrect(0); setPicked(null); setWrongStreak(0);
    setQTime(cfg.secondsPerQuestion); setIsNewBest(false);
    startedAt.current = Date.now();
    setRound((r) => r + 1); // fresh shuffle of the 5000-soal bank
    setPhase('play');
  };

  if (phase === 'over') {
    return (
      <GameOver
        score={score}
        isNewBest={isNewBest}
        accent={COLORS.logic}
        detail={`${correct}/${questions.length} ${t('correct', lang)}`}
        onPlayAgain={restart}
        onHome={onExit}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={streak} timeLeft={qTime} accent={COLORS.logic} />
      <View style={styles.progress}>
        <Text style={[TYPE.label, { fontSize: 11 }]}>
          {idx + 1} / {questions.length}
        </Text>
      </View>
      <View style={[styles.qBox, hardShadow(8)]}>
        <Text style={styles.question}>{current.question}</Text>
      </View>
      <View style={{ gap: 12, marginTop: 18 }}>
        {current.options.map((opt, i) => {
          const isCorrect = picked !== null && i === current.answer;
          const isWrong = picked === i && i !== current.answer;
          const bg = isCorrect ? COLORS.green : isWrong ? COLORS.red : COLORS.white;
          return (
            <Option key={i} label={opt} letter={String.fromCharCode(65 + i)} bg={bg} onPress={() => handlePick(i)} />
          );
        })}
      </View>
    </View>
  );
}

function Option({ label, letter, bg, onPress }: { label: string; letter: string; bg: string; onPress: () => void }) {
  const press = useRef(new Animated.Value(0)).current;
  const a = (to: number) => Animated.spring(press, { toValue: to, useNativeDriver: true, speed: 50 }).start();
  const tr = press.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });
  return (
    <Animated.View style={[hardShadow(5), { transform: [{ translateX: tr }, { translateY: tr }] }]}>
      <Pressable onPressIn={() => a(1)} onPressOut={() => a(0)} onPress={onPress} style={[styles.option, { backgroundColor: bg }]}>
        <View style={styles.letter}>
          <Text style={[TYPE.label, { color: COLORS.white }]}>{letter}</Text>
        </View>
        <Text style={[TYPE.bodyBold, { flex: 1 }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  progress: { alignSelf: 'flex-start', backgroundColor: COLORS.yellow, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12 },
  qBox: { backgroundColor: COLORS.white, borderWidth: 4, borderColor: COLORS.ink, padding: 20, minHeight: 120, justifyContent: 'center' },
  question: { ...TYPE.h3, fontSize: 20, lineHeight: 28, textTransform: 'none' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 3, borderColor: COLORS.ink, padding: 14 },
  letter: { backgroundColor: COLORS.ink, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
});

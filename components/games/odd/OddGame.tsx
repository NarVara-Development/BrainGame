import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getBank } from '@/data';
import { streakMultiplier, wrongTimePenalty } from '@/utils/scoreCalculator';
import { P_shuffle } from '@/utils/rand';
import { t } from '@/utils/languageManager';

const ODD_TIME = 60;
interface OddQ { id: string; options: string[]; answer: number }

export function OddGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('odd');
  const { width } = useWindowDimensions();

  const [round, setRound] = useState(0);
  const queue = useMemo(() => {
    const bank = getBank<{ questions: OddQ[] }>('odd', difficulty, lang).questions;
    return P_shuffle(bank);
  }, [difficulty, lang, round]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);

  const { timeLeft, start, reset, setTimeLeft } = useCountdown(ODD_TIME, () => endGame(score));
  const started = React.useRef(false);
  if (!started.current) { started.current = true; start(); }

  const q = queue[idx % queue.length];
  const cols = q.options.length <= 4 ? 2 : 3;
  const size = Math.floor((width - 32 - (cols - 1) * 12) / cols);

  const endGame = async (finalScore: number) => {
    setPhase('over');
    const res = await finish({ gameType: 'odd', score: finalScore, level: 1, durationSec: ODD_TIME, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
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
      setTimeLeft((t) => Math.max(0, t - lost));
      setTimeout(() => setPenalty(0), 700);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setTimeout(() => { setPicked(null); setIdx((p) => p + 1); }, 500);
  };

  const restart = () => {
    setIdx(0); setScore(0); setStreak(0); setCorrect(0); setPicked(null); setIsNewBest(false);
    setWrongStreak(0); setPenalty(0);
    setRound((r) => r + 1); setPhase('play'); reset(ODD_TIME); start();
  };

  if (phase === 'over') {
    return (
      <GameOver score={score} isNewBest={isNewBest} accent={COLORS.odd}
        detail={`${correct} ${t('correct', lang)}`} onPlayAgain={restart} onHome={onExit} />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={streak} timeLeft={timeLeft} accent={COLORS.odd} />
      {penalty > 0 && (
        <View style={styles.penalty}>
          <Text style={[TYPE.label, { color: COLORS.white }]}>−{penalty}s ⏱️</Text>
        </View>
      )}
      <View style={[styles.q, hardShadow(5)]}>
        <Text style={[TYPE.h3, { textTransform: 'none' }]}>🔍 {t('findOdd', lang)}</Text>
      </View>
      <View style={[styles.grid, { gap: 12 }]}>
        {q.options.map((emo, i) => {
          const right = picked !== null && i === q.answer;
          const wrong = picked === i && i !== q.answer;
          return (
            <Pressable key={i} onPress={() => pick(i)}
              style={[styles.tile, hardShadow(4), { width: size, height: size },
                right && { backgroundColor: COLORS.green }, wrong && { backgroundColor: COLORS.red }]}>
              <Text style={{ fontSize: size * 0.5 }}>{emo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  penalty: { alignSelf: 'center', backgroundColor: COLORS.red, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  q: { backgroundColor: COLORS.odd, borderWidth: 4, borderColor: COLORS.ink, padding: 16, marginBottom: 18, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: { backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
});

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getBank } from '@/data';
import { P_pick } from '@/utils/rand';
import { wrongPointPenalty } from '@/utils/scoreCalculator';
import { t } from '@/utils/languageManager';

const TAP_TIME = 60;
// grid size per difficulty (numbers shown on the board at once)
const GRID: Record<string, number> = { easy: 9, medium: 16, hard: 25 };

export function TapGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('tap');
  const { width } = useWindowDimensions();

  const count = GRID[difficulty] ?? 9;
  const cols = Math.sqrt(count);
  const [round, setRound] = useState(0);

  // board holds numbers base..base+count-1 arranged via a bank permutation
  const [base, setBase] = useState(1);
  const board = useMemo(() => {
    const bank = getBank<{ questions: { order: number[] }[] }>('tap', difficulty, lang).questions;
    const order = P_pick(bank).order; // permutation of 1..count
    return order.map((v) => base - 1 + v);
  }, [base, difficulty, lang, round]);

  const [next, setNext] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);

  const { timeLeft, start, reset } = useCountdown(TAP_TIME, () => endGame(score));
  const started = React.useRef(false);
  if (!started.current) { started.current = true; start(); }

  const size = Math.floor((width - 32 - (cols - 1) * 10) / cols);

  const endGame = async (finalScore: number) => {
    setPhase('over');
    const res = await finish({ gameType: 'tap', score: finalScore, level: 1, durationSec: TAP_TIME, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const tap = (n: number) => {
    if (n !== next) {
      const ws = wrongStreak + 1;
      setWrongStreak(ws);
      setStreak(0);
      setScore((s) => Math.max(0, s - wrongPointPenalty(ws)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    const newNext = next + 1;
    setNext(newNext);
    setStreak((s) => s + 1);
    setWrongStreak(0);
    setScore((s) => s + 25 + streak * 5);
    // when the whole board is cleared, load the next batch
    if (newNext > base + count - 1) {
      setBase(newNext);
      setRound((r) => r + 1);
    }
  };

  const restart = () => {
    setBase(1); setNext(1); setScore(0); setStreak(0); setWrongStreak(0); setIsNewBest(false);
    setRound((r) => r + 1); setPhase('play'); reset(TAP_TIME); start();
  };

  if (phase === 'over') {
    return (
      <GameOver
        score={score}
        isNewBest={isNewBest}
        accent={COLORS.tap}
        detail={`${next - 1} ${t('numbers', lang)}`}
        onPlayAgain={restart}
        onHome={onExit}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={streak} timeLeft={timeLeft} accent={COLORS.tap} />
      <View style={[styles.target, hardShadow(5)]}>
        <Text style={[TYPE.label, { fontSize: 11 }]}>{t('tapInOrder', lang)}</Text>
        <Text style={[TYPE.h1, { color: COLORS.ink }]}>→ {next}</Text>
      </View>
      <View style={[styles.grid, { gap: 10 }]}>
        {board.map((n) => {
          const done = n < next;
          return (
            <Pressable
              key={n}
              onPress={() => tap(n)}
              style={[
                styles.tile,
                hardShadow(4),
                { width: size, height: size },
                done && { backgroundColor: COLORS.green, opacity: 0.5 },
              ]}
            >
              <Text style={[TYPE.h2, { fontSize: size * 0.34 }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  target: { backgroundColor: COLORS.tap, borderWidth: 4, borderColor: COLORS.ink, paddingVertical: 12, alignItems: 'center', marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: { backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
});

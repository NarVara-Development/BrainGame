import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { useGameStore } from '@/stores/gameStore';
import { useFinishGame } from '@/hooks/useGame';
import { getBank } from '@/data';
import { P_pick } from '@/utils/rand';
import { t } from '@/utils/languageManager';

interface SimonQ { id: string; tiles: number; seq: number[] }
const PALETTE = [COLORS.red, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.pink, COLORS.cyan, COLORS.orange, COLORS.purple, COLORS.simon];

export function SimonGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('simon');
  const { width } = useWindowDimensions();

  const [round, setRound] = useState(0);
  const puzzle = useMemo(() => P_pick(getBank<{ questions: SimonQ[] }>('simon', difficulty, lang).questions), [difficulty, lang, round]);
  const tiles = puzzle.tiles;
  const seq = puzzle.seq;

  const [level, setLevel] = useState(1); // how many in the pattern this round
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState<'watch' | 'input' | 'over'>('watch');
  const [score, setScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const inputPos = useRef(0);
  const mounted = useRef(true);
  const started = useRef(false);

  const cols = tiles <= 4 ? 2 : 3;
  const gap = 12;
  const size = Math.min(110, Math.floor((width - 32 - (cols - 1) * gap) / cols));

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const playPattern = React.useCallback(async (len: number) => {
    setPhase('watch');
    inputPos.current = 0;
    await sleep(500);
    for (let i = 0; i < len; i++) {
      if (!mounted.current) return;
      setLit(seq[i]);
      Haptics.selectionAsync().catch(() => {});
      await sleep(420);
      setLit(-1);
      await sleep(180);
    }
    if (!mounted.current) return;
    setPhase('input');
  }, [seq]);

  React.useEffect(() => {
    mounted.current = true;
    if (!started.current) { started.current = true; playPattern(1); }
    return () => { mounted.current = false; };
  }, [playPattern]);

  const endGame = async (finalScore: number) => {
    setPhase('over');
    const res = await finish({ gameType: 'simon', score: finalScore, level, durationSec: 0, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const tap = async (tile: number) => {
    if (phase !== 'input') return;
    setLit(tile);
    setTimeout(() => mounted.current && setLit(-1), 150);
    if (tile !== seq[inputPos.current]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      endGame(score);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    inputPos.current += 1;
    if (inputPos.current >= level) {
      const ns = score + level * 20;
      setScore(ns);
      const nextLevel = Math.min(level + 1, seq.length);
      setLevel(nextLevel);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await sleep(450);
      playPattern(nextLevel);
    }
  };

  const restart = () => {
    setLevel(1); setScore(0); setIsNewBest(false); inputPos.current = 0;
    setRound((r) => r + 1);
    setTimeout(() => playPattern(1), 50);
  };

  if (phase === 'over') {
    return (
      <GameOver score={score} isNewBest={isNewBest} accent={COLORS.simon}
        detail={`${t('round', lang)} ${level}`} onPlayAgain={restart} onHome={onExit} />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={level} accent={COLORS.simon} />
      <View style={[styles.status, { backgroundColor: phase === 'watch' ? COLORS.yellow : COLORS.green }]}>
        <Text style={[TYPE.h3, { fontSize: 16 }]}>
          {phase === 'watch' ? `👀 ${t('watch', lang)}` : `👆 ${t('yourTurn', lang)}`} · {t('round', lang)} {level}
        </Text>
      </View>
      <View style={[styles.grid, { gap, maxWidth: size * cols + gap * (cols - 1) }]}>
        {Array.from({ length: tiles }, (_, i) => (
          <Pressable
            key={i}
            disabled={phase !== 'input'}
            onPress={() => tap(i)}
            style={[
              styles.tile,
              hardShadow(5),
              { width: size, height: size, backgroundColor: PALETTE[i % PALETTE.length], opacity: lit === i ? 1 : 0.45 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, alignItems: 'center' },
  status: { alignSelf: 'stretch', borderWidth: 4, borderColor: COLORS.ink, paddingVertical: 14, alignItems: 'center', marginBottom: 26, ...hardShadow(5) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: { borderWidth: 4, borderColor: COLORS.ink },
});

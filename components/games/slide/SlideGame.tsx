import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getBank } from '@/data';
import { timeBonus } from '@/utils/scoreCalculator';
import { P_pick } from '@/utils/rand';
import { t } from '@/utils/languageManager';

const SLIDE_TIME = 240;
interface SlideQ { id: string; size: number; tiles: number[] }

export function SlideGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('slide');
  const { width } = useWindowDimensions();

  const [round, setRound] = useState(0);
  const puzzle = useMemo(
    () => P_pick(getBank<{ questions: SlideQ[] }>('slide', difficulty, lang).questions),
    [difficulty, lang, round]
  );
  const size = puzzle.size;
  const cells = size * size;

  const [tiles, setTiles] = useState<number[]>(puzzle.tiles);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);

  // re-init board when puzzle changes (replay)
  React.useEffect(() => { setTiles(puzzle.tiles); setMoves(0); }, [puzzle]);

  const { timeLeft, start, reset } = useCountdown(SLIDE_TIME, () => endGame(score, false));
  const started = React.useRef(false);
  if (!started.current) { started.current = true; start(); }

  const gap = 8;
  const tileSize = Math.floor((width - 32 - (size - 1) * gap) / size);
  const isSolved = (arr: number[]) => arr.every((v, i) => v === (i + 1) % cells);

  const endGame = async (base: number, solved: boolean) => {
    setPhase('over');
    let final = base;
    if (solved) final = Math.max(200, 2500 - moves * 12) + timeBonus(timeLeft, 4);
    setScore(final);
    const res = await finish({ gameType: 'slide', score: final, level: 1, durationSec: SLIDE_TIME - timeLeft, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const tap = (i: number) => {
    const blank = tiles.indexOf(0);
    const br = Math.floor(blank / size), bc = blank % size;
    const ir = Math.floor(i / size), ic = i % size;
    if (Math.abs(br - ir) + Math.abs(bc - ic) !== 1) return; // not adjacent
    const next = tiles.slice();
    [next[blank], next[i]] = [next[i], next[blank]];
    setTiles(next);
    setMoves((m) => m + 1);
    Haptics.selectionAsync().catch(() => {});
    if (isSolved(next)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => endGame(0, true), 300);
    }
  };

  const restart = () => {
    setScore(0); setIsNewBest(false); setRound((r) => r + 1);
    setPhase('play'); reset(SLIDE_TIME); start();
  };

  if (phase === 'over') {
    return (
      <GameOver score={score} isNewBest={isNewBest} accent={COLORS.slide}
        detail={`${moves} ${t('moves', lang)}`} onPlayAgain={restart} onHome={onExit} />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={moves} timeLeft={timeLeft} accent={COLORS.slide} />
      <View style={styles.hint}>
        <Text style={[TYPE.label, { fontSize: 11 }]}>🔀 {t('arrangeTiles', lang)} · {moves} {t('moves', lang)}</Text>
      </View>
      <View style={[styles.board, hardShadow(6), { width: tileSize * size + gap * (size - 1) + 8, height: tileSize * size + gap * (size - 1) + 8 }]}>
        {tiles.map((v, i) =>
          v === 0 ? null : (
            <Pressable
              key={v}
              onPress={() => tap(i)}
              style={[
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  position: 'absolute',
                  left: 4 + (i % size) * (tileSize + gap),
                  top: 4 + Math.floor(i / size) * (tileSize + gap),
                },
              ]}
            >
              <Text style={[TYPE.h2, { fontSize: tileSize * 0.4 }]}>{v}</Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, alignItems: 'center' },
  hint: { alignSelf: 'stretch', backgroundColor: COLORS.slide, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 18, alignItems: 'center' },
  board: { backgroundColor: COLORS.paperDark, borderWidth: 4, borderColor: COLORS.ink },
  tile: { backgroundColor: COLORS.slide, borderWidth: 3, borderColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
});

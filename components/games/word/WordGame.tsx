import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getWordBank } from '@/data';
import { WORD_CONFIG } from '@/utils/difficultyManager';
import { wordPerfectBonus, wordTimeBonus, wordWordFound, wrongPointPenalty } from '@/utils/scoreCalculator';
import { buildWordGrid, lineCells } from '@/utils/wordSearch';
import { P_pick } from '@/utils/rand';
import type { WordPuzzle } from '@/types';
import { t } from '@/utils/languageManager';

export function WordGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('word');
  const { width } = useWindowDimensions();
  const cfg = WORD_CONFIG[difficulty];

  const [round, setRound] = useState(0);
  const puzzle = useMemo(() => P_pick(getWordBank(difficulty, lang).puzzles as WordPuzzle[]), [difficulty, lang, round]);
  const board = useMemo(() => buildWordGrid(puzzle.words, cfg.grid), [puzzle, cfg.grid]);

  const [found, setFound] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [first, setFirst] = useState<[number, number] | null>(null);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);

  const { timeLeft, start, reset } = useCountdown(cfg.seconds, () => endGame(score, false));
  const started = React.useRef(false);
  if (!started.current) { started.current = true; start(); }

  const cell = Math.floor((width - 32 - 2) / board.size);

  const endGame = async (base: number, perfect: boolean) => {
    setPhase('over');
    let final = base + wordTimeBonus(timeLeft);
    if (perfect) final += wordPerfectBonus();
    setScore(final);
    const res = await finish({ gameType: 'word', score: final, level: 1, durationSec: cfg.seconds - timeLeft, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const tap = (r: number, c: number) => {
    if (!first) {
      setFirst([r, c]);
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    const cells = lineCells(first[0], first[1], r, c);
    setFirst(null);
    if (!cells) return;
    const word = cells.map(([rr, cc]) => board.grid[rr][cc]).join('');
    const rev = word.split('').reverse().join('');
    const target = board.placed.find((w) => (w === word || w === rev) && !found.has(w));
    if (target) {
      const nf = new Set(found); nf.add(target); setFound(nf);
      const nc = new Set(foundCells); cells.forEach(([rr, cc]) => nc.add(`${rr},${cc}`)); setFoundCells(nc);
      const ns = score + wordWordFound(); setScore(ns);
      setWrongStreak(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (nf.size === board.placed.length) setTimeout(() => endGame(ns, true), 400);
    } else {
      const ws = wrongStreak + 1; // wrong selection costs points, escalating
      setWrongStreak(ws);
      setScore((s) => Math.max(0, s - wrongPointPenalty(ws)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const restart = () => {
    setFound(new Set()); setFoundCells(new Set()); setFirst(null);
    setScore(0); setIsNewBest(false); setWrongStreak(0);
    setRound((r) => r + 1); // new puzzle from the 5000-soal bank
    setPhase('play');
    reset(cfg.seconds); start();
  };

  if (phase === 'over') {
    return (
      <GameOver
        score={score}
        isNewBest={isNewBest}
        accent={COLORS.word}
        detail={`${found.size}/${board.placed.length} ${t('found', lang)}`}
        onPlayAgain={restart}
        onHome={onExit}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} timeLeft={timeLeft} accent={COLORS.word} />
      <View style={styles.themeTag}>
        <Text style={[TYPE.label, { fontSize: 11 }]}>🔤 {puzzle.theme}</Text>
      </View>
      <View style={[styles.gridBox, hardShadow(6)]}>
        {board.grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((ch, c) => {
              const sel = first && first[0] === r && first[1] === c;
              const isFound = foundCells.has(`${r},${c}`);
              return (
                <Pressable
                  key={c}
                  onPress={() => tap(r, c)}
                  style={[
                    styles.cell,
                    { width: cell, height: cell },
                    isFound && { backgroundColor: COLORS.green },
                    sel && { backgroundColor: COLORS.yellow },
                  ]}
                >
                  <Text style={[styles.letter, { fontSize: cell * 0.46 }]}>{ch}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.words}>
        {board.placed.map((w) => (
          <View key={w} style={[styles.wordChip, found.has(w) && { backgroundColor: COLORS.green }]}>
            <Text style={[TYPE.label, { fontSize: 11, textDecorationLine: found.has(w) ? 'line-through' : 'none' }]}>{w}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  themeTag: { alignSelf: 'flex-start', backgroundColor: COLORS.green, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12 },
  gridBox: { borderWidth: 3, borderColor: COLORS.ink, backgroundColor: COLORS.white, alignSelf: 'center' },
  cell: { borderWidth: 0.5, borderColor: '#cbb', alignItems: 'center', justifyContent: 'center' },
  letter: { ...TYPE.bodyBold, color: COLORS.ink },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  wordChip: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.ink, paddingHorizontal: 8, paddingVertical: 4 },
});

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getCrosswordBank } from '@/data';
import { crosswordCompleteBonus, crosswordLetter, crosswordWordBonus, timeBonus } from '@/utils/scoreCalculator';
import { P_pick } from '@/utils/rand';
import type { CrosswordPuzzle } from '@/types';
import { t } from '@/utils/languageManager';

const CW_TIME = 300;

export function CrosswordGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('crossword');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [round, setRound] = useState(0);
  const puzzle = useMemo(() => P_pick(getCrosswordBank(difficulty, lang).puzzles as CrosswordPuzzle[]), [difficulty, lang, round]);
  const size = puzzle.size;
  const cell = Math.floor((width - 32 - 2) / size);

  // playable cells = where grid has a letter
  const isCell = (r: number, c: number) => Boolean(puzzle.grid[r]?.[c]);

  const [entries, setEntries] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);

  const { timeLeft, start, reset } = useCountdown(CW_TIME, () => endGame());
  const started = React.useRef(false);
  if (!started.current) { started.current = true; start(); }

  // number map for display
  const numberMap = useMemo(() => {
    const m: Record<string, number> = {};
    [...puzzle.clues.across, ...puzzle.clues.down].forEach((cl) => {
      m[`${cl.row},${cl.col}`] = cl.number;
    });
    return m;
  }, [puzzle]);

  // which directions each cell participates in (for auto-advance)
  const cellDirs = useMemo(() => {
    const m: Record<string, { across: boolean; down: boolean }> = {};
    const mark = (cl: { row: number; col: number; answer: string }, dir: 'across' | 'down') => {
      const dr = dir === 'down' ? 1 : 0;
      const dc = dir === 'across' ? 1 : 0;
      for (let i = 0; i < cl.answer.length; i++) {
        const key = `${cl.row + dr * i},${cl.col + dc * i}`;
        m[key] = m[key] || { across: false, down: false };
        m[key][dir] = true;
      }
    };
    puzzle.clues.across.forEach((cl) => mark(cl, 'across'));
    puzzle.clues.down.forEach((cl) => mark(cl, 'down'));
    return m;
  }, [puzzle]);

  const [dir, setDir] = useState<'across' | 'down'>('across');
  const inputRefs = React.useRef<Record<string, TextInput | null>>({});

  // cells belonging to the currently selected word (for highlight)
  const activeCells = React.useMemo(() => {
    const set = new Set<string>();
    if (!selected) return set;
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    let r = selected[0];
    let c = selected[1];
    while (isCell(r - dr, c - dc)) { r -= dr; c -= dc; }
    while (isCell(r, c)) { set.add(`${r},${c}`); r += dr; c += dc; }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, dir, puzzle]);

  const focusCell = (r: number, c: number) => {
    const ref = inputRefs.current[`${r},${c}`];
    if (ref) ref.focus();
    setSelected([r, c]);
  };

  // pick a cell and choose a sensible typing direction (toggle via the DIR button)
  const selectCell = (r: number, c: number) => {
    const dirs = cellDirs[`${r},${c}`] ?? { across: true, down: false };
    // only force direction if the current one isn't valid for this cell
    if (dir === 'across' && !dirs.across) setDir('down');
    else if (dir === 'down' && !dirs.down) setDir('across');
    focusCell(r, c);
  };

  // tap a clue → jump to its first cell and set the right direction
  const selectClue = (clue: { row: number; col: number }, clueDir: 'across' | 'down') => {
    setDir(clueDir);
    focusCell(clue.row, clue.col);
  };

  const advance = (r: number, c: number, back = false) => {
    const step = back ? -1 : 1;
    const nr = dir === 'down' ? r + step : r;
    const nc = dir === 'across' ? c + step : c;
    if (isCell(nr, nc)) focusCell(nr, nc);
  };

  const onCellChange = (r: number, c: number, text: string) => {
    const ch = text.slice(-1).toUpperCase().replace(/[^A-Z]/g, '');
    setEntries((e) => ({ ...e, [`${r},${c}`]: ch }));
    if (ch) advance(r, c); // auto-jump to next box so you can type continuously
  };

  const onCellKey = (r: number, c: number, key: string) => {
    if (key === 'Backspace') {
      const cur = entries[`${r},${c}`] || '';
      if (!cur) {
        // already empty → step back and clear previous
        const pr = dir === 'down' ? r - 1 : r;
        const pc = dir === 'across' ? c - 1 : c;
        if (isCell(pr, pc)) {
          setEntries((e) => ({ ...e, [`${pr},${pc}`]: '' }));
          focusCell(pr, pc);
        }
      }
    }
  };

  const evaluate = () => {
    let correctLetters = 0, completeWords = 0, totalCells = 0;
    const allClues = [...puzzle.clues.across, ...puzzle.clues.down];
    let allDone = true;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (isCell(r, c)) {
          totalCells++;
          if ((entries[`${r},${c}`] || '').toUpperCase() === puzzle.grid[r][c]) correctLetters++;
          else allDone = false;
        }
    allClues.forEach((cl) => {
      const dr = puzzle.clues.across.includes(cl) ? 0 : 1;
      const dc = dr === 0 ? 1 : 0;
      let ok = true;
      for (let i = 0; i < cl.answer.length; i++) {
        const key = `${cl.row + dr * i},${cl.col + dc * i}`;
        if ((entries[key] || '').toUpperCase() !== cl.answer[i]) { ok = false; break; }
      }
      if (ok) completeWords++;
    });
    return { correctLetters, completeWords, allDone, totalCells };
  };

  const check = () => {
    const { correctLetters, completeWords, allDone } = evaluate();
    let s = correctLetters * crosswordLetter() + completeWords * crosswordWordBonus();
    if (allDone) s += crosswordCompleteBonus() + timeBonus(timeLeft, 4);
    setScore(s);
    Haptics.notificationAsync(allDone ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (allDone) setTimeout(() => endGame(s), 400);
    return s;
  };

  const endGame = async (preset?: number) => {
    const finalScore = preset ?? check();
    setPhase('over');
    const res = await finish({ gameType: 'crossword', score: finalScore, level: 1, durationSec: CW_TIME - timeLeft, difficulty, language: lang });
    setIsNewBest(res.isNewBest);
  };

  const restart = () => {
    setEntries({}); setSelected(null); setScore(0); setIsNewBest(false);
    setRound((r) => r + 1); // new puzzle from the 5000-soal bank
    setPhase('play');
    reset(CW_TIME); start();
  };

  if (phase === 'over') {
    const { completeWords } = evaluate();
    return (
      <GameOver
        score={score}
        isNewBest={isNewBest}
        accent={COLORS.crossword}
        detail={`${completeWords} ${t('wordsSolved', lang)}`}
        onPlayAgain={restart}
        onHome={onExit}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} timeLeft={timeLeft} accent={COLORS.crossword} />
      <View style={styles.dirRow}>
        <Pressable onPress={() => setDir((d) => (d === 'across' ? 'down' : 'across'))} style={[styles.dirChip, hardShadow(3)]}>
          <Text style={[TYPE.label, { fontSize: 12 }]}>
            {dir === 'across' ? `↔ ${t('across', lang)}` : `↕ ${t('down', lang)}`}  ⇄
          </Text>
        </Pressable>
        <Text style={[TYPE.body, { fontSize: 11, color: COLORS.muted, flex: 1, textTransform: 'none' }]}>
          {t('typeContinuously', lang)}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View style={[styles.gridBox, hardShadow(6)]}>
          {puzzle.grid.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((ch, c) => {
                if (!ch) return <View key={c} style={{ width: cell, height: cell }} />;
                const key = `${r},${c}`;
                const sel = selected && selected[0] === r && selected[1] === c;
                const active = activeCells.has(key);
                const num = numberMap[key];
                return (
                  <Pressable
                    key={c}
                    onPress={() => selectCell(r, c)}
                    style={[
                      styles.cell,
                      { width: cell, height: cell },
                      active && styles.cellActive,
                      sel && styles.cellSel,
                    ]}
                  >
                    {num ? <Text style={styles.num}>{num}</Text> : null}
                    <TextInput
                      ref={(el) => { inputRefs.current[key] = el; }}
                      value={entries[key] || ''}
                      onChangeText={(tx) => onCellChange(r, c, tx)}
                      onKeyPress={(e) => onCellKey(r, c, e.nativeEvent.key)}
                      onFocus={() => selectCell(r, c)}
                      maxLength={1}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[styles.input, { fontSize: cell * 0.5 }]}
                    />
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Button label={`${t('check', lang)} ✓`} color={COLORS.crossword} fullWidth onPress={check} style={{ marginVertical: 14 }} />

        <Clues title={t('across', lang)} clues={puzzle.clues.across} active={dir === 'across' ? selected : null} onPick={(cl) => selectClue(cl, 'across')} />
        <Clues title={t('down', lang)} clues={puzzle.clues.down} active={dir === 'down' ? selected : null} onPick={(cl) => selectClue(cl, 'down')} />
      </ScrollView>
    </View>
  );
}

function Clues({
  title,
  clues,
  active,
  onPick,
}: {
  title: string;
  clues: CrosswordPuzzle['clues']['across'];
  active: [number, number] | null;
  onPick: (clue: CrosswordPuzzle['clues']['across'][number]) => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.clueHead}>
        <Text style={[TYPE.label, { color: COLORS.white }]}>{title}</Text>
      </View>
      {clues.map((cl) => {
        const isActive = active && active[0] === cl.row && active[1] === cl.col;
        return (
          <Pressable
            key={`${cl.number}-${cl.answer}`}
            onPress={() => onPick(cl)}
            style={[styles.clueRow, isActive && { backgroundColor: COLORS.yellow }]}
          >
            <Text style={[TYPE.body, styles.clueLine]}>
              <Text style={{ fontWeight: '900' }}>{cl.number}. </Text>
              {cl.clue} ({cl.answer.length})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  dirRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dirChip: { backgroundColor: COLORS.yellow, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 8 },
  gridBox: { borderWidth: 4, borderColor: COLORS.ink, alignSelf: 'center', backgroundColor: COLORS.paper, padding: 3 },
  cell: { borderWidth: 1, borderColor: COLORS.ink, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  cellActive: { backgroundColor: '#ffe0ef' },
  cellSel: { backgroundColor: COLORS.yellow },
  num: { position: 'absolute', top: 1, left: 2, fontSize: 8, fontWeight: '700', color: COLORS.muted },
  input: { width: '100%', height: '100%', textAlign: 'center', fontWeight: '900', color: COLORS.ink, padding: 0 },
  clueHead: { backgroundColor: COLORS.ink, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  clueRow: { paddingVertical: 5, paddingHorizontal: 4, borderWidth: 2, borderColor: 'transparent' },
  clueLine: { fontSize: 14, textTransform: 'none' },
});

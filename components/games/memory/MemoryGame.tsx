import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPE } from '@/theme/theme';
import { GameHeader } from '@/components/shared/GameHeader';
import { GameOver } from '@/components/shared/GameOver';
import { CardModel, MemoryCard } from '@/components/games/memory/MemoryCard';
import { useGameStore } from '@/stores/gameStore';
import { useCountdown, useFinishGame } from '@/hooks/useGame';
import { getMemoryBank } from '@/data';
import { MEMORY_CONFIG } from '@/utils/difficultyManager';
import { memoryCombo, memoryEfficiencyBonus, memoryPairFound, timeBonus, wrongTimePenalty } from '@/utils/scoreCalculator';
import { P_pick, P_shuffle } from '@/utils/rand';
import type { MemoryCardSet } from '@/types';
import { t } from '@/utils/languageManager';

const MEM_TIME = 120;

function buildDeck(set: MemoryCardSet, pairCount: number): CardModel[] {
  const pairs = set.pairs.slice(0, pairCount);
  const cards: CardModel[] = [];
  pairs.forEach((p, i) => {
    cards.push({ key: `${i}a`, pairId: i, face: p[0], flipped: false, matched: false });
    cards.push({ key: `${i}b`, pairId: i, face: p[1], flipped: false, matched: false });
  });
  return P_shuffle(cards);
}

export function MemoryGame({ onExit }: { onExit: () => void }) {
  const lang = useGameStore((s) => s.language);
  const difficulty = useGameStore((s) => s.difficulty);
  const finish = useFinishGame('memory');
  const { width } = useWindowDimensions();
  const cfg = MEMORY_CONFIG[difficulty];

  const set = useMemo(() => P_pick(getMemoryBank(difficulty, lang).sets as MemoryCardSet[]), [difficulty, lang]);

  const [cards, setCards] = useState<CardModel[]>(() => buildDeck(set, cfg.pairs));
  const [open, setOpen] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [flips, setFlips] = useState(0);
  const [combo, setCombo] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [isNewBest, setIsNewBest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);

  const { timeLeft, start, reset, setTimeLeft } = useCountdown(MEM_TIME, () => endGame(score, false));
  const started = React.useRef(false);
  if (!started.current) {
    started.current = true;
    start();
  }

  const cols = cfg.cols;
  const gap = 8;
  const cardSize = Math.floor((width - 32 - gap * (cols - 1)) / cols);

  const endGame = async (base: number, perfect: boolean) => {
    setPhase('over');
    let final = base;
    if (perfect) {
      final += timeBonus(timeLeft, 5) + memoryEfficiencyBonus(cfg.pairs, flips);
      setScore(final);
    }
    const res = await finish({
      gameType: 'memory',
      score: final,
      level: 1,
      durationSec: MEM_TIME - timeLeft,
      difficulty,
      language: lang,
    });
    setIsNewBest(res.isNewBest);
  };

  const flip = (index: number) => {
    if (busy || open.includes(index)) return;
    const card = cards[index];
    if (card.flipped || card.matched) return;

    const newCards = cards.slice();
    newCards[index] = { ...card, flipped: true };
    setCards(newCards);
    setFlips((f) => f + 1);

    const nowOpen = [...open, index];
    setOpen(nowOpen);

    if (nowOpen.length === 2) {
      setBusy(true);
      const [a, b] = nowOpen;
      const isMatch = newCards[a].pairId === newCards[b].pairId;
      setTimeout(() => {
        const updated = newCards.slice();
        if (isMatch) {
          updated[a] = { ...updated[a], matched: true };
          updated[b] = { ...updated[b], matched: true };
          const newCombo = combo + 1;
          const gained = memoryPairFound() + memoryCombo(newCombo);
          const ns = score + gained;
          const mp = matchedPairs + 1;
          setScore(ns);
          setCombo(newCombo);
          setMatchedPairs(mp);
          setWrongStreak(0);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          if (mp === cfg.pairs) {
            setTimeout(() => endGame(ns, true), 400);
          }
        } else {
          updated[a] = { ...updated[a], flipped: false };
          updated[b] = { ...updated[b], flipped: false };
          setCombo(0);
          const ws = wrongStreak + 1; // salah pasangan = waktu berkurang, beruntun makin besar
          setWrongStreak(ws);
          setTimeLeft((tt) => Math.max(0, tt - wrongTimePenalty(ws)));
        }
        setCards(updated);
        setOpen([]);
        setBusy(false);
      }, 700);
    }
  };

  if (phase === 'over') {
    return (
      <GameOver
        score={score}
        isNewBest={isNewBest}
        accent={COLORS.memory}
        detail={`${matchedPairs}/${cfg.pairs} ${t('pairs', lang)} · ${flips} ${t('flips', lang)}`}
        onPlayAgain={() => {
          setCards(buildDeck(P_pick(getMemoryBank(difficulty, lang).sets as MemoryCardSet[]), cfg.pairs));
          setOpen([]); setScore(0); setFlips(0); setCombo(0); setMatchedPairs(0); setWrongStreak(0);
          setPhase('play'); reset(MEM_TIME); start();
        }}
        onHome={onExit}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <GameHeader score={score} streak={combo} timeLeft={timeLeft} accent={COLORS.memory} />
      <View style={styles.themeTag}>
        <Text style={[TYPE.label, { fontSize: 11 }]}>🃏 {set.theme} · {flips} {t('flips', lang)}</Text>
      </View>
      <View style={[styles.grid, { gap }]}>
        {cards.map((c, i) => (
          <MemoryCard key={c.key} card={c} size={cardSize} onPress={() => flip(i)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  themeTag: { alignSelf: 'flex-start', backgroundColor: COLORS.cyan, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});

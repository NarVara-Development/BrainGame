import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';
import { GAME_META, GameType } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { MathGame } from '@/components/games/math/MathGame';
import { LogicGame } from '@/components/games/logic/LogicGame';
import { MemoryGame } from '@/components/games/memory/MemoryGame';
import { WordGame } from '@/components/games/word/WordGame';
import { CrosswordGame } from '@/components/games/crossword/CrosswordGame';
import { TapGame } from '@/components/games/tap/TapGame';
import { TrueFalseGame } from '@/components/games/truefalse/TrueFalseGame';
import { SlideGame } from '@/components/games/slide/SlideGame';
import { OddGame } from '@/components/games/odd/OddGame';
import { SimonGame } from '@/components/games/simon/SimonGame';

export default function PlayScreen() {
  const { game } = useLocalSearchParams<{ game: GameType }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startSession = useGameStore((s) => s.startSession);

  useEffect(() => {
    if (game) startSession(game);
  }, [game, startSession]);

  const exit = () => router.back();
  const meta = game ? GAME_META[game] : null;

  const render = () => {
    switch (game) {
      case 'math': return <MathGame onExit={exit} />;
      case 'logic': return <LogicGame onExit={exit} />;
      case 'memory': return <MemoryGame onExit={exit} />;
      case 'word': return <WordGame onExit={exit} />;
      case 'crossword': return <CrosswordGame onExit={exit} />;
      case 'tap': return <TapGame onExit={exit} />;
      case 'truefalse': return <TrueFalseGame onExit={exit} />;
      case 'slide': return <SlideGame onExit={exit} />;
      case 'odd': return <OddGame onExit={exit} />;
      case 'simon': return <SimonGame onExit={exit} />;
      default: return null;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.topbar, { backgroundColor: meta?.color ?? COLORS.yellow }]}>
        <Pressable onPress={exit} style={[styles.backBtn, hardShadow(3)]}>
          <Text style={[TYPE.label, { fontSize: 14 }]}>← EXIT</Text>
        </Pressable>
        <Text style={[TYPE.h3, { fontSize: 16 }]}>{meta ? `${meta.emoji} ${meta.title}` : ''}</Text>
        <View style={{ width: 64 }} />
      </View>
      <View style={{ flex: 1 }}>{render()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 3, borderColor: COLORS.ink },
  backBtn: { backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.ink, paddingHorizontal: 10, paddingVertical: 6, width: 64 },
});

import { create } from 'zustand';
import type { Difficulty, GameType, Language } from '@/types';
import { storage } from '@/lib/storage';

const DIFF_KEY = 'pref_difficulty';
const LANG_KEY = 'pref_language';

interface GameState {
  language: Language;
  difficulty: Difficulty;
  // live session
  activeGame: GameType | null;
  score: number;
  streak: number;
  setLanguage: (lang: Language) => void;
  setDifficulty: (d: Difficulty) => void;
  startSession: (game: GameType) => void;
  addScore: (delta: number) => void;
  setStreak: (n: number) => void;
  endSession: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  language: (storage.getString(LANG_KEY) as Language) ?? 'id',
  difficulty: (storage.getString(DIFF_KEY) as Difficulty) ?? 'easy',
  activeGame: null,
  score: 0,
  streak: 0,

  setLanguage: (language) => {
    storage.set(LANG_KEY, language);
    set({ language });
  },
  setDifficulty: (difficulty) => {
    storage.set(DIFF_KEY, difficulty);
    set({ difficulty });
  },
  startSession: (activeGame) => set({ activeGame, score: 0, streak: 0 }),
  addScore: (delta) => set((s) => ({ score: Math.max(0, s.score + delta) })),
  setStreak: (streak) => set({ streak }),
  endSession: () => set({ activeGame: null }),
}));

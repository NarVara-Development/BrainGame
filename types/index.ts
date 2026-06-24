// ============================================================
// NarVara BrainGame — Shared Types
// ============================================================

export type GameType =
  | 'logic' | 'math' | 'word' | 'crossword' | 'memory'
  | 'tap' | 'truefalse' | 'slide' | 'odd' | 'simon';
export type Language = 'id' | 'en';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const GAME_TYPES: GameType[] = [
  'logic', 'math', 'word', 'crossword', 'memory',
  'tap', 'truefalse', 'slide', 'odd', 'simon',
];
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const GAME_META: Record<GameType, { emoji: string; title: string; color: string }> = {
  logic: { emoji: '🧩', title: 'LogicPuzzle', color: '#6366f1' },
  math: { emoji: '⚡', title: 'SpeedMath', color: '#f59e0b' },
  word: { emoji: '🔤', title: 'WordSearch', color: '#10b981' },
  crossword: { emoji: '📝', title: 'CrosswordAI', color: '#ec4899' },
  memory: { emoji: '🃏', title: 'MemoryFlip', color: '#0ea5e9' },
  tap: { emoji: '🔢', title: 'NumberTap', color: '#ef4444' },
  truefalse: { emoji: '✅', title: 'TrueFalse', color: '#a855f7' },
  slide: { emoji: '🔀', title: 'SlidePuzzle', color: '#0d9488' },
  odd: { emoji: '🔍', title: 'OddOneOut', color: '#d97706' },
  simon: { emoji: '🎵', title: 'SimonMemory', color: '#db2777' },
};

// ---------- Logic ----------
export interface LogicQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number; // index of correct option
  explanation?: string;
}

export interface LogicBank {
  game: 'logic';
  language: Language;
  difficulty: Difficulty;
  version: string;
  questions: LogicQuestion[];
}

// ---------- Math ----------
export type MathMode = 'add_sub' | 'mul_div' | 'mixed' | 'sqrt';

export interface MathQuestion {
  id: string;
  expression: string; // "47 + 83"
  answer: number;
}

// ---------- Word Search ----------
export interface WordPuzzle {
  id: string;
  theme: string;
  words: string[];
}

export interface WordThemeBank {
  game: 'word';
  language: Language;
  version: string;
  puzzles: WordPuzzle[];
}

// ---------- Crossword ----------
export interface CrosswordClue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordPuzzle {
  id: string;
  size: number;
  grid: string[][]; // letters, '' for black cells, '.' for fill cells optional
  clues: {
    across: CrosswordClue[];
    down: CrosswordClue[];
  };
}

export interface CrosswordBank {
  game: 'crossword';
  language: Language;
  difficulty: Difficulty;
  version: string;
  puzzles: CrosswordPuzzle[];
}

// ---------- Memory ----------
export interface MemoryCardSet {
  id: string;
  theme: string;
  pairs: [string, string][]; // [face A, face B] — equal for emoji, different for matched concepts
}

export interface MemoryBank {
  game: 'memory';
  language: Language;
  version: string;
  sets: MemoryCardSet[];
}

// ---------- Scoring / Results ----------
export interface GameResult {
  gameType: GameType;
  score: number;
  level: number;
  durationSec: number;
  difficulty: Difficulty;
  language: Language;
}

// ---------- Leaderboard ----------
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  game_type: GameType;
  high_score: number;
  updated_at: string;
  is_premium?: boolean;
}

// ---------- Stats ----------
export interface UserStat {
  game_type: GameType;
  games_played: number;
  best_score: number;
  total_score: number;
  current_streak: number;
  longest_streak: number;
  last_played: string | null;
}

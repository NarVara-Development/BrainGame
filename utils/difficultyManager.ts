import type { Difficulty, GameType } from '@/types';

interface DiffConfig {
  questionCount: number;
  secondsPerQuestion: number;
  totalSeconds?: number;
}

export const LOGIC_CONFIG: Record<Difficulty, DiffConfig> = {
  easy: { questionCount: 10, secondsPerQuestion: 30 },
  medium: { questionCount: 15, secondsPerQuestion: 20 },
  hard: { questionCount: 20, secondsPerQuestion: 15 },
};

export const MATH_CONFIG: Record<Difficulty, DiffConfig> = {
  easy: { questionCount: 0, secondsPerQuestion: 0, totalSeconds: 60 },
  medium: { questionCount: 0, secondsPerQuestion: 0, totalSeconds: 60 },
  hard: { questionCount: 0, secondsPerQuestion: 0, totalSeconds: 60 },
};

export const WORD_CONFIG: Record<Difficulty, { grid: number; words: number; seconds: number }> = {
  easy: { grid: 10, words: 8, seconds: 180 },
  medium: { grid: 12, words: 12, seconds: 240 },
  hard: { grid: 15, words: 18, seconds: 300 },
};

export const MEMORY_CONFIG: Record<Difficulty, { rows: number; cols: number; pairs: number }> = {
  easy: { rows: 4, cols: 4, pairs: 8 },
  medium: { rows: 4, cols: 6, pairs: 12 },
  hard: { rows: 6, cols: 6, pairs: 18 },
};

export const CROSSWORD_CONFIG: Record<Difficulty, { minSize: number; maxSize: number }> = {
  easy: { minSize: 10, maxSize: 11 },
  medium: { minSize: 12, maxSize: 13 },
  hard: { minSize: 14, maxSize: 15 },
};

/** Suggest next difficulty based on how the player performed (0-1 success ratio). */
export function adaptDifficulty(current: Difficulty, successRatio: number): Difficulty {
  if (successRatio >= 0.85 && current === 'easy') return 'medium';
  if (successRatio >= 0.85 && current === 'medium') return 'hard';
  if (successRatio < 0.4 && current === 'hard') return 'medium';
  if (successRatio < 0.4 && current === 'medium') return 'easy';
  return current;
}

export function gameSeconds(game: GameType, difficulty: Difficulty): number {
  switch (game) {
    case 'logic':
      return LOGIC_CONFIG[difficulty].questionCount * LOGIC_CONFIG[difficulty].secondsPerQuestion;
    case 'math':
      return MATH_CONFIG[difficulty].totalSeconds ?? 60;
    case 'word':
      return WORD_CONFIG[difficulty].seconds;
    default:
      return 120;
  }
}

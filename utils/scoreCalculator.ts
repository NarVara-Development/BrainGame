import type { Difficulty } from '@/types';

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

/** Streak → multiplier (logic/math). 0-1: ×1, 2: ×1.5, 3: ×2, 4+: ×2.5 */
export function streakMultiplier(streak: number): number {
  if (streak >= 4) return 2.5;
  if (streak === 3) return 2;
  if (streak === 2) return 1.5;
  return 1;
}

export interface LogicScoreInput {
  correct: boolean;
  difficulty: Difficulty;
  answerTimeSec: number;
  streak: number;
}

export function logicScore({ correct, difficulty, answerTimeSec, streak }: LogicScoreInput): number {
  if (!correct) return -25;
  let pts = 100 * DIFFICULTY_MULTIPLIER[difficulty] * streakMultiplier(streak);
  if (answerTimeSec < 5) pts += 50; // fast bonus
  return Math.round(pts);
}

export function mathScore(correct: boolean, secondsLeft: number, streak: number): number {
  if (!correct) return 0;
  return Math.round(50 * Math.max(1, secondsLeft) * streakMultiplier(streak) * 0.1 + 50);
}

export function wordWordFound(): number {
  return 100;
}
export function wordTimeBonus(secondsLeft: number): number {
  return secondsLeft * 2;
}
export function wordPerfectBonus(): number {
  return 500;
}

export function crosswordLetter(): number {
  return 10;
}
export function crosswordWordBonus(): number {
  return 100;
}
export function crosswordCompleteBonus(): number {
  return 500;
}

export function memoryPairFound(): number {
  return 100;
}
export function memoryCombo(combo: number): number {
  return combo > 1 ? 50 * (combo - 1) : 0;
}
export function memoryEfficiencyBonus(pairs: number, flips: number): number {
  const minFlips = pairs * 2;
  if (flips <= minFlips) return 500;
  const extra = flips - minFlips;
  return Math.max(0, 300 - extra * 10);
}

export function timeBonus(secondsLeft: number, perSecond = 5): number {
  return Math.max(0, Math.round(secondsLeft * perSecond));
}

// ---------- Wrong-answer penalties (escalate on consecutive mistakes) ----------
/** wrongStreak: 1 for the first wrong, 2 for the second in a row, etc. */
export function wrongPointPenalty(wrongStreak: number): number {
  return Math.min(150, 25 * Math.max(1, wrongStreak)); // 25,50,75,…capped 150
}
export function wrongTimePenalty(wrongStreak: number): number {
  return Math.min(6, 1 + Math.max(1, wrongStreak)); // 2,3,4,5,6 capped 6 seconds
}

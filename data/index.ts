// ============================================================
// Static bank-soal registry. Metro requires literal paths,
// so every generated file is imported here explicitly.
// Regenerate JSON with: node scripts/generate.js
// ============================================================
import type {
  CrosswordBank,
  Difficulty,
  GameType,
  Language,
  LogicBank,
  MemoryBank,
  WordThemeBank,
} from '@/types';

/* eslint-disable @typescript-eslint/no-var-requires */
const BANKS = {
  logic: {
    easy: { id: require('./logic/easy_id.json'), en: require('./logic/easy_en.json') },
    medium: { id: require('./logic/medium_id.json'), en: require('./logic/medium_en.json') },
    hard: { id: require('./logic/hard_id.json'), en: require('./logic/hard_en.json') },
  },
  math: {
    easy: { id: require('./math/easy_id.json'), en: require('./math/easy_en.json') },
    medium: { id: require('./math/medium_id.json'), en: require('./math/medium_en.json') },
    hard: { id: require('./math/hard_id.json'), en: require('./math/hard_en.json') },
  },
  word: {
    easy: { id: require('./word/easy_id.json'), en: require('./word/easy_en.json') },
    medium: { id: require('./word/medium_id.json'), en: require('./word/medium_en.json') },
    hard: { id: require('./word/hard_id.json'), en: require('./word/hard_en.json') },
  },
  crossword: {
    easy: { id: require('./crossword/easy_id.json'), en: require('./crossword/easy_en.json') },
    medium: { id: require('./crossword/medium_id.json'), en: require('./crossword/medium_en.json') },
    hard: { id: require('./crossword/hard_id.json'), en: require('./crossword/hard_en.json') },
  },
  memory: {
    easy: { id: require('./memory/easy_id.json'), en: require('./memory/easy_en.json') },
    medium: { id: require('./memory/medium_id.json'), en: require('./memory/medium_en.json') },
    hard: { id: require('./memory/hard_id.json'), en: require('./memory/hard_en.json') },
  },
  tap: {
    easy: { id: require('./tap/easy_id.json'), en: require('./tap/easy_en.json') },
    medium: { id: require('./tap/medium_id.json'), en: require('./tap/medium_en.json') },
    hard: { id: require('./tap/hard_id.json'), en: require('./tap/hard_en.json') },
  },
  truefalse: {
    easy: { id: require('./truefalse/easy_id.json'), en: require('./truefalse/easy_en.json') },
    medium: { id: require('./truefalse/medium_id.json'), en: require('./truefalse/medium_en.json') },
    hard: { id: require('./truefalse/hard_id.json'), en: require('./truefalse/hard_en.json') },
  },
  slide: {
    easy: { id: require('./slide/easy_id.json'), en: require('./slide/easy_en.json') },
    medium: { id: require('./slide/medium_id.json'), en: require('./slide/medium_en.json') },
    hard: { id: require('./slide/hard_id.json'), en: require('./slide/hard_en.json') },
  },
  odd: {
    easy: { id: require('./odd/easy_id.json'), en: require('./odd/easy_en.json') },
    medium: { id: require('./odd/medium_id.json'), en: require('./odd/medium_en.json') },
    hard: { id: require('./odd/hard_id.json'), en: require('./odd/hard_en.json') },
  },
  simon: {
    easy: { id: require('./simon/easy_id.json'), en: require('./simon/easy_en.json') },
    medium: { id: require('./simon/medium_id.json'), en: require('./simon/medium_en.json') },
    hard: { id: require('./simon/hard_id.json'), en: require('./simon/hard_en.json') },
  },
} as const;
/* eslint-enable @typescript-eslint/no-var-requires */

export function getBank<T = any>(game: GameType, difficulty: Difficulty, language: Language): T {
  return BANKS[game][difficulty][language] as T;
}

export const getLogicBank = (d: Difficulty, l: Language) => getBank<LogicBank>('logic', d, l);
export const getMathBank = (d: Difficulty, l: Language) => getBank<any>('math', d, l);
export const getWordBank = (d: Difficulty, l: Language) => getBank<WordThemeBank>('word', d, l);
export const getCrosswordBank = (d: Difficulty, l: Language) => getBank<CrosswordBank>('crossword', d, l);
export const getMemoryBank = (d: Difficulty, l: Language) => getBank<MemoryBank>('memory', d, l);

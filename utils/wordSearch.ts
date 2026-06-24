import { randInt } from '@/utils/rand';

export interface WordGridData {
  grid: string[][];
  placed: string[]; // words actually placed
  size: number;
}

const DIRS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function buildWordGrid(words: string[], size: number, allowReverse = true): WordGridData {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  const placed: string[] = [];

  const fits = (word: string, r: number, c: number, dr: number, dc: number) => {
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) return false;
      const cur = grid[rr][cc];
      if (cur !== null && cur !== word[i]) return false;
    }
    return true;
  };

  const put = (word: string, r: number, c: number, dr: number, dc: number) => {
    for (let i = 0; i < word.length; i++) grid[r + dr * i][c + dc * i] = word[i];
  };

  const candidates = words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length <= size && w.length >= 2);

  for (const word of candidates) {
    let done = false;
    for (let attempt = 0; attempt < 120 && !done; attempt++) {
      const dirs = allowReverse ? DIRS : DIRS.slice(0, 4);
      const [dr, dc] = dirs[randInt(0, dirs.length - 1)];
      const r = randInt(0, size - 1);
      const c = randInt(0, size - 1);
      if (fits(word, r, c, dr, dc)) {
        put(word, r, c, dr, dc);
        placed.push(word);
        done = true;
      }
    }
  }

  // fill blanks
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) grid[r][c] = ALPHABET[randInt(0, 25)];
    }
  }

  return { grid: grid as string[][], placed, size };
}

/** Cells on the straight line between two points, or null if not a valid straight line. */
export function lineCells(r1: number, c1: number, r2: number, c2: number): [number, number][] | null {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const lenR = Math.abs(r2 - r1);
  const lenC = Math.abs(c2 - c1);
  // must be horizontal, vertical, or perfect diagonal
  if (!(lenR === 0 || lenC === 0 || lenR === lenC)) return null;
  const steps = Math.max(lenR, lenC);
  const cells: [number, number][] = [];
  for (let i = 0; i <= steps; i++) cells.push([r1 + dr * i, c1 + dc * i]);
  return cells;
}

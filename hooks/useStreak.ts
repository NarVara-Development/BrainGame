import { useCallback } from 'react';
import type { GameType } from '@/types';
import { json } from '@/lib/storage';

interface StreakData {
  current: number;
  longest: number;
  lastPlayed: string | null; // YYYY-MM-DD
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const key = (game: GameType) => `streak_${game}`;

export function useStreak(game: GameType) {
  const get = useCallback((): StreakData => {
    return json.get<StreakData>(key(game)) ?? { current: 0, longest: 0, lastPlayed: null };
  }, [game]);

  /** Call once when a game is completed today. Returns updated streak. */
  const recordPlay = useCallback((): StreakData => {
    const data = get();
    const today = todayStr();

    if (data.lastPlayed === today) return data; // already counted today

    let current = 1;
    if (data.lastPlayed && daysBetween(data.lastPlayed, today) === 1) {
      current = data.current + 1;
    }
    const updated: StreakData = {
      current,
      longest: Math.max(current, data.longest),
      lastPlayed: today,
    };
    json.set(key(game), updated);
    return updated;
  }, [game, get]);

  return { get, recordPlay };
}

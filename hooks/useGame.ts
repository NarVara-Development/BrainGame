import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameResult, GameType } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { useStreak } from '@/hooks/useStreak';
import { maybeShowVideoAd } from '@/lib/admob';
import { json } from '@/lib/storage';

/** Reusable countdown timer. */
export function useCountdown(seconds: number, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      onExpireRef.current?.();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, timeLeft]);

  const start = useCallback(() => {
    setRunning(true);
  }, []);
  const reset = useCallback(
    (s = seconds) => {
      setTimeLeft(s);
      setRunning(false);
    },
    [seconds]
  );
  const stop = useCallback(() => setRunning(false), []);

  return { timeLeft, running, start, stop, reset, setTimeLeft };
}

/** Persists a finished game: streak, local stats, leaderboard queue, interstitial. */
export function useFinishGame(gameType: GameType) {
  const { recordPlay } = useStreak(gameType);
  const saveScore = useLeaderboardStore((s) => s.saveScore);
  const endSession = useGameStore((s) => s.endSession);

  return useCallback(
    async (result: GameResult) => {
      // local stats roll-up
      const statKey = `stat_${gameType}`;
      const prev = json.get<any>(statKey) ?? {
        games_played: 0,
        best_score: 0,
        total_score: 0,
      };
      const updated = {
        games_played: prev.games_played + 1,
        best_score: Math.max(prev.best_score, result.score),
        total_score: prev.total_score + result.score,
      };
      json.set(statKey, updated);

      const isNewBest = result.score > prev.best_score;
      recordPlay();
      await saveScore(gameType, result.score);
      maybeShowVideoAd();
      endSession();

      return { isNewBest };
    },
    [gameType, recordPlay, saveScore, endSession]
  );
}

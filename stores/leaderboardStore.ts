import { create } from 'zustand';
import type { GameType, LeaderboardEntry } from '@/types';
import { json, storage } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const PENDING_KEY = 'pending_scores';

interface PendingScore {
  gameType: GameType;
  score: number;
  timestamp: number;
}

interface LeaderboardState {
  entries: Record<GameType, LeaderboardEntry[]>;
  loading: boolean;
  saveScore: (gameType: GameType, score: number) => Promise<void>;
  syncPending: () => Promise<void>;
  fetchLeaderboard: (gameType: GameType) => Promise<void>;
}

function queueLocal(gameType: GameType, score: number) {
  const pending = json.get<PendingScore[]>(PENDING_KEY) ?? [];
  pending.push({ gameType, score, timestamp: Date.now() });
  json.set(PENDING_KEY, pending);
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: { logic: [], math: [], word: [], crossword: [], memory: [], tap: [], truefalse: [], slide: [], odd: [], simon: [] },
  loading: false,

  saveScore: async (gameType, score) => {
    queueLocal(gameType, score);
    await get().syncPending();
  },

  syncPending: async () => {
    if (!isSupabaseConfigured) return;
    const { user, username } = useAuthStore.getState();
    if (!user) return; // keep queued until logged in

    const pending = json.get<PendingScore[]>(PENDING_KEY) ?? [];
    if (pending.length === 0) return;

    const remaining: PendingScore[] = [];
    for (const item of pending) {
      // update_leaderboard RPC lives in the shared public schema.
      const { error } = await supabase.schema('public').rpc('update_leaderboard', {
        p_user_id: user.id,
        p_game_type: item.gameType,
        p_score: item.score,
        p_username: username,
      });
      if (error) remaining.push(item); // retry next time
    }

    if (remaining.length === 0) storage.delete(PENDING_KEY);
    else json.set(PENDING_KEY, remaining);
  },

  fetchLeaderboard: async (gameType) => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    const { data } = await supabase
      .from('braingame_leaderboard')
      .select('*')
      .eq('game_type', gameType)
      .order('high_score', { ascending: false })
      .limit(100);

    set((s) => ({
      entries: { ...s.entries, [gameType]: (data as LeaderboardEntry[]) ?? [] },
      loading: false,
    }));
  },
}));

import { useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { Difficulty, GameType, Language } from '@/types';
import { json } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateSoalFromGroq } from '@/lib/groq';

const cacheKey = (g: GameType, l: Language, d: Difficulty) => `soal_${g}_${l}_${d}`;

async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected);
  } catch {
    return false;
  }
}

/**
 * AI soal loader with cache hierarchy:
 *  1. Supabase cache (used_count < 5)
 *  2. Groq fresh generate (online) → save to Supabase + local
 *  3. Local MMKV cache (offline)
 *  4. caller's bundled fallback bank
 */
export function useAISoal() {
  const getAISoal = useCallback(
    async <T = unknown>(
      gameType: GameType,
      language: Language,
      difficulty: Difficulty,
      count = 10,
      fallback?: T
    ): Promise<T | null> => {
      const online = await isOnline();

      if (online && isSupabaseConfigured) {
        const { data: cached } = await supabase
          .from('braingame_ai_soal_cache')
          .select('*')
          .eq('game_type', gameType)
          .eq('language', language)
          .eq('difficulty', difficulty)
          .lt('used_count', 5)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cached) {
          await supabase
            .from('braingame_ai_soal_cache')
            .update({ used_count: (cached.used_count ?? 0) + 1 })
            .eq('id', cached.id);
          json.set(cacheKey(gameType, language, difficulty), cached.soal_data);
          return cached.soal_data as T;
        }
      }

      if (online) {
        const fresh = await generateSoalFromGroq(gameType, language, difficulty, count);
        if (fresh) {
          if (isSupabaseConfigured) {
            await supabase.from('braingame_ai_soal_cache').insert({
              game_type: gameType,
              language,
              difficulty,
              soal_data: fresh,
            });
          }
          json.set(cacheKey(gameType, language, difficulty), fresh);
          return fresh as T;
        }
      }

      // offline / failure → local cache
      const local = json.get<T>(cacheKey(gameType, language, difficulty));
      if (local) return local;

      return fallback ?? null;
    },
    []
  );

  return { getAISoal };
}

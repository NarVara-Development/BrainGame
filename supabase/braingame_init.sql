-- ============================================================
-- NarVara BrainGame — schema (SHARED project cfujpedysatkhpmjvpfm)
-- Namespaced braingame_* so it coexists with lindungiaku_*.
-- Run:  $env:PGPASSWORD="<db-password>"; node ../../NarVaraSupabase/run-sql.js supabase/braingame_init.sql
-- (profiles + auth.users already exist from the base migration.)
-- ============================================================

-- Safety: ensure profiles exists (created by base migration; IF NOT EXISTS = no-op if present)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- braingame_scores — every play
-- =====================
CREATE TABLE IF NOT EXISTS braingame_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type    TEXT CHECK (game_type IN ('logic','math','word','crossword','memory')),
  score        INT NOT NULL,
  level        INT DEFAULT 1,
  duration_sec INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE braingame_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scores" ON braingame_scores;
CREATE POLICY "Users manage own scores" ON braingame_scores FOR ALL USING (auth.uid() = user_id);

-- =====================
-- braingame_leaderboard — global high score per game
-- =====================
CREATE TABLE IF NOT EXISTS braingame_leaderboard (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  game_type   TEXT CHECK (game_type IN ('logic','math','word','crossword','memory')),
  high_score  INT NOT NULL DEFAULT 0,
  is_premium  BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);
ALTER TABLE braingame_leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON braingame_leaderboard;
CREATE POLICY "Anyone can view leaderboard" ON braingame_leaderboard FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users update own score" ON braingame_leaderboard;
CREATE POLICY "Users update own score" ON braingame_leaderboard FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_braingame_lb_game_score
  ON braingame_leaderboard (game_type, high_score DESC);

-- =====================
-- braingame_ai_soal_cache — cached Groq output
-- =====================
CREATE TABLE IF NOT EXISTS braingame_ai_soal_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type   TEXT NOT NULL,
  language    TEXT CHECK (language IN ('id','en')),
  difficulty  TEXT CHECK (difficulty IN ('easy','medium','hard')),
  soal_data   JSONB NOT NULL,
  used_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE braingame_ai_soal_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read soal cache" ON braingame_ai_soal_cache;
CREATE POLICY "Anyone can read soal cache" ON braingame_ai_soal_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth can write soal cache" ON braingame_ai_soal_cache;
CREATE POLICY "Auth can write soal cache" ON braingame_ai_soal_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth can update soal cache" ON braingame_ai_soal_cache;
CREATE POLICY "Auth can update soal cache" ON braingame_ai_soal_cache FOR UPDATE USING (auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS idx_braingame_cache_lookup
  ON braingame_ai_soal_cache (game_type, language, difficulty, used_count);

-- =====================
-- braingame_user_stats — per-game stats + premium flag
-- =====================
CREATE TABLE IF NOT EXISTS braingame_user_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type       TEXT NOT NULL,
  games_played    INT DEFAULT 0,
  best_score      INT DEFAULT 0,
  total_score     INT DEFAULT 0,
  current_streak  INT DEFAULT 0,
  longest_streak  INT DEFAULT 0,
  is_premium      BOOLEAN DEFAULT FALSE,
  last_played     DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);
ALTER TABLE braingame_user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own stats" ON braingame_user_stats;
CREATE POLICY "Users manage own stats" ON braingame_user_stats FOR ALL USING (auth.uid() = user_id);

-- =====================
-- RPC: update_leaderboard — upsert high score (keep max), record play
-- =====================
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_user_id   UUID,
  p_game_type TEXT,
  p_score     INT,
  p_username  TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO braingame_scores (user_id, game_type, score)
  VALUES (p_user_id, p_game_type, p_score);

  INSERT INTO braingame_leaderboard (user_id, username, game_type, high_score, updated_at)
  VALUES (p_user_id, p_username, p_game_type, p_score, NOW())
  ON CONFLICT (user_id, game_type) DO UPDATE
    SET high_score = GREATEST(braingame_leaderboard.high_score, EXCLUDED.high_score),
        username   = EXCLUDED.username,
        updated_at = NOW();

  INSERT INTO braingame_user_stats (user_id, game_type, games_played, best_score, total_score, last_played, updated_at)
  VALUES (p_user_id, p_game_type, 1, p_score, p_score, CURRENT_DATE, NOW())
  ON CONFLICT (user_id, game_type) DO UPDATE
    SET games_played = braingame_user_stats.games_played + 1,
        best_score   = GREATEST(braingame_user_stats.best_score, EXCLUDED.best_score),
        total_score  = braingame_user_stats.total_score + EXCLUDED.total_score,
        last_played  = CURRENT_DATE,
        updated_at   = NOW();
END;
$$;

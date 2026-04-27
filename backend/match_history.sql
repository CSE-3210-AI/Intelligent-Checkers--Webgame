-- Match history table for per-user score tracking
CREATE TABLE IF NOT EXISTS match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  matchup_key VARCHAR(255) NOT NULL,
  player1 VARCHAR(100) NOT NULL,
  player2 VARCHAR(100) NOT NULL,
  player1_wins INTEGER NOT NULL DEFAULT 0,
  player2_wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  game_mode VARCHAR(60),
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_email, matchup_key)
);

CREATE INDEX IF NOT EXISTS match_history_user_email_idx ON match_history (user_email);
CREATE INDEX IF NOT EXISTS match_history_last_played_idx ON match_history (last_played DESC);

-- Backward-compatible migration for existing tables created before draw support.
ALTER TABLE match_history
  ADD COLUMN IF NOT EXISTS draws INTEGER NOT NULL DEFAULT 0;

-- Challenge Progress table
-- Tracks user enrollment and daily completion for challenges.

CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  days_completed INT DEFAULT 0,
  day_data JSONB DEFAULT '[]'::jsonb,

  UNIQUE(user_id, challenge_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user
  ON challenge_progress(user_id);

-- Index for active challenges (not yet completed)
CREATE INDEX IF NOT EXISTS idx_challenge_progress_active
  ON challenge_progress(user_id) WHERE completed_at IS NULL;

-- RLS policies
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own challenge progress"
  ON challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can join challenges"
  ON challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own challenge progress"
  ON challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own progress (leave challenge)
CREATE POLICY "Users can leave challenges"
  ON challenge_progress FOR DELETE
  USING (auth.uid() = user_id);

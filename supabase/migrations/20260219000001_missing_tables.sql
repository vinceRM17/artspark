-- Create missing tables only (user_preferences, prompts, responses, analytics_events already exist)

-- challenge_progress table
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

CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_active ON challenge_progress(user_id) WHERE completed_at IS NULL;

ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_progress' AND policyname = 'Users can read own challenge progress') THEN
    CREATE POLICY "Users can read own challenge progress" ON challenge_progress FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_progress' AND policyname = 'Users can join challenges') THEN
    CREATE POLICY "Users can join challenges" ON challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_progress' AND policyname = 'Users can update own challenge progress') THEN
    CREATE POLICY "Users can update own challenge progress" ON challenge_progress FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_progress' AND policyname = 'Users can leave challenges') THEN
    CREATE POLICY "Users can leave challenges" ON challenge_progress FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- custom_mediums table
CREATE TABLE IF NOT EXISTS custom_mediums (
  name TEXT PRIMARY KEY,
  count INT DEFAULT 1,
  promoted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC function to increment custom medium count
CREATE OR REPLACE FUNCTION increment_custom_medium(medium_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO custom_mediums (name, count)
  VALUES (medium_name, 1)
  ON CONFLICT (name)
  DO UPDATE SET count = custom_mediums.count + 1;
END;
$$;

-- Add tier column to user_preferences if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'tier'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN tier TEXT DEFAULT 'free';
  END IF;
END;
$$;

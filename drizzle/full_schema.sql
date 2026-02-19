-- ArtSpark Full Schema Setup
-- Run against production Supabase

-- 1. user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  art_mediums TEXT[] NOT NULL DEFAULT '{}',
  color_palettes TEXT[] DEFAULT '{}',
  subjects TEXT[] NOT NULL DEFAULT '{}',
  exclusions TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'developing',
  tier TEXT DEFAULT 'free',
  notification_time TIME DEFAULT '09:00:00',
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'daily',
  medium TEXT NOT NULL,
  subject TEXT NOT NULL,
  color_rule TEXT,
  twist TEXT,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_source CHECK (source IN ('daily', 'manual'))
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_daily_prompt ON prompts(user_id, date_key) WHERE source = 'daily';
CREATE INDEX IF NOT EXISTS idx_prompts_user_date ON prompts(user_id, date_key DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user_subject_recent ON prompts(user_id, subject, created_at DESC);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own prompts"
  ON prompts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_user ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_prompt ON responses(prompt_id);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own responses"
  ON responses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON responses FOR UPDATE USING (auth.uid() = user_id);

-- 4. challenge_progress table
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

CREATE POLICY "Users can read own challenge progress"
  ON challenge_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress"
  ON challenge_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON challenge_progress FOR DELETE USING (auth.uid() = user_id);

-- 5. custom_mediums table
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

-- 6. analytics_events table (optional, for tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

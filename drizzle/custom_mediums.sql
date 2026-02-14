-- Custom mediums tracking table
-- Tracks user-submitted custom medium names for crowdsourcing
-- Popular mediums can be promoted to the official list via the promoted flag

CREATE TABLE IF NOT EXISTS custom_mediums (
  name TEXT PRIMARY KEY,
  count INT DEFAULT 1,
  promoted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC function to increment custom medium count (upsert)
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

-- Add tier column to user_preferences if it doesn't exist
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

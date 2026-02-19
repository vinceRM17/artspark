-- Add missing columns to user_preferences

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'developing';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS prompt_frequency TEXT DEFAULT 'daily';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS prompt_days TEXT[] DEFAULT '{}';

/**
 * Prompt type definition and Zod schema
 *
 * Requires prompts table in Supabase -- run this in Supabase SQL Editor:
 *
 * CREATE TABLE prompts (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   date_key TEXT NOT NULL,
 *   source TEXT NOT NULL DEFAULT 'daily',
 *   medium TEXT NOT NULL,
 *   subject TEXT NOT NULL,
 *   color_rule TEXT,
 *   twist TEXT,
 *   prompt_text TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   CONSTRAINT valid_source CHECK (source IN ('daily', 'manual'))
 * );
 *
 * CREATE UNIQUE INDEX unique_daily_prompt ON prompts(user_id, date_key) WHERE source = 'daily';
 *
 * CREATE INDEX idx_prompts_user_date ON prompts(user_id, date_key DESC);
 * CREATE INDEX idx_prompts_user_subject_recent ON prompts(user_id, subject, created_at DESC);
 *
 * ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read own prompts"
 *   ON prompts FOR SELECT USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can insert own prompts"
 *   ON prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
 */

import { z } from 'zod';

export type Prompt = {
  id: string;
  user_id: string;
  date_key: string; // YYYY-MM-DD format, UTC
  source: 'daily' | 'manual';
  medium: string; // ID from MEDIUM_OPTIONS
  subject: string; // ID from SUBJECT_OPTIONS
  color_rule: string | null; // ID from COLOR_PALETTE_OPTIONS or null
  twist: string | null; // Full twist text or null
  prompt_text: string; // Full assembled prompt sentence
  created_at: string;
};

export const promptSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date_key: z.string(),
  source: z.enum(['daily', 'manual']),
  medium: z.string(),
  subject: z.string(),
  color_rule: z.string().nullable(),
  twist: z.string().nullable(),
  prompt_text: z.string(),
  created_at: z.string(),
});

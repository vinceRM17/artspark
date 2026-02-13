/**
 * Response type definition and Zod schema
 *
 * Requires responses table in Supabase -- run this in Supabase SQL Editor:
 *
 * CREATE TABLE responses (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
 *   image_urls TEXT[] NOT NULL DEFAULT '{}',
 *   notes TEXT,
 *   tags TEXT[] NOT NULL DEFAULT '{}',
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_responses_user ON responses(user_id);
 * CREATE INDEX idx_responses_prompt ON responses(prompt_id);
 *
 * ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read own responses"
 *   ON responses FOR SELECT USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can insert own responses"
 *   ON responses FOR INSERT WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update own responses"
 *   ON responses FOR UPDATE USING (auth.uid() = user_id);
 *
 * Storage bucket setup (run in Supabase Dashboard > Storage > Create bucket):
 * - Bucket name: responses
 * - Public: false (use signed URLs for sharing)
 *
 * Storage RLS policies (run in SQL Editor):
 *
 * CREATE POLICY "Users can upload to own folder"
 *   ON storage.objects FOR INSERT
 *   WITH CHECK (bucket_id = 'responses' AND auth.uid()::text = (storage.foldername(name))[1]);
 *
 * CREATE POLICY "Users can read own uploads"
 *   ON storage.objects FOR SELECT
 *   USING (bucket_id = 'responses' AND auth.uid()::text = (storage.foldername(name))[1]);
 */

import { z } from 'zod';

export type Response = {
  id: string;
  user_id: string;
  prompt_id: string;
  image_urls: string[];
  notes: string | null;
  tags: string[];
  created_at: string;
};

export const responseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  prompt_id: z.string(),
  image_urls: z.array(z.string()),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.string(),
});

export type CreateResponseInput = {
  prompt_id: string;
  image_uris: string[];
  notes: string | null;
  tags: string[];
};

export const createResponseSchema = z.object({
  prompt_id: z.string().uuid(),
  image_uris: z.array(z.string()).min(1).max(3),
  notes: z.string().max(500).nullable().default(null),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

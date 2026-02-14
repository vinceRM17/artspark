-- Portfolio uploads table
-- Stores metadata for artwork uploaded during onboarding or later
-- Actual images are stored in Supabase Storage bucket 'portfolios'

CREATE TABLE IF NOT EXISTS portfolio_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_uploads_user_id
  ON portfolio_uploads(user_id);

-- RLS policies
ALTER TABLE portfolio_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own portfolio uploads"
  ON portfolio_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio uploads"
  ON portfolio_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio uploads"
  ON portfolio_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create the portfolios storage bucket (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('portfolios', 'portfolios', false);

-- Storage RLS: users can upload to their own folder
-- CREATE POLICY "Users can upload to own portfolio folder"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own portfolio files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

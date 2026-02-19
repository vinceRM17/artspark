-- ArtSpark Storage Setup
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create the 'responses' bucket (private - uses signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'responses',
  'responses',
  false,
  5242880, -- 5MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'responses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. RLS Policy: Users can view their own images (needed for signed URLs)
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'responses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RLS Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'responses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. RLS Policy: Users can update their own images (for upsert)
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'responses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

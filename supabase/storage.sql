-- ============================================================
-- QuicKeys™ — Supabase Storage Setup
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Create photos bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own photos (folder = their user ID)
CREATE POLICY "Users upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view photos (needed for displaying other users' photos)
-- Photos are accessed via signed URLs in API routes, not direct public access
CREATE POLICY "Authenticated users can view photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own photos
CREATE POLICY "Users delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can delete any photo
CREATE POLICY "Admins delete any photo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

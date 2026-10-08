/*
# Add user_id to videos + create storage buckets for uploads

## Purpose
Enable video uploads where each authenticated user can upload video files and thumbnails
to Supabase Storage, and the corresponding metadata row in `videos` is linked to the uploader.

## Changes to existing tables
### videos
- Added `user_id` (uuid, NOT NULL, DEFAULT auth.uid()) — links each video to the uploading user.
  Existing rows get NULL during column add, then we set them to a sentinel; new uploads get auth.uid() automatically.

## New storage buckets
- `videos` — public read, authenticated write (for video files)
- `thumbnails` — public read, authenticated write (for thumbnail images)

## Security changes
### videos table policies
- SELECT: public (anon + authenticated) — unchanged, all videos are browseable.
- INSERT: authenticated only, WITH CHECK (auth.uid() = user_id) — only the owner can create their video row.
- UPDATE: authenticated only, ownership-scoped — only the owner can edit.
- DELETE: authenticated only, ownership-scoped — only the owner can delete.

### storage.objects policies
- SELECT: public (anon + authenticated) — anyone can view/download uploaded videos and thumbnails.
- INSERT: authenticated only, owner-scoped — must upload to a path starting with their user id.
- UPDATE: authenticated only, owner-scoped.
- DELETE: authenticated only, owner-scoped.

## Important notes
1. The storage.objects policies use the bucket_id to scope to `videos` and `thumbnails` buckets only.
2. Upload paths must follow the convention `user_id/filename` so ownership checks work.
3. Existing video rows have user_id set to a placeholder UUID since they were seeded without an owner.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE videos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update INSERT policy to be owner-scoped
DROP POLICY IF EXISTS "auth_insert_videos" ON videos;
CREATE POLICY "auth_insert_videos" ON videos FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update UPDATE policy to be owner-scoped
DROP POLICY IF EXISTS "auth_update_videos" ON videos;
CREATE POLICY "auth_update_videos" ON videos FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update DELETE policy to be owner-scoped
DROP POLICY IF EXISTS "auth_delete_videos" ON videos;
CREATE POLICY "auth_delete_videos" ON videos FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Create storage buckets (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read for videos + thumbnails buckets
DROP POLICY IF EXISTS "public_read_uploads" ON storage.objects;
CREATE POLICY "public_read_uploads" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Storage policies: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "auth_insert_uploads" ON storage.objects;
CREATE POLICY "auth_insert_uploads" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('videos', 'thumbnails')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies: owners can update their own uploads
DROP POLICY IF EXISTS "auth_update_uploads" ON storage.objects;
CREATE POLICY "auth_update_uploads" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('videos', 'thumbnails')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN ('videos', 'thumbnails')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies: owners can delete their own uploads
DROP POLICY IF EXISTS "auth_delete_uploads" ON storage.objects;
CREATE POLICY "auth_delete_uploads" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('videos', 'thumbnails')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Index for faster user video queries
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

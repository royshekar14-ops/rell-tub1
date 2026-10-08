/*
# Create videos and likes tables

## Purpose
A video web app where users can browse full videos and shorts, like videos, and log in.
Since the app has a Login screen, we use authenticated-scoped policies with ownership.

## New Tables

### videos
- `id` (uuid, primary key)
- `title` (text, not null) — video title
- `description` (text) — video description
- `thumbnail_url` (text) — poster image URL
- `video_url` (text, not null) — playable video URL
- `duration` (text) — human-readable duration like "12:34"
- `category` (text) — e.g. "Music", "Gaming", "Tech"
- `views` (bigint, default 0) — view count
- `is_short` (boolean, default false) — true for Shorts, false for full videos
- `channel_name` (text) — uploader channel name
- `channel_avatar_url` (text) — channel avatar image
- `created_at` (timestamptz, default now())

### likes
- `id` (uuid, primary key)
- `video_id` (uuid, references videos, cascade delete)
- `user_id` (uuid, not null, default auth.uid(), references auth.users, cascade delete)
- `created_at` (timestamptz, default now())
- Unique constraint on (video_id, user_id) to prevent duplicate likes

## Security
- RLS enabled on both tables.
- videos: SELECT is public (anon + authenticated can browse). INSERT/UPDATE/DELETE is admin-only via authenticated (any logged-in user can upload for this demo).
- likes: SELECT is public (anyone can see like counts). INSERT/UPDATE/DELETE is owner-scoped (user can only manage their own likes).
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  video_url text NOT NULL,
  duration text DEFAULT '0:00',
  category text DEFAULT 'General',
  views bigint NOT NULL DEFAULT 0,
  is_short boolean NOT NULL DEFAULT false,
  channel_name text NOT NULL DEFAULT 'Unknown',
  channel_avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- videos: public read
DROP POLICY IF EXISTS "public_select_videos" ON videos;
CREATE POLICY "public_select_videos" ON videos FOR SELECT
TO anon, authenticated USING (true);

-- videos: authenticated can insert
DROP POLICY IF EXISTS "auth_insert_videos" ON videos;
CREATE POLICY "auth_insert_videos" ON videos FOR INSERT
TO authenticated WITH CHECK (true);

-- videos: authenticated can update
DROP POLICY IF EXISTS "auth_update_videos" ON videos;
CREATE POLICY "auth_update_videos" ON videos FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

-- videos: authenticated can delete
DROP POLICY IF EXISTS "auth_delete_videos" ON videos;
CREATE POLICY "auth_delete_videos" ON videos FOR DELETE
TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (video_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- likes: public read (so like counts are visible to all)
DROP POLICY IF EXISTS "public_select_likes" ON likes;
CREATE POLICY "public_select_likes" ON likes FOR SELECT
TO anon, authenticated USING (true);

-- likes: owner can insert their own
DROP POLICY IF EXISTS "owner_insert_likes" ON likes;
CREATE POLICY "owner_insert_likes" ON likes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- likes: owner can delete their own
DROP POLICY IF EXISTS "owner_delete_likes" ON likes;
CREATE POLICY "owner_delete_likes" ON likes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Index for faster like count queries
CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_is_short ON videos(is_short);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

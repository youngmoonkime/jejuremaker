-- ============================================
-- Jejuremaker Database Schema Migration
-- Purpose: Add persistent token storage and project retention
-- ============================================

-- 1. Create user_tokens table for persistent token management
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,-- ============================================
-- Jejuremaker Database Schema Migration (FIXED)
-- Purpose: Add persistent token storage and project retention
-- ============================================

-- 1. Create user_tokens table for persistent token management
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tokens_remaining INTEGER NOT NULL DEFAULT 25,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_next_reset ON user_tokens(next_reset_at);

-- 2. Update items table for project ownership and retention
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deletion_warning_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_public ON items(is_public);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_scheduled_deletion ON items(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;

-- 3. Function to reset tokens every 30 days from signup
CREATE OR REPLACE FUNCTION reset_user_tokens()
RETURNS void AS $$
BEGIN
  UPDATE user_tokens
  SET 
    tokens_remaining = 25,
    tokens_used = 0,
    last_reset_at = NOW(),
    next_reset_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
  WHERE next_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Function to schedule old project deletions (30 days)
CREATE OR REPLACE FUNCTION schedule_old_project_deletions()
RETURNS void AS $$
BEGIN
  UPDATE items
  SET 
    scheduled_deletion_at = created_at + INTERVAL '30 days',
    updated_at = NOW()
  WHERE 
    is_public = false 
    AND created_at < NOW() - INTERVAL '27 days'
    AND scheduled_deletion_at IS NULL
    AND deletion_warning_sent = false;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to delete scheduled projects
CREATE OR REPLACE FUNCTION delete_scheduled_projects()
RETURNS void AS $$
BEGIN
  DELETE FROM items
  WHERE 
    scheduled_deletion_at IS NOT NULL 
    AND scheduled_deletion_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get projects needing deletion warning (3 days before deletion)
CREATE OR REPLACE FUNCTION get_projects_needing_warning()
RETURNS TABLE (
  project_id INTEGER,
  user_id UUID,
  title TEXT,
  days_until_deletion INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    items.id,
    items.owner_id,
    items.title,
    EXTRACT(DAY FROM (items.scheduled_deletion_at - NOW()))::INTEGER as days_until_deletion
  FROM items
  WHERE 
    scheduled_deletion_at IS NOT NULL
    AND scheduled_deletion_at > NOW()
    AND scheduled_deletion_at <= NOW() + INTERVAL '3 days'
    AND deletion_warning_sent = false;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to mark warning as sent
CREATE OR REPLACE FUNCTION mark_deletion_warning_sent(project_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE items
  SET 
    deletion_warning_sent = true,
    updated_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create storage bucket for project images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage policies for project images
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 10. Row Level Security (RLS) policies for user_tokens
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_tokens;

CREATE POLICY "Users can view their own tokens"
ON user_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON user_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
ON user_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 11. Row Level Security (RLS) policies for items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;

CREATE POLICY "Public items are viewable by everyone"
ON items FOR SELECT
TO public
USING (is_public = true);

CREATE POLICY "Users can view their own items"
ON items FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own items"
ON items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own items"
ON items FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own items"
ON items FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 12. Trigger to auto-update updated_at timestamp
-- DROP TRIGGERS FIRST TO AVOID "already exists" ERROR
DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tokens_updated_at
BEFORE UPDATE ON user_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RPC Functions for Likes and Views
-- ============================================

CREATE OR REPLACE FUNCTION increment_likes(row_id BIGINT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET likes = likes + amount
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_views(row_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET views = views + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MANUAL STEPS REQUIRED:
-- ============================================
-- 
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up Cron Jobs in Supabase Dashboard:
--    - Daily at 00:00 UTC: SELECT reset_user_tokens();
--    - Daily at 00:00 UTC: SELECT schedule_old_project_deletions();
--    - Daily at 01:00 UTC: SELECT delete_scheduled_projects();
--
-- 3. Optional: Set up Edge Function for deletion warnings
--
-- ============================================

  tokens_remaining INTEGER NOT NULL DEFAULT 25,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_next_reset ON user_tokens(next_reset_at);

-- 2. Update items table for project ownership and retention
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deletion_warning_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_public ON items(is_public);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_scheduled_deletion ON items(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;

-- 3. Function to reset tokens every 30 days from signup
CREATE OR REPLACE FUNCTION reset_user_tokens()
RETURNS void AS $$
BEGIN
  UPDATE user_tokens
  SET 
    tokens_remaining = 25,
    tokens_used = 0,
    last_reset_at = NOW(),
    next_reset_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
  WHERE next_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Function to schedule old project deletions (30 days)
CREATE OR REPLACE FUNCTION schedule_old_project_deletions()
RETURNS void AS $$
BEGIN
  UPDATE items
  SET 
    scheduled_deletion_at = created_at + INTERVAL '30 days',
    updated_at = NOW()
  WHERE 
    is_public = false 
    AND created_at < NOW() - INTERVAL '27 days'
    AND scheduled_deletion_at IS NULL
    AND deletion_warning_sent = false;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to delete scheduled projects
CREATE OR REPLACE FUNCTION delete_scheduled_projects()
RETURNS void AS $$
BEGIN
  DELETE FROM items
  WHERE 
    scheduled_deletion_at IS NOT NULL 
    AND scheduled_deletion_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get projects needing deletion warning (3 days before deletion)
CREATE OR REPLACE FUNCTION get_projects_needing_warning()
RETURNS TABLE (
  project_id INTEGER,
  user_id UUID,
  title TEXT,
  days_until_deletion INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    items.id,
    items.owner_id,
    items.title,
    EXTRACT(DAY FROM (items.scheduled_deletion_at - NOW()))::INTEGER as days_until_deletion
  FROM items
  WHERE 
    scheduled_deletion_at IS NOT NULL
    AND scheduled_deletion_at > NOW()
    AND scheduled_deletion_at <= NOW() + INTERVAL '3 days'
    AND deletion_warning_sent = false;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to mark warning as sent
CREATE OR REPLACE FUNCTION mark_deletion_warning_sent(project_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE items
  SET 
    deletion_warning_sent = true,
    updated_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create storage bucket for project images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage policies for project images
-- Note: Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 10. Row Level Security (RLS) policies for user_tokens
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_tokens;

CREATE POLICY "Users can view their own tokens"
ON user_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON user_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
ON user_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 11. Row Level Security (RLS) policies for items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Public items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;

CREATE POLICY "Public items are viewable by everyone"
ON items FOR SELECT
TO public
USING (is_public = true);

CREATE POLICY "Users can view their own items"
ON items FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own items"
ON items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own items"
ON items FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own items"
ON items FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 12. Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tokens_updated_at
BEFORE UPDATE ON user_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MANUAL STEPS REQUIRED:
-- ============================================
-- 
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up Cron Jobs in Supabase Dashboard:
--    - Daily at 00:00 UTC: SELECT reset_user_tokens();
--    - Daily at 00:00 UTC: SELECT schedule_old_project_deletions();
--    - Daily at 01:00 UTC: SELECT delete_scheduled_projects();
--
-- 3. Optional: Set up Edge Function for deletion warnings
--    (See implementation_plan.md for details)
--
-- ============================================
-- ============================================
-- RPC Functions for Likes and Views
-- ============================================

CREATE OR REPLACE FUNCTION increment_likes(row_id BIGINT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET likes = likes + amount
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_views(row_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET views = views + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

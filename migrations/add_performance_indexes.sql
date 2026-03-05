-- ==============================================
-- JejuRemaker: Performance Index Migration
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Index on owner_id (fixes fetchMyProjects timeout)
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items (owner_id);

-- 2. Index on category (speeds up fetchProjects, Community feed)
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);

-- 3. Index on is_public (speeds up public project filtering)
CREATE INDEX IF NOT EXISTS idx_items_is_public ON items (is_public);

-- 4. Composite index for common query pattern (owner + created_at sorting)
CREATE INDEX IF NOT EXISTS idx_items_owner_created ON items (owner_id, created_at DESC);

-- 5. Index on user_profiles.user_id for JOIN performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);

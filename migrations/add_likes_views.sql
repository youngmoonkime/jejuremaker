-- Add likes and views columns to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Update existing rows to have 0 likes and views if NULL
UPDATE items SET likes = 0 WHERE likes IS NULL;
UPDATE items SET views = 0 WHERE views IS NULL;

-- Add index for better query performance on trending page
CREATE INDEX IF NOT EXISTS idx_items_likes ON items(likes DESC);
CREATE INDEX IF NOT EXISTS idx_items_views ON items(views DESC);

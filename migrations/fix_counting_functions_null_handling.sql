-- ============================================
-- Fix Counting Functions: Robust NULL handling
-- ============================================

CREATE OR REPLACE FUNCTION increment_likes(row_id BIGINT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  IF amount NOT IN (1, -1) THEN
    RAISE EXCEPTION 'amount must be 1 or -1';
  END IF;
  
  UPDATE items
  SET likes = COALESCE(likes, 0) + amount
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_views(row_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE items
  SET views = COALESCE(views, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

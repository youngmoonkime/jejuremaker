-- ============================================
-- Security Fix: Protect increment_likes from abuse
-- Limits amount to 1 or -1 only
-- ============================================

CREATE OR REPLACE FUNCTION increment_likes(row_id BIGINT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  IF amount NOT IN (1, -1) THEN
    RAISE EXCEPTION 'amount must be 1 or -1';
  END IF;
  UPDATE items
  SET likes = likes + amount
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

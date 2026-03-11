-- ============================================
-- Update Token Reset to Daily 100 Tokens
-- ============================================

-- 1. Update existing default values for future signups
ALTER TABLE user_tokens 
ALTER COLUMN tokens_remaining SET DEFAULT 100;

-- 2. Update the reset function
CREATE OR REPLACE FUNCTION reset_user_tokens()
RETURNS void AS $$
BEGIN
  UPDATE user_tokens
  SET 
    tokens_remaining = 100,
    tokens_used = 0,
    last_reset_at = NOW(),
    next_reset_at = NOW() + INTERVAL '1 day',
    updated_at = NOW()
  WHERE next_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 3. (Optional) Force reset for all current users to 100 tokens and set next reset to tomorrow
-- Uncomment if you want to apply this immediately to all users
-- UPDATE user_tokens SET tokens_remaining = 100, tokens_used = 0, next_reset_at = NOW() + INTERVAL '1 day';

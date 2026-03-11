-- ============================================
-- Fix Token Reset Logic to align with Midnight
-- ============================================

-- Update the reset function to set next_reset_at to the beginning of the next day
CREATE OR REPLACE FUNCTION public.reset_user_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.user_tokens
  SET 
    tokens_remaining = 100,
    tokens_used = 0,
    last_reset_at = NOW(),
    -- (CURRENT_DATE + 1)::timestamp ensures it's 00:00:00 of the next day (UTC)
    next_reset_at = (CURRENT_DATE + 1)::timestamp,
    updated_at = NOW()
  WHERE next_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: If you want to force all current users to align with the next midnight reset
-- UPDATE public.user_tokens SET next_reset_at = (CURRENT_DATE + 1)::timestamp;

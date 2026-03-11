-- ============================================
-- Challenge Stats Update Migration
-- Purpose: Unify eco-score calculation and handle private progress
-- ============================================

-- RPC: get_remaker_challenge_stats(p_user_id UUID)
-- Returns:
--   global_public_co2, global_public_waste,
--   user_private_co2, user_private_waste,
--   global_public_count, user_private_count
-- ============================================

CREATE OR REPLACE FUNCTION get_remaker_challenge_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  global_public_co2 NUMERIC,
  global_public_waste NUMERIC,
  user_private_co2 NUMERIC,
  user_private_waste NUMERIC,
  global_public_count BIGINT,
  user_private_count BIGINT
) AS $$
BEGIN
  -- Prevent premature timeout
  SET LOCAL statement_timeout = '15s';

  RETURN QUERY
  WITH filtered_items AS (
    SELECT
      is_public,
      owner_id,
      -- Use a more direct COALESCE with manual parsing only where needed
      metadata->'eco_validation'->>'recalculated_eco_score' as v_score,
      metadata->>'eco_score' as e_score,
      metadata->>'co2_reduction' as c_score,
      metadata->>'material_qty' as m_qty,
      lower(metadata->>'material_unit') as m_unit,
      lower(material) as m_name
    FROM items
    WHERE (is_public IS TRUE OR (p_user_id IS NOT NULL AND owner_id = p_user_id))
      AND category != 'Social' -- Fast exact match
  ),
  computed_values AS (
    SELECT
      is_public,
      owner_id,
      -- Extract numeric value efficiently and ensure positive (absolute) impact
      ABS(COALESCE(
        NULLIF(regexp_replace(v_score, '[^0-9.-]', '', 'g'), '')::NUMERIC,
        NULLIF(regexp_replace(e_score, '[^0-9.-]', '', 'g'), '')::NUMERIC,
        NULLIF(regexp_replace(c_score, '[^0-9.-]', '', 'g'), '')::NUMERIC,
        1.2
      )) as co2_val,
      -- Waste calculation (Ensure positive)
      ABS(COALESCE(
        CASE 
          WHEN m_unit = 'kg' THEN NULLIF(regexp_replace(m_qty, '[^0-9.-]', '', 'g'), '')::NUMERIC
          WHEN m_unit = 'g' THEN NULLIF(regexp_replace(m_qty, '[^0-9.-]', '', 'g'), '')::NUMERIC / 1000.0
          WHEN m_unit IN ('ea', 'bottle') THEN 
            CASE 
              WHEN m_name LIKE '%denim%' THEN NULLIF(regexp_replace(m_qty, '[^0-9.-]', '', 'g'), '')::NUMERIC * 0.5
              WHEN m_name LIKE '%bottle%' THEN NULLIF(regexp_replace(m_qty, '[^0-9.-]', '', 'g'), '')::NUMERIC * 0.1
              ELSE NULLIF(regexp_replace(m_qty, '[^0-9.-]', '', 'g'), '')::NUMERIC * 0.2
            END
          ELSE NULLIF(regexp_replace(m_qty, '[^0-9.-]', '', 'g'), '')::NUMERIC
        END,
        0
      )) as waste_val
    FROM filtered_items
  )
  SELECT 
    COALESCE(SUM(co2_val) FILTER (WHERE is_public IS TRUE), 0)::NUMERIC,
    COALESCE(SUM(waste_val) FILTER (WHERE is_public IS TRUE), 0)::NUMERIC,
    COALESCE(SUM(co2_val) FILTER (WHERE p_user_id IS NOT NULL AND owner_id = p_user_id AND (is_public IS FALSE OR is_public IS NULL)), 0)::NUMERIC,
    COALESCE(SUM(waste_val) FILTER (WHERE p_user_id IS NOT NULL AND owner_id = p_user_id AND (is_public IS FALSE OR is_public IS NULL)), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE is_public IS TRUE),
    COUNT(*) FILTER (WHERE p_user_id IS NOT NULL AND owner_id = p_user_id AND (is_public IS FALSE OR is_public IS NULL))
  FROM computed_values;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

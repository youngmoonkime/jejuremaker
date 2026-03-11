-- ============================================
-- Add RPC for Global Eco Stats (Remaker Challenge)
-- Purpose: Calculate total carbon and waste saved directly in the DB
-- to avoid fetching 1000+ rows to the client.
-- ============================================

CREATE OR REPLACE FUNCTION get_global_eco_stats()
RETURNS TABLE (
  total_carbon_saved_kg NUMERIC,
  total_waste_saved_kg NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- 1. Carbon Reduction (kg) - Convert negative reductions to positive totals
    COALESCE(
        SUM(
            COALESCE(
                ABS(NULLIF(regexp_replace(metadata->eco_validation->>'recalculated_eco_score', '[^0-9.-]', '', 'g'), '')::NUMERIC),
                ABS(NULLIF(regexp_replace(metadata->>'eco_score', '[^0-9.-]', '', 'g'), '')::NUMERIC),
                ABS(eco_score),
                1.2
            )
        ), 
        0
    ) as total_carbon_saved_kg,
    
    -- 2. Waste Saved (Material Weight)
    COALESCE(
        SUM(
            CASE 
                WHEN lower(metadata->>'material_unit') = 'kg' THEN NULLIF(regexp_replace(metadata->>'material_qty', '[^0-9.-]', '', 'g'), '')::NUMERIC
                WHEN lower(metadata->>'material_unit') = 'g' THEN NULLIF(regexp_replace(metadata->>'material_qty', '[^0-9.-]', '', 'g'), '')::NUMERIC / 1000.0
                WHEN lower(metadata->>'material_unit') IN ('ea', 'bottle') THEN 
                    CASE 
                        WHEN lower(material) LIKE '%denim%' THEN NULLIF(regexp_replace(metadata->>'material_qty', '[^0-9.-]', '', 'g'), '')::NUMERIC * 0.5
                        WHEN lower(material) LIKE '%bottle%' THEN NULLIF(regexp_replace(metadata->>'material_qty', '[^0-9.-]', '', 'g'), '')::NUMERIC * 0.1
                        ELSE NULLIF(regexp_replace(metadata->>'material_qty', '[^0-9.-]', '', 'g'), '')::NUMERIC * 0.2
                    END
                ELSE NULLIF(regexp_replace(metadata->>'material_qty', '[^0-9.-]', '', 'g'), '')::NUMERIC
            END
        ),
        0
    ) as total_waste_saved_kg
  FROM items
  WHERE is_public = true AND category != 'Social';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- Atomic Comment Operations (prevents race conditions)
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Add a comment atomically (appends to metadata->'comments' array)
CREATE OR REPLACE FUNCTION add_comment(
    p_item_id UUID,
    p_comment JSONB
) RETURNS VOID AS $$
BEGIN
    UPDATE items
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{comments}',
        COALESCE(metadata->'comments', '[]'::jsonb) || p_comment
    )
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Delete a comment atomically (filters out by comment id)
CREATE OR REPLACE FUNCTION delete_comment(
    p_item_id UUID,
    p_comment_id TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE items
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{comments}',
        (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(metadata->'comments', '[]'::jsonb)) AS elem
            WHERE elem->>'id' != p_comment_id
        )
    )
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update a comment atomically (replaces text of matching comment id)
CREATE OR REPLACE FUNCTION update_comment(
    p_item_id UUID,
    p_comment_id TEXT,
    p_new_text TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE items
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{comments}',
        (
            SELECT COALESCE(jsonb_agg(
                CASE
                    WHEN elem->>'id' = p_comment_id
                    THEN jsonb_set(elem, '{text}', to_jsonb(p_new_text))
                    ELSE elem
                END
            ), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(metadata->'comments', '[]'::jsonb)) AS elem
        )
    )
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

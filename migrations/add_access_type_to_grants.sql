-- Drop old unique constraint
ALTER TABLE public.blueprint_access_grants DROP CONSTRAINT IF EXISTS blueprint_access_grants_project_id_user_id_key;

-- Add access_type column
ALTER TABLE public.blueprint_access_grants ADD COLUMN IF NOT EXISTS access_type VARCHAR(50) DEFAULT 'blueprint';

-- Add new unique constraint
ALTER TABLE public.blueprint_access_grants ADD CONSTRAINT blueprint_access_grants_project_user_type_key UNIQUE(project_id, user_id, access_type);

-- Update RPC to accept access_type
CREATE OR REPLACE FUNCTION grant_blueprint_access(p_project_id UUID, p_user_id UUID, p_access_type VARCHAR DEFAULT 'blueprint')
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Check if project exists and user is owner
    IF NOT EXISTS (
        SELECT 1 FROM public.items 
        WHERE id = p_project_id AND owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the project owner can grant access.';
    END IF;

    -- Insert grant (ignore if already exists due to UNIQUE constraint)
    INSERT INTO public.blueprint_access_grants (project_id, user_id, granted_by, access_type)
    VALUES (p_project_id, p_user_id, auth.uid(), p_access_type)
    ON CONFLICT (project_id, user_id, access_type) DO NOTHING;
END;
$$;

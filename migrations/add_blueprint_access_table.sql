-- 1. Create blueprint_access_grants table
CREATE TABLE IF NOT EXISTS public.blueprint_access_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 2. Row Level Security for blueprint_access_grants
ALTER TABLE public.blueprint_access_grants ENABLE ROW LEVEL SECURITY;

-- Project owners can manage (insert/select/delete) grants for their projects
-- Use items policy to check if current user is owner
CREATE POLICY "Project owners can manage grants" ON public.blueprint_access_grants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.items
            WHERE id = blueprint_access_grants.project_id
            AND owner_id = auth.uid()
        )
    );

-- Users can read their own grants
CREATE POLICY "Users can read their own grants" ON public.blueprint_access_grants
    FOR SELECT
    USING (user_id = auth.uid());

-- 3. Create a secure RPC function to grant access
-- This function runs with the privileges of the caller, so RLS policies on blueprint_access_grants will apply.
CREATE OR REPLACE FUNCTION grant_blueprint_access(p_project_id UUID, p_user_id UUID)
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
    INSERT INTO public.blueprint_access_grants (project_id, user_id, granted_by)
    VALUES (p_project_id, p_user_id, auth.uid())
    ON CONFLICT (project_id, user_id) DO NOTHING;
END;
$$;

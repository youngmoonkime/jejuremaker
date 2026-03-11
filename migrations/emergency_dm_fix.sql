-- Emergency fix for direct_messages table structure
-- Ensures project_id is nullable and metadata column exists

-- 1. Make project_id nullable if it was NOT NULL
ALTER TABLE IF EXISTS public.direct_messages 
ALTER COLUMN project_id DROP NOT NULL;

-- 2. Ensure metadata column exists
ALTER TABLE IF EXISTS public.direct_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Ensure is_read column exists (it should, but just in case)
ALTER TABLE IF EXISTS public.direct_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 4. Re-verify RLS policies for read access
-- Sometimes policies get stuck or misconfigured
DROP POLICY IF EXISTS "Users can read their own messages" ON public.direct_messages;
CREATE POLICY "Users can read their own messages"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. Enable realtime if missed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'direct_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
END
$$;

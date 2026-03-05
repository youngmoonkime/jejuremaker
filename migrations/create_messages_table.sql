-- Migration to create the missing messages table
-- This table is used for project-specific chat history in Workspace.tsx

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    message_text TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Note: Making it readable by anyone for now to match the "Anyone can view profiles" policy
-- but restricting inserts to authenticated users.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Anyone can read project messages'
    ) THEN
        CREATE POLICY "Anyone can read project messages" ON public.messages
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Authenticated users can insert messages'
    ) THEN
        CREATE POLICY "Authenticated users can insert messages" ON public.messages
            FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- Enable Realtime
-- Check if table is already in publication to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Publication might not exist or other issues; skip if it fails
        NULL;
END $$;

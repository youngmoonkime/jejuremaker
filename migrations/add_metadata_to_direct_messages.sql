-- Add metadata column to direct_messages table for storing request details (access_type, etc.)
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update the existing unread messages fetch to include metadata in the future
-- (This migration only handles the schema change)

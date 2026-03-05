-- 1. Add tags and is_online to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- 2. Create direct_messages table for chat/inquiries
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES items(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security for direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "Users can read their own messages" ON direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages to anyone
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Update read status (only receiver can mark as read)
CREATE POLICY "Receiver can update message status" ON direct_messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants 
ON direct_messages(sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_project 
ON direct_messages(project_id);

-- 4. Set up realtime for direct_messages and user_profiles (if not already)
-- This allows subscribing to chat messages and online status changes
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

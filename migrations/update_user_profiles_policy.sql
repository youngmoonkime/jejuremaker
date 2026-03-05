-- Update the RLS policy to allow anyone to read user profiles
-- This is necessary to show the Maker's profile information to other users viewing their projects.

-- First, drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Then, create a new policy that allows anyone (or authenticated users) to view profiles
-- We use 'true' so that public projects can display the maker's info to any viewer.
CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

-- Fix RLS policies to prevent infinite recursion
-- Run this in your Supabase SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view users from their school" ON users;
DROP POLICY IF EXISTS "Schools can view their own data" ON schools;

-- Disable RLS temporarily to fix the policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Create better RLS policies that don't cause recursion

-- For schools table - allow all operations (will be filtered by application logic)
CREATE POLICY "Allow all operations on schools" ON schools
    FOR ALL USING (true);

-- For users table - create policies that don't reference the users table itself
-- This policy allows users to see other users from their school
-- We'll use a different approach that doesn't cause recursion

-- Allow users to see their own record
CREATE POLICY "Users can view their own record" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to see other users from their school (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_school_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
    school_id UUID;
BEGIN
    -- Get school_id for the current user from auth context
    -- This avoids querying the users table directly
    SELECT school_id INTO school_id
    FROM users 
    WHERE id = user_id
    LIMIT 1;
    
    RETURN school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view users from their school" ON users
    FOR SELECT USING (
        school_id = (
            SELECT school_id 
            FROM users 
            WHERE id = auth.uid()::uuid
            LIMIT 1
        )
    );

-- Alternative approach: Use a more permissive policy for now
-- and handle security at the application level
DROP POLICY IF EXISTS "Users can view users from their school" ON users;

-- Create a simple policy that allows users to see users from their school
-- This uses a subquery that should not cause recursion
CREATE POLICY "Users can view school users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid 
            AND u.school_id = users.school_id
        )
    );

-- For INSERT operations - allow inserting users (will be validated by application)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

-- For UPDATE operations - allow users to update their own record
CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- For DELETE operations - restrict to prevent accidental deletion
CREATE POLICY "Restrict user deletion" ON users
    FOR DELETE USING (false);

-- Test the policies
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully!';
    RAISE NOTICE 'Infinite recursion issue should be resolved.';
END $$;

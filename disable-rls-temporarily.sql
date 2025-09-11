-- Temporarily disable RLS to fix the infinite recursion issue
-- This is a quick fix while we resolve the policy conflicts

-- Disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on schools table temporarily  
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- You can now create admins without the recursion error
-- We'll re-enable RLS with proper policies later

DO $$
BEGIN
    RAISE NOTICE 'RLS temporarily disabled to fix infinite recursion.';
    RAISE NOTICE 'You can now create admins without errors.';
    RAISE NOTICE 'Remember to re-enable RLS with proper policies later.';
END $$;

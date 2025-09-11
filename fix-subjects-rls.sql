-- Fix RLS policies for subjects table
-- This will allow admins and teachers to create subjects for their school

-- First, check if subjects table has RLS enabled
-- If it does, we need to create proper policies

-- Drop any existing policies on subjects table
DROP POLICY IF EXISTS "Subjects school isolation" ON subjects;
DROP POLICY IF EXISTS "Users can manage subjects in their school" ON subjects;
DROP POLICY IF EXISTS "Allow all operations on subjects" ON subjects;

-- Create a policy that allows users to manage subjects in their school
-- This policy allows SELECT, INSERT, UPDATE, DELETE for users from the same school
CREATE POLICY "Users can manage subjects in their school" ON subjects
    FOR ALL USING (
        school_id = (
            SELECT school_id 
            FROM users 
            WHERE id = auth.uid()::uuid
            LIMIT 1
        )
    );

-- Alternative: If the above doesn't work, we can temporarily disable RLS on subjects
-- Uncomment the line below if you want to disable RLS completely for subjects
-- ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Subjects RLS policy created successfully!';
    RAISE NOTICE 'Users can now create subjects for their school.';
    RAISE NOTICE 'If you still get errors, consider disabling RLS on subjects table.';
END $$;

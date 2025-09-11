-- Fix storage RLS policies to work with our custom authentication system
-- This removes the auth.uid() dependency and makes policies more permissive

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Everyone can view assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own submissions" ON storage.objects;

-- Create new permissive policies that work without auth.uid()

-- Submissions bucket - allow all authenticated users to upload/view
CREATE POLICY "Allow submissions upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Allow submissions view" ON storage.objects
FOR SELECT USING (bucket_id = 'submissions');

CREATE POLICY "Allow submissions update" ON storage.objects
FOR UPDATE USING (bucket_id = 'submissions');

CREATE POLICY "Allow submissions delete" ON storage.objects
FOR DELETE USING (bucket_id = 'submissions');

-- Assignments bucket - allow all authenticated users to upload/view
CREATE POLICY "Allow assignments upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assignments');

CREATE POLICY "Allow assignments view" ON storage.objects
FOR SELECT USING (bucket_id = 'assignments');

CREATE POLICY "Allow assignments update" ON storage.objects
FOR UPDATE USING (bucket_id = 'assignments');

CREATE POLICY "Allow assignments delete" ON storage.objects
FOR DELETE USING (bucket_id = 'assignments');

-- Avatars bucket - allow all authenticated users to upload/view
CREATE POLICY "Allow avatars upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow avatars view" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow avatars update" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Allow avatars delete" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars');

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Fix RLS policies for storage buckets
-- Run this in your Supabase SQL editor

-- First, let's check if the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Everyone can view assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create simpler, more permissive policies for now
-- These allow authenticated users to upload to their own folders

-- Submissions bucket policies
CREATE POLICY "Authenticated users can upload submissions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'submissions' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view submissions" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submissions' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update submissions" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'submissions' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete submissions" ON storage.objects
FOR DELETE USING (
  bucket_id = 'submissions' AND
  auth.role() = 'authenticated'
);

-- Assignments bucket policies
CREATE POLICY "Authenticated users can upload assignments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view assignments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated'
);

-- Avatars bucket policies
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Everyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

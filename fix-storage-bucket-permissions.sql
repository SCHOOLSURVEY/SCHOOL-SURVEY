-- Fix storage bucket permissions to allow public access for downloads
-- Run this in your Supabase SQL editor

-- Make submissions bucket public for easier file access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'submissions';

-- Make assignments bucket public for easier file access  
UPDATE storage.buckets 
SET public = true 
WHERE id = 'assignments';

-- Verify the changes
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('submissions', 'assignments', 'avatars');

-- Check if storage buckets exist
-- Run this in your Supabase SQL editor to see what buckets are available

SELECT 
  id as bucket_id,
  name as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY created_at;

-- If no buckets exist, you'll need to run the create-storage-buckets.sql script
-- to create the necessary buckets for file uploads.

-- Add missing columns to users table if they don't exist
-- Run this in your Supabase SQL Editor

-- Check if class_number column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'class_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN class_number VARCHAR(50);
        RAISE NOTICE 'Added class_number column to users table';
    ELSE
        RAISE NOTICE 'class_number column already exists';
    END IF;
END $$;

-- Check if phone column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Added phone column to users table';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;
END $$;

-- Check if department column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'department'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN department VARCHAR(100);
        RAISE NOTICE 'Added department column to users table';
    ELSE
        RAISE NOTICE 'department column already exists';
    END IF;
END $$;

-- Show the current structure
SELECT 
    'Current users table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

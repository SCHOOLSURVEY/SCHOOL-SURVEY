-- Fix submissions table to include school_id for multi-tenancy
-- This script adds the missing school_id column and updates existing records

-- First, check if school_id column exists
DO $$
BEGIN
    -- Add school_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'school_id'
    ) THEN
        ALTER TABLE submissions ADD COLUMN school_id UUID;
        RAISE NOTICE 'Added school_id column to submissions table';
    ELSE
        RAISE NOTICE 'school_id column already exists in submissions table';
    END IF;
END $$;

-- Update existing submissions to have a default school_id (if any exist)
-- This assumes you have at least one school in your schools table
UPDATE submissions 
SET school_id = (
    SELECT id FROM schools LIMIT 1
)
WHERE school_id IS NULL;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'submissions_school_id_fkey'
    ) THEN
        ALTER TABLE submissions 
        ADD CONSTRAINT submissions_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for school_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Make school_id NOT NULL after updating existing records
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'school_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE submissions ALTER COLUMN school_id SET NOT NULL;
        RAISE NOTICE 'Set school_id to NOT NULL';
    ELSE
        RAISE NOTICE 'school_id is already NOT NULL';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

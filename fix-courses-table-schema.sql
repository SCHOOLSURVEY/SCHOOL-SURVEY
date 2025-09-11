-- Fix courses table schema to match the application code
-- This adds the missing 'term' column to the courses table

-- First, let's check if the term column exists and add it if it doesn't
DO $$
BEGIN
    -- Check if the 'term' column exists in the courses table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'term'
    ) THEN
        -- Add the term column
        ALTER TABLE courses ADD COLUMN term VARCHAR(100);
        
        -- Update existing records with a default term value
        UPDATE courses SET term = 'Fall 2024' WHERE term IS NULL;
        
        -- Make the column NOT NULL after setting default values
        ALTER TABLE courses ALTER COLUMN term SET NOT NULL;
        
        RAISE NOTICE 'Added term column to courses table successfully!';
    ELSE
        RAISE NOTICE 'Term column already exists in courses table.';
    END IF;
END $$;

-- Also ensure we have all the necessary columns for the multi-tenant setup
DO $$
BEGIN
    -- Check if school_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'school_id'
    ) THEN
        -- Add school_id column
        ALTER TABLE courses ADD COLUMN school_id UUID;
        
        -- Set default school_id for existing records
        UPDATE courses SET school_id = (
            SELECT id FROM schools WHERE slug = 'default-school' LIMIT 1
        ) WHERE school_id IS NULL;
        
        -- Make it NOT NULL and add foreign key constraint
        ALTER TABLE courses ALTER COLUMN school_id SET NOT NULL;
        ALTER TABLE courses ADD CONSTRAINT fk_courses_school_id 
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added school_id column to courses table successfully!';
    ELSE
        RAISE NOTICE 'School_id column already exists in courses table.';
    END IF;
END $$;

-- Add any other missing columns that might be needed
DO $$
BEGIN
    -- Check if class_number column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'class_number'
    ) THEN
        ALTER TABLE courses ADD COLUMN class_number VARCHAR(50);
        UPDATE courses SET class_number = 'Default' WHERE class_number IS NULL;
        ALTER TABLE courses ALTER COLUMN class_number SET NOT NULL;
        RAISE NOTICE 'Added class_number column to courses table successfully!';
    ELSE
        RAISE NOTICE 'Class_number column already exists in courses table.';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'COURSES TABLE SCHEMA FIX COMPLETED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'The courses table now has all required columns:';
    RAISE NOTICE '- school_id (for multi-tenant isolation)';
    RAISE NOTICE '- term (for course term information)';
    RAISE NOTICE '- class_number (for class identification)';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'You can now create courses without errors!';
    RAISE NOTICE '=====================================================';
END $$;

-- Simple Nigerian Terms Setup
-- This creates a basic terms table with Nigerian academic terms

-- Create terms table if it doesn't exist (matches existing structure)
CREATE TABLE IF NOT EXISTS terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    academic_year_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic_years table if it doesn't exist
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default academic year if it doesn't exist (for each school)
DO $$
DECLARE
    school_record RECORD;
BEGIN
    -- Loop through all schools and create academic year for each
    FOR school_record IN SELECT id FROM schools LOOP
        INSERT INTO academic_years (school_id, name, start_date, end_date, is_current) 
        SELECT school_record.id, '2024/2025 Academic Year', '2024-09-01', '2025-08-31', true
        WHERE NOT EXISTS (
            SELECT 1 FROM academic_years 
            WHERE school_id = school_record.id AND name = '2024/2025 Academic Year'
        );
    END LOOP;
END $$;

-- Insert Nigerian terms if they don't exist (for each school)
DO $$
DECLARE
    school_record RECORD;
    current_year_id UUID;
BEGIN
    -- Loop through all schools and create terms for each
    FOR school_record IN SELECT id FROM schools LOOP
        -- Get the current academic year ID for this school
        SELECT id INTO current_year_id 
        FROM academic_years 
        WHERE school_id = school_record.id AND is_current = true 
        LIMIT 1;
        
        -- Insert terms with proper academic_year_id for this school
        INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current) 
        SELECT current_year_id, 'First Term 2024/2025', '2024-09-01', '2024-12-15', true
        WHERE NOT EXISTS (
            SELECT 1 FROM terms 
            WHERE academic_year_id = current_year_id AND name = 'First Term 2024/2025'
        );

        INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current) 
        SELECT current_year_id, 'Second Term 2024/2025', '2025-01-15', '2025-04-15', false
        WHERE NOT EXISTS (
            SELECT 1 FROM terms 
            WHERE academic_year_id = current_year_id AND name = 'Second Term 2024/2025'
        );

        INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current) 
        SELECT current_year_id, 'Third Term 2024/2025', '2025-05-01', '2025-07-15', false
        WHERE NOT EXISTS (
            SELECT 1 FROM terms 
            WHERE academic_year_id = current_year_id AND name = 'Third Term 2024/2025'
        );
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SIMPLE NIGERIAN TERMS CREATED SUCCESSFULLY! 🇳🇬';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Created terms table with Nigerian academic terms:';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Terms Available:';
    RAISE NOTICE '  - First Term 2024/2025 (Active)';
    RAISE NOTICE '  - Second Term 2024/2025';
    RAISE NOTICE '  - Third Term 2024/2025';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready for course creation!';
    RAISE NOTICE '✅ Perfect for Nigerian schools!';
    RAISE NOTICE '=====================================================';
END $$;

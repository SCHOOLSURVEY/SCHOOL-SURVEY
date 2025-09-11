-- Nigerian Academic System Setup
-- This creates a proper academic year structure for Nigerian schools

-- Create academic years table if it doesn't exist
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create terms table if it doesn't exist
CREATE TABLE IF NOT EXISTS terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    term_number INTEGER NOT NULL CHECK (term_number IN (1, 2, 3)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current academic year (2024/2025) if it doesn't exist
INSERT INTO academic_years (name, start_date, end_date, is_current) 
SELECT '2024/2025 Academic Year', '2024-09-01', '2025-08-31', true
WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE name = '2024/2025 Academic Year');

-- Get the current academic year ID
DO $$
DECLARE
    current_year_id UUID;
BEGIN
    SELECT id INTO current_year_id FROM academic_years WHERE is_current = true LIMIT 1;
    
    -- Insert Nigerian terms for current academic year if they don't exist
    INSERT INTO terms (academic_year_id, name, term_number, start_date, end_date, is_active) 
    SELECT current_year_id, 'First Term 2024/2025', 1, '2024-09-01', '2024-12-15', true
    WHERE NOT EXISTS (SELECT 1 FROM terms WHERE academic_year_id = current_year_id AND term_number = 1);
    
    INSERT INTO terms (academic_year_id, name, term_number, start_date, end_date, is_active) 
    SELECT current_year_id, 'Second Term 2024/2025', 2, '2025-01-15', '2025-04-15', false
    WHERE NOT EXISTS (SELECT 1 FROM terms WHERE academic_year_id = current_year_id AND term_number = 2);
    
    INSERT INTO terms (academic_year_id, name, term_number, start_date, end_date, is_active) 
    SELECT current_year_id, 'Third Term 2024/2025', 3, '2025-05-01', '2025-07-15', false
    WHERE NOT EXISTS (SELECT 1 FROM terms WHERE academic_year_id = current_year_id AND term_number = 3);
    
    -- Insert next academic year (2025/2026) if it doesn't exist
    INSERT INTO academic_years (name, start_date, end_date, is_current) 
    SELECT '2025/2026 Academic Year', '2025-09-01', '2026-08-31', false
    WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE name = '2025/2026 Academic Year');
    
    -- Get the next academic year ID
    SELECT id INTO current_year_id FROM academic_years WHERE name = '2025/2026 Academic Year' LIMIT 1;
    
    -- Insert Nigerian terms for next academic year if they don't exist
    INSERT INTO terms (academic_year_id, name, term_number, start_date, end_date, is_active) 
    SELECT current_year_id, 'First Term 2025/2026', 1, '2025-09-01', '2025-12-15', false
    WHERE NOT EXISTS (SELECT 1 FROM terms WHERE academic_year_id = current_year_id AND term_number = 1);
    
    INSERT INTO terms (academic_year_id, name, term_number, start_date, end_date, is_active) 
    SELECT current_year_id, 'Second Term 2025/2026', 2, '2026-01-15', '2026-04-15', false
    WHERE NOT EXISTS (SELECT 1 FROM terms WHERE academic_year_id = current_year_id AND term_number = 2);
    
    INSERT INTO terms (academic_year_id, name, term_number, start_date, end_date, is_active) 
    SELECT current_year_id, 'Third Term 2025/2026', 3, '2026-05-01', '2026-07-15', false
    WHERE NOT EXISTS (SELECT 1 FROM terms WHERE academic_year_id = current_year_id AND term_number = 3);
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'NIGERIAN ACADEMIC SYSTEM SETUP COMPLETE! 🇳🇬';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Created proper Nigerian academic structure:';
    RAISE NOTICE '';
    RAISE NOTICE '📅 Academic Years:';
    RAISE NOTICE '  - 2024/2025 (Current)';
    RAISE NOTICE '  - 2025/2026 (Future)';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Terms for 2024/2025:';
    RAISE NOTICE '  - First Term: Sep 1 - Dec 15, 2024 (Active)';
    RAISE NOTICE '  - Second Term: Jan 15 - Apr 15, 2025';
    RAISE NOTICE '  - Third Term: May 1 - Jul 15, 2025';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Terms for 2025/2026:';
    RAISE NOTICE '  - First Term: Sep 1 - Dec 15, 2025';
    RAISE NOTICE '  - Second Term: Jan 15 - Apr 15, 2026';
    RAISE NOTICE '  - Third Term: May 1 - Jul 15, 2026';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Perfect for Nigerian schools!';
    RAISE NOTICE '✅ Ready for course creation!';
    RAISE NOTICE '=====================================================';
END $$;

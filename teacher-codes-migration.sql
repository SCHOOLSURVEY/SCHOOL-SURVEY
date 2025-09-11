-- =====================================================
-- TEACHER CODES MIGRATION SCRIPT
-- Add teacher code functionality to existing database
-- =====================================================

-- Step 1: Add abbreviation column to schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10);

-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'schools_abbreviation_unique'
    ) THEN
        ALTER TABLE schools ADD CONSTRAINT schools_abbreviation_unique UNIQUE (abbreviation);
    END IF;
END $$;

-- Step 2: Update existing school with abbreviation
UPDATE schools 
SET abbreviation = 'DEF' 
WHERE id = '00000000-0000-0000-0000-000000000001' 
AND abbreviation IS NULL;

-- Step 3: Create teacher codes table
CREATE TABLE IF NOT EXISTS teacher_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- Format: SCHOOL-TEACHER-CLASS (e.g., "ABC-JOHN-10A")
    teacher_name VARCHAR(100) NOT NULL, -- Full name for display
    class_identifier VARCHAR(20) NOT NULL, -- Class they'll teach (e.g., "10A", "12B")
    subject_specialty VARCHAR(100), -- What subject they teach
    created_by UUID REFERENCES users(id), -- Admin who created the code
    is_active BOOLEAN DEFAULT TRUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES users(id), -- Teacher who used this code
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code)
);

-- Step 4: Add indexes for teacher codes
CREATE INDEX IF NOT EXISTS idx_teacher_codes_school_id ON teacher_codes(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_codes_code ON teacher_codes(code);
CREATE INDEX IF NOT EXISTS idx_teacher_codes_is_active ON teacher_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_codes_is_used ON teacher_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_teacher_codes_used_by ON teacher_codes(used_by);

-- Step 5: Enable RLS on teacher codes table
ALTER TABLE teacher_codes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create human-friendly secure teacher code generation functions
CREATE OR REPLACE FUNCTION generate_teacher_initials(
    p_teacher_name VARCHAR(100)
) RETURNS VARCHAR(10) AS $$
DECLARE
    name_parts TEXT[];
    initials VARCHAR(10);
BEGIN
    -- Split name by spaces and get first letter of each part
    name_parts := STRING_TO_ARRAY(TRIM(p_teacher_name), ' ');
    initials := '';
    
    -- Get first 2-3 initials (max 3 for readability)
    FOR i IN 1..LEAST(ARRAY_LENGTH(name_parts, 1), 3) LOOP
        IF LENGTH(name_parts[i]) > 0 THEN
            initials := initials || UPPER(LEFT(name_parts[i], 1));
        END IF;
    END LOOP;
    
    -- Ensure we have at least 2 characters
    IF LENGTH(initials) < 2 THEN
        initials := initials || 'X';
    END IF;
    
    RETURN initials;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_secure_teacher_code(
    p_school_abbrev VARCHAR(10),
    p_teacher_name VARCHAR(100)
) RETURNS VARCHAR(50) AS $$
DECLARE
    initials VARCHAR(10);
    random_suffix VARCHAR(8);
    generated_code VARCHAR(50);
BEGIN
    -- Get teacher initials
    initials := generate_teacher_initials(p_teacher_name);
    
    -- Generate secure random suffix
    random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Generate code: SCHOOL-INITIALS-RANDOM
    generated_code := UPPER(p_school_abbrev) || '-' || initials || '-' || random_suffix;
    
    RETURN generated_code;
END;
$$ LANGUAGE plpgsql;

-- Legacy function for backward compatibility (but now generates secure codes)
CREATE OR REPLACE FUNCTION generate_teacher_code(
    p_school_abbrev VARCHAR(10),
    p_teacher_name VARCHAR(100),
    p_class_identifier VARCHAR(20)
) RETURNS VARCHAR(50) AS $$
BEGIN
    -- Use human-friendly secure generation
    RETURN generate_secure_teacher_code(p_school_abbrev, p_teacher_name);
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to create teacher code
CREATE OR REPLACE FUNCTION create_teacher_code(
    p_school_id UUID,
    p_teacher_name VARCHAR(100),
    p_class_identifier VARCHAR(20),
    p_subject_specialty VARCHAR(100) DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS VARCHAR(50) AS $$
DECLARE
    school_abbrev VARCHAR(10);
    generated_code VARCHAR(50);
    teacher_code_id UUID;
BEGIN
    -- Get school abbreviation
    SELECT abbreviation INTO school_abbrev 
    FROM schools 
    WHERE id = p_school_id;
    
    IF school_abbrev IS NULL THEN
        RAISE EXCEPTION 'School not found or abbreviation not set';
    END IF;
    
    -- Generate unique code
    generated_code := generate_teacher_code(school_abbrev, p_teacher_name, p_class_identifier);
    
    -- Check if code already exists
    IF EXISTS (SELECT 1 FROM teacher_codes WHERE code = generated_code) THEN
        -- Add random suffix to make it unique
        generated_code := generated_code || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    END IF;
    
    -- Insert teacher code
    INSERT INTO teacher_codes (
        school_id, 
        code, 
        teacher_name, 
        class_identifier, 
        subject_specialty, 
        created_by, 
        expires_at
    ) VALUES (
        p_school_id, 
        generated_code, 
        p_teacher_name, 
        p_class_identifier, 
        p_subject_specialty, 
        p_created_by, 
        p_expires_at
    ) RETURNING id INTO teacher_code_id;
    
    RETURN generated_code;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to validate and use teacher code
CREATE OR REPLACE FUNCTION use_teacher_code(
    p_code VARCHAR(50),
    p_teacher_email VARCHAR(255),
    p_teacher_phone VARCHAR(20) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    code_record RECORD;
    new_user_id UUID;
    result JSONB;
BEGIN
    -- Find the teacher code
    SELECT * INTO code_record 
    FROM teacher_codes 
    WHERE code = p_code 
    AND is_active = TRUE 
    AND is_used = FALSE 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired teacher code'
        );
    END IF;
    
    -- Create user account
    INSERT INTO users (
        school_id,
        unique_id,
        email,
        full_name,
        role,
        phone
    ) VALUES (
        code_record.school_id,
        p_code, -- Use the code as unique_id
        p_teacher_email,
        code_record.teacher_name,
        'teacher',
        p_teacher_phone
    ) RETURNING id INTO new_user_id;
    
    -- Create user profile
    INSERT INTO user_profiles (
        user_id,
        school_id,
        role,
        class_number,
        subject_specialties
    ) VALUES (
        new_user_id,
        code_record.school_id,
        'teacher',
        code_record.class_identifier,
        CASE 
            WHEN code_record.subject_specialty IS NOT NULL 
            THEN ARRAY[code_record.subject_specialty]
            ELSE NULL
        END
    );
    
    -- Mark code as used
    UPDATE teacher_codes 
    SET is_used = TRUE, 
        used_by = new_user_id, 
        used_at = NOW() 
    WHERE id = code_record.id;
    
    -- Return success with user info
    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'teacher_code', p_code,
        'school_id', code_record.school_id,
        'message', 'Teacher account created successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add trigger for updated_at on teacher_codes (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_teacher_codes_updated_at'
    ) THEN
        CREATE TRIGGER update_teacher_codes_updated_at BEFORE UPDATE ON teacher_codes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 10: Insert sample teacher codes (using secure generation)
INSERT INTO teacher_codes (school_id, code, teacher_name, class_identifier, subject_specialty) VALUES
('00000000-0000-0000-0000-000000000001', generate_secure_teacher_code('DEF', 'John Smith'), 'John Smith', '10A', 'Mathematics'),
('00000000-0000-0000-0000-000000000001', generate_secure_teacher_code('DEF', 'Mary Johnson'), 'Mary Johnson', '12B', 'English Literature'),
('00000000-0000-0000-0000-000000000001', generate_secure_teacher_code('DEF', 'Peter Brown'), 'Peter Brown', '9C', 'Science'),
('00000000-0000-0000-0000-000000000001', generate_secure_teacher_code('DEF', 'Sarah Wilson'), 'Sarah Wilson', '11A', 'History')
ON CONFLICT (code) DO NOTHING;

-- Step 11: Create teacher code recovery functions
CREATE OR REPLACE FUNCTION recover_teacher_code(
    p_teacher_email VARCHAR(255),
    p_teacher_name VARCHAR(100)
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    code_record RECORD;
    result JSONB;
BEGIN
    -- Find user by email and name
    SELECT u.*, up.school_id as profile_school_id
    INTO user_record
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    WHERE u.email = p_teacher_email 
    AND u.full_name ILIKE '%' || p_teacher_name || '%'
    AND u.role = 'teacher';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Teacher not found. Please check your email and name.'
        );
    END IF;
    
    -- Find the teacher code that was used
    SELECT tc.*
    INTO code_record
    FROM teacher_codes tc
    WHERE tc.used_by = user_record.id
    AND tc.is_used = TRUE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No teacher code found for this account.'
        );
    END IF;
    
    -- Return the teacher code
    RETURN jsonb_build_object(
        'success', true,
        'teacher_code', code_record.code,
        'teacher_name', code_record.teacher_name,
        'class_identifier', code_record.class_identifier,
        'subject_specialty', code_record.subject_specialty,
        'message', 'Your teacher code has been recovered successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to regenerate teacher code (admin only)
CREATE OR REPLACE FUNCTION regenerate_teacher_code(
    p_teacher_id UUID,
    p_admin_id UUID
) RETURNS JSONB AS $$
DECLARE
    teacher_record RECORD;
    school_abbrev VARCHAR(10);
    new_code VARCHAR(50);
    result JSONB;
BEGIN
    -- Verify admin has permission (basic check)
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND role = 'admin'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized. Only admins can regenerate teacher codes.'
        );
    END IF;
    
    -- Get teacher information
    SELECT u.*, up.school_id as profile_school_id
    INTO teacher_record
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = p_teacher_id
    AND u.role = 'teacher';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Teacher not found.'
        );
    END IF;
    
    -- Get school abbreviation
    SELECT abbreviation INTO school_abbrev
    FROM schools
    WHERE id = teacher_record.profile_school_id;
    
    -- Generate new code
    new_code := generate_secure_teacher_code(school_abbrev, teacher_record.full_name);
    
    -- Update the teacher's unique_id with new code
    UPDATE users 
    SET unique_id = new_code,
        updated_at = NOW()
    WHERE id = p_teacher_id;
    
    -- Update the teacher code record
    UPDATE teacher_codes
    SET code = new_code,
        updated_at = NOW()
    WHERE used_by = p_teacher_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'new_teacher_code', new_code,
        'teacher_name', teacher_record.full_name,
        'message', 'Teacher code regenerated successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Test the functions
SELECT 'Migration completed successfully!' as status;

-- Test teacher code generation
SELECT create_teacher_code(
    '00000000-0000-0000-0000-000000000001',
    'Test Teacher',
    'TEST',
    'Test Subject'
) as generated_code;

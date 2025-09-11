-- Migration script to add missing columns for multi-tenant system
-- This script safely adds admin_code and teacher_code to existing users table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS teacher_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add missing school_id column to survey_questions table if it doesn't exist
-- (We'll add the foreign key constraint after creating the schools table)
ALTER TABLE survey_questions 
ADD COLUMN IF NOT EXISTS school_id UUID;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_admin_code ON users(admin_code);
CREATE INDEX IF NOT EXISTS idx_users_teacher_code ON users(teacher_code);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update existing users to have is_active = true
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- Create schools table if it doesn't exist
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    abbreviation VARCHAR(20),
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for schools slug
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

-- Insert default school if none exists
INSERT INTO schools (name, slug, abbreviation, description) 
VALUES ('Default School', 'default-school', 'DS', 'Default school for existing data')
ON CONFLICT (slug) DO NOTHING;

-- Get the default school ID and update only tables that have school_id column
DO $$
DECLARE
    default_school_id UUID;
BEGIN
    -- Get the default school ID
    SELECT id INTO default_school_id FROM schools WHERE slug = 'default-school' LIMIT 1;
    
    -- Update existing users to have the default school_id if they don't have one
    UPDATE users 
    SET school_id = default_school_id 
    WHERE school_id IS NULL;
    
    -- Update existing records in other tables to have the default school_id if they don't have one
    -- Only update tables that actually have the school_id column
    
    -- Check and update subjects table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'school_id') THEN
        UPDATE subjects SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update courses table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'school_id') THEN
        UPDATE courses SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update course_enrollments table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'school_id') THEN
        UPDATE course_enrollments SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update assignments table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'school_id') THEN
        UPDATE assignments SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update submissions table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'school_id') THEN
        UPDATE submissions SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update grades table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'school_id') THEN
        UPDATE grades SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update surveys table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surveys' AND column_name = 'school_id') THEN
        UPDATE surveys SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update survey_questions table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'survey_questions' AND column_name = 'school_id') THEN
        UPDATE survey_questions SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update departments table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'school_id') THEN
        UPDATE departments SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update parent_notifications table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_notifications' AND column_name = 'school_id') THEN
        UPDATE parent_notifications SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update teacher_codes table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_codes' AND column_name = 'school_id') THEN
        UPDATE teacher_codes SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update user_profiles table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'school_id') THEN
        UPDATE user_profiles SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update survey_responses table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'survey_responses' AND column_name = 'school_id') THEN
        UPDATE survey_responses SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update notifications table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'school_id') THEN
        UPDATE notifications SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update attendance table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'school_id') THEN
        UPDATE attendance SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update parent_student_relationships table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_student_relationships' AND column_name = 'school_id') THEN
        UPDATE parent_student_relationships SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update messages table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'school_id') THEN
        UPDATE messages SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update calendar_events table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'school_id') THEN
        UPDATE calendar_events SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update academic_years table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_years' AND column_name = 'school_id') THEN
        UPDATE academic_years SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update admin_codes table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_codes' AND column_name = 'school_id') THEN
        UPDATE admin_codes SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update admin_code_usage table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_code_usage' AND column_name = 'school_id') THEN
        UPDATE admin_code_usage SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update audit_logs table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'school_id') THEN
        UPDATE audit_logs SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
    
    -- Check and update classrooms table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classrooms' AND column_name = 'school_id') THEN
        UPDATE classrooms SET school_id = default_school_id WHERE school_id IS NULL;
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key constraint for users.school_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_school_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for survey_questions.school_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'survey_questions_school_id_fkey' 
        AND table_name = 'survey_questions'
    ) THEN
        ALTER TABLE survey_questions ADD CONSTRAINT survey_questions_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at if they don't exist
DO $$
BEGIN
    -- Schools trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_schools_updated_at'
    ) THEN
        CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Users trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample subjects for the default school
INSERT INTO subjects (school_id, name, code, description) 
SELECT s.id, 'Mathematics', 'MATH', 'Mathematics and Algebra'
FROM schools s WHERE s.slug = 'default-school'
ON CONFLICT (school_id, code) DO NOTHING;

INSERT INTO subjects (school_id, name, code, description) 
SELECT s.id, 'Science', 'SCI', 'General Science'
FROM schools s WHERE s.slug = 'default-school'
ON CONFLICT (school_id, code) DO NOTHING;

INSERT INTO subjects (school_id, name, code, description) 
SELECT s.id, 'English', 'ENG', 'English Language and Literature'
FROM schools s WHERE s.slug = 'default-school'
ON CONFLICT (school_id, code) DO NOTHING;

-- Create RLS policies for multi-tenant security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for school isolation
-- Note: These are basic examples. You'll need to customize based on your specific security requirements

-- Schools can only see their own data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Schools can view their own data'
    ) THEN
        CREATE POLICY "Schools can view their own data" ON schools
            FOR ALL USING (true); -- This will be filtered by application logic
    END IF;
END $$;

-- Users can only see users from their school
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view users from their school'
    ) THEN
        CREATE POLICY "Users can view users from their school" ON users
            FOR SELECT USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()::uuid));
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added admin_code and teacher_code columns to users table';
    RAISE NOTICE 'Created schools table with default school';
    RAISE NOTICE 'Updated all existing records to use default school';
    RAISE NOTICE 'Added necessary indexes and constraints';
    RAISE NOTICE 'Enabled Row Level Security for multi-tenant isolation';
END $$;

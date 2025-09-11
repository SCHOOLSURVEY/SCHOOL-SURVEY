-- =====================================================
-- CLEAN SCHOOL MANAGEMENT SYSTEM DATABASE SCHEMA
-- Multi-Tenant, Optimized, Secure
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Schools table (Multi-tenant foundation)
CREATE TABLE schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    abbreviation VARCHAR(10) NOT NULL, -- For teacher codes (e.g., "ABC", "XYZ")
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(abbreviation)
);

-- Academic years table
CREATE TABLE academic_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "2024-2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Terms/Semesters table
CREATE TABLE terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g., "Fall 2024", "Spring 2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(academic_year_id, name)
);

-- Departments table
CREATE TABLE departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Mathematics", "Science", "Languages"
    code VARCHAR(10) NOT NULL, -- e.g., "MATH", "SCI", "LANG"
    description TEXT,
    head_teacher_id UUID, -- Will reference users table after creation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, code)
);

-- Users table (Students, Teachers, Admins, Parents)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    unique_id VARCHAR(50) NOT NULL, -- Student/Teacher ID
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    avatar_url TEXT,
    parent_email VARCHAR(255), -- For students
    parent_phone VARCHAR(20), -- For students
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, unique_id),
    UNIQUE(school_id, email)
);

-- User profiles table (School-specific roles and permissions)
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    permissions JSONB DEFAULT '{}',
    class_number VARCHAR(50), -- For students
    grade_level VARCHAR(20), -- For students
    subject_specialties TEXT[], -- For teachers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, school_id)
);

-- Subjects table
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, code)
);

-- Classrooms table
CREATE TABLE classrooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Room 101", "Lab A"
    capacity INTEGER,
    room_type VARCHAR(50) DEFAULT 'classroom', -- classroom, lab, library, etc.
    location VARCHAR(255),
    equipment TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Courses table (Subject + Teacher + Class + Term)
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    class_number VARCHAR(50) NOT NULL, -- e.g., "10A", "12B"
    schedule JSONB, -- Store class schedule as JSON
    max_students INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, subject_id, teacher_id, term_id, class_number)
);

-- Course enrollments table
CREATE TABLE course_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed', 'suspended')),
    final_grade VARCHAR(5), -- A, B, C, D, F
    credits_earned INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id, term_id)
);

-- =====================================================
-- ACADEMIC MANAGEMENT TABLES
-- =====================================================

-- Assignments table
CREATE TABLE assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50) NOT NULL DEFAULT 'homework', -- homework, quiz, exam, project
    points_possible DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    due_date TIMESTAMP WITH TIME ZONE,
    instructions TEXT,
    attachments JSONB DEFAULT '[]', -- Store file URLs and metadata
    is_published BOOLEAN DEFAULT FALSE,
    allow_late_submission BOOLEAN DEFAULT TRUE,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    attachments JSONB DEFAULT '[]', -- Store file URLs and metadata
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'missing')),
    is_late BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Grades table
CREATE TABLE grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_earned DECIMAL(5,2),
    percentage DECIMAL(5,2),
    letter_grade VARCHAR(5), -- A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F
    comments TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Attendance table
CREATE TABLE attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id, date)
);

-- =====================================================
-- SURVEY SYSTEM TABLES
-- =====================================================

-- Surveys table
CREATE TABLE surveys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    survey_type VARCHAR(20) NOT NULL CHECK (survey_type IN ('weekly', 'monthly', 'term', 'semester', 'custom')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closes_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'
);

-- Survey questions table
CREATE TABLE survey_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('rating', 'multiple_choice', 'text', 'boolean')),
    options JSONB, -- For multiple choice questions
    is_required BOOLEAN DEFAULT FALSE,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey responses table
CREATE TABLE survey_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    response_value TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id, student_id, question_id)
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'announcement', 'course', 'system')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent notifications table
CREATE TABLE parent_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_contact VARCHAR(255) NOT NULL, -- Email or phone
    contact_type VARCHAR(10) NOT NULL CHECK (contact_type IN ('email', 'sms')),
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- ADMINISTRATIVE TABLES
-- =====================================================

-- Teacher codes table (for teacher registration)
CREATE TABLE teacher_codes (
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

-- Admin codes table
CREATE TABLE admin_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, code)
);

-- Admin code usage table
CREATE TABLE admin_code_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_code_id UUID NOT NULL REFERENCES admin_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Parent-student relationships table
CREATE TABLE parent_student_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'parent',
    is_primary BOOLEAN DEFAULT FALSE,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Calendar events table
CREATE TABLE calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('assignment_due', 'exam', 'holiday', 'meeting', 'announcement', 'custom')),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT AND LOGGING TABLES
-- =====================================================

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Schools indexes
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_schools_is_active ON schools(is_active);

-- Users indexes
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_unique_id ON users(unique_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_school_id ON user_profiles(school_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Academic indexes
CREATE INDEX idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX idx_academic_years_is_current ON academic_years(is_current);
CREATE INDEX idx_terms_academic_year_id ON terms(academic_year_id);
CREATE INDEX idx_terms_is_current ON terms(is_current);

-- Subjects and departments indexes
CREATE INDEX idx_subjects_school_id ON subjects(school_id);
CREATE INDEX idx_subjects_department_id ON subjects(department_id);
CREATE INDEX idx_departments_school_id ON departments(school_id);

-- Courses indexes
CREATE INDEX idx_courses_school_id ON courses(school_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_subject_id ON courses(subject_id);
CREATE INDEX idx_courses_term_id ON courses(term_id);
CREATE INDEX idx_courses_is_active ON courses(is_active);

-- Course enrollments indexes
CREATE INDEX idx_course_enrollments_school_id ON course_enrollments(school_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(status);

-- Assignments indexes
CREATE INDEX idx_assignments_school_id ON assignments(school_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_is_published ON assignments(is_published);

-- Submissions indexes
CREATE INDEX idx_submissions_school_id ON submissions(school_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- Grades indexes
CREATE INDEX idx_grades_school_id ON grades(school_id);
CREATE INDEX idx_grades_assignment_id ON grades(assignment_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);

-- Attendance indexes
CREATE INDEX idx_attendance_school_id ON attendance(school_id);
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Survey indexes
CREATE INDEX idx_surveys_school_id ON surveys(school_id);
CREATE INDEX idx_surveys_course_id ON surveys(course_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX idx_survey_responses_school_id ON survey_responses(school_id);
CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_student_id ON survey_responses(student_id);

-- Communication indexes
CREATE INDEX idx_messages_school_id ON messages(school_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_course_id ON messages(course_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_notifications_school_id ON notifications(school_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Teacher codes indexes
CREATE INDEX idx_teacher_codes_school_id ON teacher_codes(school_id);
CREATE INDEX idx_teacher_codes_code ON teacher_codes(code);
CREATE INDEX idx_teacher_codes_is_active ON teacher_codes(is_active);
CREATE INDEX idx_teacher_codes_is_used ON teacher_codes(is_used);
CREATE INDEX idx_teacher_codes_used_by ON teacher_codes(used_by);

-- Admin indexes
CREATE INDEX idx_admin_codes_school_id ON admin_codes(school_id);
CREATE INDEX idx_admin_codes_code ON admin_codes(code);
CREATE INDEX idx_admin_codes_is_active ON admin_codes(is_active);
CREATE INDEX idx_admin_code_usage_admin_code_id ON admin_code_usage(admin_code_id);

-- Calendar indexes
CREATE INDEX idx_calendar_events_school_id ON calendar_events(school_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_course_id ON calendar_events(course_id);

-- Audit indexes
CREATE INDEX idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_codes_updated_at BEFORE UPDATE ON admin_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TEACHER CODE GENERATION FUNCTIONS
-- =====================================================

-- Function to generate teacher code
CREATE OR REPLACE FUNCTION generate_teacher_code(
    p_school_abbrev VARCHAR(10),
    p_teacher_name VARCHAR(100),
    p_class_identifier VARCHAR(20)
) RETURNS VARCHAR(50) AS $$
DECLARE
    clean_teacher_name VARCHAR(50);
    generated_code VARCHAR(50);
BEGIN
    -- Clean teacher name: remove spaces, convert to uppercase, take first 10 chars
    clean_teacher_name := UPPER(REGEXP_REPLACE(p_teacher_name, '[^a-zA-Z]', '', 'g'));
    clean_teacher_name := LEFT(clean_teacher_name, 10);
    
    -- Generate code: SCHOOL-TEACHER-CLASS
    generated_code := UPPER(p_school_abbrev) || '-' || clean_teacher_name || '-' || UPPER(p_class_identifier);
    
    RETURN generated_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create teacher code
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
        RAISE EXCEPTION 'School not found';
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

-- Function to validate and use teacher code
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

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample school
INSERT INTO schools (id, name, slug, abbreviation, description) VALUES
('00000000-0000-0000-0000-000000000001', 'Default School', 'default-school', 'DEF', 'Default school for existing users');

-- Insert sample academic year
INSERT INTO academic_years (school_id, name, start_date, end_date, is_current) VALUES
('00000000-0000-0000-0000-000000000001', '2024-2025', '2024-09-01', '2025-08-31', TRUE);

-- Insert sample terms
INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current) VALUES
((SELECT id FROM academic_years WHERE school_id = '00000000-0000-0000-0000-000000000001' AND is_current = TRUE), 'Fall 2024', '2024-09-01', '2024-12-20', TRUE),
((SELECT id FROM academic_years WHERE school_id = '00000000-0000-0000-0000-000000000001' AND is_current = TRUE), 'Spring 2025', '2025-01-15', '2025-05-30', FALSE);

-- Insert sample departments
INSERT INTO departments (school_id, name, code, description) VALUES
('00000000-0000-0000-0000-000000000001', 'Mathematics', 'MATH', 'Mathematics and Statistics'),
('00000000-0000-0000-0000-000000000001', 'Science', 'SCI', 'Physical and Life Sciences'),
('00000000-0000-0000-0000-000000000001', 'Languages', 'LANG', 'English and Foreign Languages'),
('00000000-0000-0000-0000-000000000001', 'Social Studies', 'SOC', 'History and Social Sciences'),
('00000000-0000-0000-0000-000000000001', 'Arts', 'ARTS', 'Visual and Performing Arts');

-- Insert sample subjects
INSERT INTO subjects (school_id, department_id, name, code, description) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM departments WHERE code = 'MATH' AND school_id = '00000000-0000-0000-0000-000000000001'), 'Algebra I', 'ALG1', 'Introduction to Algebra'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM departments WHERE code = 'MATH' AND school_id = '00000000-0000-0000-0000-000000000001'), 'Geometry', 'GEO', 'Plane and Solid Geometry'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM departments WHERE code = 'SCI' AND school_id = '00000000-0000-0000-0000-000000000001'), 'Biology', 'BIO', 'Introduction to Biology'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM departments WHERE code = 'SCI' AND school_id = '00000000-0000-0000-0000-000000000001'), 'Chemistry', 'CHEM', 'Introduction to Chemistry'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM departments WHERE code = 'LANG' AND school_id = '00000000-0000-0000-0000-000000000001'), 'English Literature', 'ENG', 'English Language and Literature'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM departments WHERE code = 'SOC' AND school_id = '00000000-0000-0000-0000-000000000001'), 'World History', 'HIST', 'World History and Geography');

-- Insert sample classrooms
INSERT INTO classrooms (school_id, name, capacity, room_type, location) VALUES
('00000000-0000-0000-0000-000000000001', 'Room 101', 30, 'classroom', 'First Floor'),
('00000000-0000-0000-0000-000000000001', 'Room 102', 30, 'classroom', 'First Floor'),
('00000000-0000-0000-0000-000000000001', 'Lab A', 20, 'lab', 'Second Floor'),
('00000000-0000-0000-0000-000000000001', 'Lab B', 20, 'lab', 'Second Floor'),
('00000000-0000-0000-0000-000000000001', 'Library', 50, 'library', 'Ground Floor');

-- Insert sample teacher codes (examples)
INSERT INTO teacher_codes (school_id, code, teacher_name, class_identifier, subject_specialty) VALUES
('00000000-0000-0000-0000-000000000001', 'DEF-JOHN-10A', 'John Smith', '10A', 'Mathematics'),
('00000000-0000-0000-0000-000000000001', 'DEF-MARY-12B', 'Mary Johnson', '12B', 'English Literature'),
('00000000-0000-0000-0000-000000000001', 'DEF-PETER-9C', 'Peter Brown', '9C', 'Science'),
('00000000-0000-0000-0000-000000000001', 'DEF-SARAH-11A', 'Sarah Wilson', '11A', 'History');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This schema is now ready for use!
-- Next steps:
-- 1. Update your application's environment variables
-- 2. Migrate your existing user data
-- 3. Test the multi-tenant functionality
-- 4. Implement additional RLS policies as needed

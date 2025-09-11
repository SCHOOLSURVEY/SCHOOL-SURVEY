-- Quick Database Structure Verification
-- Run this in your Supabase SQL Editor to verify the authentication system setup

-- 1. Check if schools table exists and has data
SELECT 'Schools Table' as check_name, COUNT(*) as count FROM schools;

-- 2. Check if users table has the new columns
SELECT 
    'Users Table Columns' as check_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('admin_code', 'teacher_code', 'school_id', 'is_active')
ORDER BY column_name;

-- 3. Check if there are any users with codes
SELECT 
    'Users with Codes' as check_name,
    role,
    COUNT(*) as total_users,
    COUNT(admin_code) as users_with_admin_code,
    COUNT(teacher_code) as users_with_teacher_code
FROM users 
GROUP BY role;

-- 4. Check school isolation
SELECT 
    'School Isolation Check' as check_name,
    s.name as school_name,
    COUNT(u.id) as total_users,
    COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN u.role = 'teacher' THEN 1 END) as teachers,
    COUNT(CASE WHEN u.role = 'student' THEN 1 END) as students
FROM schools s
LEFT JOIN users u ON s.id = u.school_id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 5. Check for any orphaned records (users without school_id)
SELECT 
    'Orphaned Records Check' as check_name,
    COUNT(*) as users_without_school
FROM users 
WHERE school_id IS NULL;

-- 6. Verify code uniqueness
SELECT 
    'Code Uniqueness Check' as check_name,
    'admin_code' as code_type,
    COUNT(*) as total_codes,
    COUNT(DISTINCT admin_code) as unique_codes
FROM users 
WHERE admin_code IS NOT NULL
UNION ALL
SELECT 
    'Code Uniqueness Check' as check_name,
    'teacher_code' as code_type,
    COUNT(*) as total_codes,
    COUNT(DISTINCT teacher_code) as unique_codes
FROM users 
WHERE teacher_code IS NOT NULL;

-- 7. Check if indexes exist
SELECT 
    'Index Check' as check_name,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN ('users', 'schools')
AND indexname LIKE '%admin_code%' OR indexname LIKE '%teacher_code%' OR indexname LIKE '%school_id%'
ORDER BY tablename, indexname;

-- 8. Sample data for testing
SELECT 
    'Sample Data for Testing' as check_name,
    u.full_name,
    u.role,
    u.email,
    CASE 
        WHEN u.role = 'admin' THEN u.admin_code
        WHEN u.role = 'teacher' THEN u.teacher_code
        ELSE 'N/A'
    END as login_code,
    s.name as school_name
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
WHERE u.is_active = true
ORDER BY u.role, u.full_name
LIMIT 10;

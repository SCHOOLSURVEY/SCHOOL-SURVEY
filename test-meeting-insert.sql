-- Test if we can insert a meeting record
-- First, let's check if the required IDs exist

-- Check if the current user exists
SELECT id, full_name, role, school_id 
FROM users 
WHERE role IN ('teacher', 'admin') 
LIMIT 5;

-- Check if there are any students
SELECT id, full_name, role, school_id 
FROM users 
WHERE role = 'student' 
LIMIT 5;

-- Check if there are any surveys
SELECT id, title, school_id 
FROM surveys 
LIMIT 5;

-- Check if there are any schools
SELECT id, name, slug 
FROM schools 
LIMIT 5;

-- Try a test insert (replace with actual IDs from above queries)
-- INSERT INTO scheduled_meetings (
--     school_id,
--     teacher_id,
--     student_id,
--     survey_id,
--     title,
--     description,
--     meeting_type,
--     status
-- ) VALUES (
--     'YOUR_SCHOOL_ID_HERE',
--     'YOUR_TEACHER_ID_HERE', 
--     'YOUR_STUDENT_ID_HERE',
--     'YOUR_SURVEY_ID_HERE',
--     'Test Meeting',
--     'Test description',
--     'one_on_one',
--     'scheduled'
-- );

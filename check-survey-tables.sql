-- Check if survey-related tables exist and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('surveys', 'survey_questions', 'survey_responses')
ORDER BY table_name, ordinal_position;

-- Check if there are any survey responses in the database
SELECT COUNT(*) as total_responses FROM survey_responses;

-- Check if there are any surveys
SELECT COUNT(*) as total_surveys FROM surveys;

-- Check if there are any survey questions
SELECT COUNT(*) as total_questions FROM survey_questions;

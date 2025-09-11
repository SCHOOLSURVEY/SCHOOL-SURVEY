-- Check all surveys and their response counts
SELECT 
    s.id,
    s.title,
    s.survey_type,
    s.status,
    s.created_at,
    c.name as course_name,
    c.class_number,
    COUNT(sr.id) as response_count
FROM surveys s
LEFT JOIN courses c ON s.course_id = c.id
LEFT JOIN survey_responses sr ON s.id = sr.survey_id
GROUP BY s.id, s.title, s.survey_type, s.status, s.created_at, c.name, c.class_number
ORDER BY s.created_at DESC;

-- Check survey questions for each survey
SELECT 
    s.title as survey_title,
    s.survey_type,
    sq.question_text,
    sq.question_type,
    sq.order_number
FROM surveys s
JOIN survey_questions sq ON s.id = sq.survey_id
ORDER BY s.title, sq.order_number;

-- Check if there are any survey responses
SELECT 
    sr.id,
    sr.survey_id,
    s.title as survey_title,
    u.full_name as student_name,
    u.unique_id as student_id,
    sq.question_text,
    sr.response_value,
    sr.submitted_at
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
JOIN users u ON sr.student_id = u.id
JOIN survey_questions sq ON sr.question_id = sq.id
ORDER BY s.title, u.full_name, sq.order_number;

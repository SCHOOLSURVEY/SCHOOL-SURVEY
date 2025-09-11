-- Check if scheduled_meetings table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('scheduled_meetings', 'feedback_messages');

-- If tables don't exist, create them
CREATE TABLE IF NOT EXISTS scheduled_meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) DEFAULT 'one_on_one',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own meetings" ON scheduled_meetings;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback_messages;
DROP POLICY IF EXISTS "Teachers can create meetings" ON scheduled_meetings;
DROP POLICY IF EXISTS "Teachers can create feedback" ON feedback_messages;

-- Create new policies
CREATE POLICY "Users can view their own meetings" ON scheduled_meetings
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own feedback" ON feedback_messages
    FOR SELECT USING (true);

CREATE POLICY "Teachers can create meetings" ON scheduled_meetings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers can create feedback" ON feedback_messages
    FOR INSERT WITH CHECK (true);

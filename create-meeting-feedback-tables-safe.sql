-- Create tables for scheduled meetings and feedback messages (safe version)

-- Table for scheduled meetings
CREATE TABLE IF NOT EXISTS scheduled_meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
    meeting_type VARCHAR(50) DEFAULT 'one_on_one',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for feedback messages
CREATE TABLE IF NOT EXISTS feedback_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
    message_type VARCHAR(50) DEFAULT 'feedback',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own meetings" ON scheduled_meetings;
DROP POLICY IF EXISTS "Teachers can create meetings" ON scheduled_meetings;
DROP POLICY IF EXISTS "Teachers can update their meetings" ON scheduled_meetings;

DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback_messages;
DROP POLICY IF EXISTS "Teachers can create feedback" ON feedback_messages;
DROP POLICY IF EXISTS "Students can mark feedback as read" ON feedback_messages;

-- Create RLS policies for meetings
CREATE POLICY "Users can view their own meetings" ON scheduled_meetings
    FOR SELECT USING (
        auth.uid() = teacher_id OR 
        auth.uid() = student_id
    );

CREATE POLICY "Teachers can create meetings" ON scheduled_meetings
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id AND
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Teachers can update their meetings" ON scheduled_meetings
    FOR UPDATE USING (
        auth.uid() = teacher_id
    );

-- Create RLS policies for feedback messages
CREATE POLICY "Users can view their own feedback" ON feedback_messages
    FOR SELECT USING (
        auth.uid() = teacher_id OR 
        auth.uid() = student_id
    );

CREATE POLICY "Teachers can create feedback" ON feedback_messages
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id AND
        school_id IN (
            SELECT school_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Students can mark feedback as read" ON feedback_messages
    FOR UPDATE USING (
        auth.uid() = student_id
    );


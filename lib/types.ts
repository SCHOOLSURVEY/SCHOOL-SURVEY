// Multi-tenant School Management System Types

export interface School {
  id: string
  name: string
  slug: string
  abbreviation?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  settings?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  school_id: string
  unique_id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "student" | "parent"
  class_number?: string
  created_at: string
  updated_at: string
  admin_code?: string
  teacher_code?: string
  email_verified?: boolean
  parent_email?: string
  parent_phone?: string
  verification_token?: string
  is_active: boolean
  school?: School
}

export interface Subject {
  id: string
  school_id: string
  name: string
  code: string
  description?: string
  created_at: string
  school?: School
}

export interface Course {
  id: string
  school_id: string
  subject_id: string
  teacher_id: string
  name: string
  class_number: string
  term: string
  created_at: string
  updated_at: string
  subject?: Subject
  teacher?: User
  school?: School
}

export interface Survey {
  id: string
  school_id: string
  title: string
  description?: string
  course_id: string
  survey_type: "weekly" | "term" | "semester"
  status: "draft" | "active" | "closed"
  created_at: string
  closes_at?: string
  course?: Course
  school?: School
}

export interface SurveyQuestion {
  id: string
  school_id: string
  survey_id: string
  question_text: string
  question_type: "rating" | "multiple_choice" | "text"
  options?: any
  order_number: number
  created_at: string
  school?: School
}

export interface SurveyResponse {
  id: string
  school_id: string
  survey_id: string
  student_id: string
  question_id: string
  response_value: string
  submitted_at: string
  school?: School
  student?: User
  question?: SurveyQuestion
}

// Enhanced features with multi-tenancy
export interface Assignment {
  id: string
  school_id: string
  course_id: string
  title: string
  description?: string
  assignment_type: string
  points_possible: number
  due_date?: string
  created_at: string
  updated_at: string
  is_published: boolean
  course?: Course
  school?: School
}

export interface Submission {
  id: string
  school_id: string
  assignment_id: string
  student_id: string
  content?: string
  attachments?: Array<{
    name: string
    url: string
    size: number
    type: string
  }>
  submitted_at: string
  status: string
  student?: User
  users?: User
  assignment?: Assignment
  school?: School
}

export interface Grade {
  id: string
  school_id: string
  assignment_id: string
  student_id: string
  points_earned?: number
  letter_grade?: string
  comments?: string
  graded_at: string
  graded_by?: string
  assignment?: Assignment
  student?: User
  grader?: User
  school?: School
}

export interface ParentStudentRelationship {
  id: string
  school_id: string
  parent_id: string
  student_id: string
  relationship_type: string
  is_primary: boolean
  created_at: string
  parent?: User
  student?: User
  school?: School
}

export interface Notification {
  id: string
  school_id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  action_url?: string
  created_at: string
  expires_at?: string
  school?: School
}

export interface Attendance {
  id: string
  school_id: string
  student_id: string
  course_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  recorded_by?: string
  created_at: string
  student?: User
  course?: Course
  recorder?: User
  school?: School
}

export interface Message {
  id: string
  school_id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: "direct" | "announcement" | "course"
  course_id?: string
  is_read: boolean
  created_at: string
  sender?: User
  recipient?: User
  course?: Course
  school?: School
}

export interface CalendarEvent {
  id: string
  school_id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  event_type: "assignment_due" | "exam" | "holiday" | "meeting" | "announcement" | "custom"
  course_id?: string
  created_by: string
  created_at: string
  course?: Course
  created_by_user?: User
  school?: School
}

// Course Enrollment (already defined above, but keeping for reference)
export interface CourseEnrollment {
  id: string
  school_id: string
  student_id: string
  course_id: string
  enrolled_at: string
  status: "active" | "dropped" | "completed"
  course?: Course
  student?: User
  school?: School
}

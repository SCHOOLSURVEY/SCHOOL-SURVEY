export interface User {
  id: string
  unique_id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "student" | "parent"
  class_number?: string
  created_at: string
  updated_at: string
  admin_code?: string;
  email_verified?: boolean;
  parent_email?: string;
  parent_phone?: string;
  verification_token?: string;
}

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  created_at: string
}

export interface Course {
  id: string
  subject_id: string
  teacher_id: string
  name: string
  class_number: string
  term: string
  created_at: string
  subject?: Subject
  teacher?: User
}

export interface Survey {
  id: string
  title: string
  description?: string
  course_id: string
  survey_type: "weekly" | "term" | "semester"
  status: "active" | "closed"
  created_at: string
  closes_at?: string
  course?: Course
}

export interface SurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: "rating" | "multiple_choice" | "text"
  options?: any
  order_number: number
}

export interface SurveyResponse {
  id: string
  survey_id: string
  student_id: string
  question_id: string
  response_value: string
  submitted_at: string
}

// New types for enhanced features
export interface Assignment {
  id: string
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
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  content?: string
  file_url?: string
  submitted_at: string
  status: string
  student?: User
  assignment?: Assignment
}

export interface Grade {
  id: string
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
}

export interface ParentStudentRelationship {
  id: string
  parent_id: string
  student_id: string
  relationship_type: string
  is_primary: boolean
  created_at: string
  parent?: User
  student?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  action_url?: string
  created_at: string
  expires_at?: string
}

export interface Attendance {
  id: string
  student_id: string
  course_id: string
  date: string
  status: string
  notes?: string
  recorded_by?: string
  created_at: string
  student?: User
  course?: Course
  recorder?: User
}

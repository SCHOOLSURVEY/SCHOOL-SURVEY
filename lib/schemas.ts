import mongoose, { Schema, Document } from 'mongoose'

// School Schema
export interface ISchool extends Document {
  _id: string
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
  created_at: Date
  updated_at: Date
}

const SchoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  abbreviation: String,
  description: String,
  address: String,
  phone: String,
  email: String,
  website: String,
  logo_url: String,
  settings: Schema.Types.Mixed,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// User Schema
export interface IUser extends Document {
  _id: string
  school_id: string
  unique_id: string
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'student' | 'parent'
  class_number?: string
  created_at: Date
  updated_at: Date
  admin_code?: string
  teacher_code?: string
  email_verified?: boolean
  parent_email?: string
  parent_phone?: string
  verification_token?: string
  is_active: boolean
  password_hash?: string
  school?: ISchool
}

const UserSchema = new Schema<IUser>({
  school_id: { type: String, required: true, ref: 'School' },
  unique_id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], required: true },
  class_number: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  admin_code: String,
  teacher_code: String,
  email_verified: { type: Boolean, default: false },
  parent_email: String,
  parent_phone: String,
  verification_token: String,
  is_active: { type: Boolean, default: true },
  password_hash: String
})

// Subject Schema
export interface ISubject extends Document {
  _id: string
  school_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const SubjectSchema = new Schema<ISubject>({
  school_id: { type: String, required: true, ref: 'School' },
  name: { type: String, required: true },
  description: String,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Course Schema
export interface ICourse extends Document {
  _id: string
  school_id: string
  subject_id: string
  teacher_id: string
  name: string
  class_number: string
  term: string
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
  subject?: ISubject
  teacher?: IUser
}

const CourseSchema = new Schema<ICourse>({
  school_id: { type: String, required: true, ref: 'School' },
  subject_id: { type: String, required: true, ref: 'Subject' },
  teacher_id: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  class_number: { type: String, required: true },
  term: { type: String, required: true },
  description: String,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Course Enrollment Schema
export interface ICourseEnrollment extends Document {
  _id: string
  school_id: string
  course_id: string
  student_id: string
  enrolled_at: Date
  is_active: boolean
  course?: ICourse
  student?: IUser
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>({
  school_id: { type: String, required: true, ref: 'School' },
  course_id: { type: String, required: true, ref: 'Course' },
  student_id: { type: String, required: true, ref: 'User' },
  enrolled_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
})

// Assignment Schema
export interface IAssignment extends Document {
  _id: string
  school_id: string
  course_id: string
  title: string
  description?: string
  assignment_type: string
  points_possible: number
  due_date: Date
  is_published: boolean
  created_at: Date
  updated_at: Date
  course?: ICourse
}

const AssignmentSchema = new Schema<IAssignment>({
  school_id: { type: String, required: true, ref: 'School' },
  course_id: { type: String, required: true, ref: 'Course' },
  title: { type: String, required: true },
  description: String,
  assignment_type: { type: String, required: true },
  points_possible: { type: Number, required: true },
  due_date: { type: Date, required: true },
  is_published: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Submission Schema
export interface ISubmission extends Document {
  _id: string
  school_id: string
  assignment_id: string
  student_id: string
  content?: string
  file_url?: string
  submitted_at: Date
  is_late: boolean
  assignment?: IAssignment
  student?: IUser
}

const SubmissionSchema = new Schema<ISubmission>({
  school_id: { type: String, required: true, ref: 'School' },
  assignment_id: { type: String, required: true, ref: 'Assignment' },
  student_id: { type: String, required: true, ref: 'User' },
  content: String,
  file_url: String,
  submitted_at: { type: Date, default: Date.now },
  is_late: { type: Boolean, default: false }
})

// Grade Schema
export interface IGrade extends Document {
  _id: string
  school_id: string
  assignment_id: string
  student_id: string
  points_earned: number
  letter_grade: string
  feedback?: string
  graded_at: Date
  assignment?: IAssignment
  student?: IUser
}

const GradeSchema = new Schema<IGrade>({
  school_id: { type: String, required: true, ref: 'School' },
  assignment_id: { type: String, required: true, ref: 'Assignment' },
  student_id: { type: String, required: true, ref: 'User' },
  points_earned: { type: Number, required: true },
  letter_grade: { type: String, required: true },
  feedback: String,
  graded_at: { type: Date, default: Date.now }
})

// Survey Schema
export interface ISurvey extends Document {
  _id: string
  school_id: string
  course_id: string
  title: string
  description?: string
  survey_type: 'weekly' | 'term' | 'semester'
  status: 'draft' | 'active' | 'closed'
  opens_at: Date
  closes_at: Date
  created_at: Date
  updated_at: Date
  course?: ICourse
}

const SurveySchema = new Schema<ISurvey>({
  school_id: { type: String, required: true, ref: 'School' },
  course_id: { type: String, required: true, ref: 'Course' },
  title: { type: String, required: true },
  description: String,
  survey_type: { type: String, enum: ['weekly', 'term', 'semester'], required: true },
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
  opens_at: { type: Date, required: true },
  closes_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Survey Question Schema
export interface ISurveyQuestion extends Document {
  _id: string
  school_id: string
  survey_id: string
  question_text: string
  question_type: 'rating' | 'multiple_choice' | 'text'
  options?: string[]
  is_required: boolean
  order: number
  survey?: ISurvey
}

const SurveyQuestionSchema = new Schema<ISurveyQuestion>({
  school_id: { type: String, required: true, ref: 'School' },
  survey_id: { type: String, required: true, ref: 'Survey' },
  question_text: { type: String, required: true },
  question_type: { type: String, enum: ['rating', 'multiple_choice', 'text'], required: true },
  options: [String],
  is_required: { type: Boolean, default: true },
  order: { type: Number, required: true }
})

// Survey Response Schema
export interface ISurveyResponse extends Document {
  _id: string
  school_id: string
  survey_id: string
  question_id: string
  student_id: string
  response_value: string
  submitted_at: Date
  survey?: ISurvey
  question?: ISurveyQuestion
  student?: IUser
}

const SurveyResponseSchema = new Schema<ISurveyResponse>({
  school_id: { type: String, required: true, ref: 'School' },
  survey_id: { type: String, required: true, ref: 'Survey' },
  question_id: { type: String, required: true, ref: 'SurveyQuestion' },
  student_id: { type: String, required: true, ref: 'User' },
  response_value: { type: String, required: true },
  submitted_at: { type: Date, default: Date.now }
})

// Notification Schema
export interface INotification extends Document {
  _id: string
  school_id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: Date
  user?: IUser
}

const NotificationSchema = new Schema<INotification>({
  school_id: { type: String, required: true, ref: 'School' },
  user_id: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
})

// Attendance Schema
export interface IAttendance extends Document {
  _id: string
  school_id: string
  course_id: string
  student_id: string
  date: Date
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  course?: ICourse
  student?: IUser
}

const AttendanceSchema = new Schema<IAttendance>({
  school_id: { type: String, required: true, ref: 'School' },
  course_id: { type: String, required: true, ref: 'Course' },
  student_id: { type: String, required: true, ref: 'User' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
  notes: String
})

// Scheduled Meeting Schema
export interface IScheduledMeeting extends Document {
  _id: string
  school_id: string
  teacher_id: string
  student_id: string
  survey_id?: string
  meeting_type: string
  title: string
  description?: string
  scheduled_date: Date
  status: 'scheduled' | 'completed' | 'cancelled'
  meeting_link?: string
  notes?: string
  created_at: Date
  updated_at: Date
  teacher?: IUser
  student?: IUser
  survey?: ISurvey
}

const ScheduledMeetingSchema = new Schema<IScheduledMeeting>({
  school_id: { type: String, required: true, ref: 'School' },
  teacher_id: { type: String, required: true, ref: 'User' },
  student_id: { type: String, required: true, ref: 'User' },
  survey_id: { type: String, ref: 'Survey' },
  meeting_type: { type: String, default: 'one_on_one' },
  title: { type: String, required: true },
  description: String,
  scheduled_date: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  meeting_link: String,
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Feedback Message Schema
export interface IFeedbackMessage extends Document {
  _id: string
  school_id: string
  teacher_id: string
  student_id: string
  survey_id?: string
  message_type: string
  title: string
  message: string
  is_read: boolean
  created_at: Date
  updated_at: Date
  teacher?: IUser
  student?: IUser
  survey?: ISurvey
}

const FeedbackMessageSchema = new Schema<IFeedbackMessage>({
  school_id: { type: String, required: true, ref: 'School' },
  teacher_id: { type: String, required: true, ref: 'User' },
  student_id: { type: String, required: true, ref: 'User' },
  survey_id: { type: String, ref: 'Survey' },
  message_type: { type: String, default: 'feedback' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Term Schema
export interface ITerm extends Document {
  _id: string
  school_id: string
  academic_year_id: string
  name: string
  start_date: Date
  end_date: Date
  is_active: boolean
  created_at: Date
  updated_at: Date
  academic_year?: any
}

const TermSchema = new Schema<ITerm>({
  school_id: { type: String, required: true, ref: 'School' },
  academic_year_id: { type: String, required: true },
  name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Create and export models
export const School = mongoose.models.School || mongoose.model<ISchool>('School', SchoolSchema)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema)
export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema)
export const CourseEnrollment = mongoose.models.CourseEnrollment || mongoose.model<ICourseEnrollment>('CourseEnrollment', CourseEnrollmentSchema)
export const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema)
export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema)
export const Grade = mongoose.models.Grade || mongoose.model<IGrade>('Grade', GradeSchema)
export const Survey = mongoose.models.Survey || mongoose.model<ISurvey>('Survey', SurveySchema)
export const SurveyQuestion = mongoose.models.SurveyQuestion || mongoose.model<ISurveyQuestion>('SurveyQuestion', SurveyQuestionSchema)
export const SurveyResponse = mongoose.models.SurveyResponse || mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema)
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema)
export const ScheduledMeeting = mongoose.models.ScheduledMeeting || mongoose.model<IScheduledMeeting>('ScheduledMeeting', ScheduledMeetingSchema)
export const FeedbackMessage = mongoose.models.FeedbackMessage || mongoose.model<IFeedbackMessage>('FeedbackMessage', FeedbackMessageSchema)
export const Term = mongoose.models.Term || mongoose.model<ITerm>('Term', TermSchema)


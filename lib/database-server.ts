import mongoose from 'mongoose'
import { 
  School, User, Subject, Course, CourseEnrollment, Assignment, 
  Submission, Grade, Survey, SurveyQuestion, SurveyResponse, 
  Notification, Attendance, ScheduledMeeting, FeedbackMessage, Term,
  ISchool, IUser, ISubject, ICourse, ICourseEnrollment, IAssignment,
  ISubmission, IGrade, ISurvey, ISurveyQuestion, ISurveyResponse,
  INotification, IAttendance, IScheduledMeeting, IFeedbackMessage, ITerm
} from './schemas'

// Connect to MongoDB
export async function connectToDatabase() {
  if (mongoose.connections[0].readyState) {
    return
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolsurvey'
  
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Database service class - Server-side only
export class DatabaseService {
  // School operations
  static async createSchool(schoolData: Partial<ISchool>) {
    await connectToDatabase()
    return await School.create(schoolData)
  }

  static async getSchoolBySlug(slug: string) {
    await connectToDatabase()
    return await School.findOne({ slug, is_active: true })
  }

  static async getAllSchools() {
    await connectToDatabase()
    return await School.find({ is_active: true })
  }

  // User operations
  static async createUser(userData: Partial<IUser>) {
    await connectToDatabase()
    return await User.create(userData)
  }

  static async updateUser(userId: string, updateData: Partial<IUser>) {
    await connectToDatabase()
    return await User.findByIdAndUpdate(userId, updateData, { new: true })
  }

  static async getUserByEmail(email: string) {
    await connectToDatabase()
    return await User.findOne({ email, is_active: true }).populate('school')
  }

  static async getUserById(id: string) {
    await connectToDatabase()
    return await User.findById(id).populate('school')
  }

  static async getUsersBySchool(schoolId: string) {
    await connectToDatabase()
    return await User.find({ school_id: schoolId, is_active: true })
  }

  static async getUsersByRole(schoolId: string, role: string) {
    await connectToDatabase()
    return await User.find({ school_id: schoolId, role, is_active: true })
  }

  // Subject operations
  static async createSubject(subjectData: Partial<ISubject>) {
    await connectToDatabase()
    return await Subject.create(subjectData)
  }

  static async getSubjectsBySchool(schoolId: string) {
    await connectToDatabase()
    return await Subject.find({ school_id: schoolId, is_active: true })
  }

  // Course operations
  static async createCourse(courseData: Partial<ICourse>) {
    await connectToDatabase()
    return await Course.create(courseData)
  }

  static async getCoursesBySchool(schoolId: string) {
    await connectToDatabase()
    return await Course.find({ school_id: schoolId, is_active: true })
      .populate('subject')
      .populate('teacher')
  }

  static async getCoursesByTeacher(teacherId: string) {
    await connectToDatabase()
    return await Course.find({ teacher_id: teacherId, is_active: true })
      .populate('subject')
      .populate('teacher')
  }

  static async getCoursesBySchool(schoolId: string) {
    await connectToDatabase()
    return await Course.find({ school_id: schoolId, is_active: true })
      .populate('subject')
      .populate('teacher')
  }

  static async getTermsBySchool(schoolId: string) {
    await connectToDatabase()
    return await Term.find({ school_id: schoolId, is_active: true })
  }

  static async createCourse(courseData: any) {
    await connectToDatabase()
    return await Course.create(courseData)
  }

  static async createTerm(termData: any) {
    await connectToDatabase()
    return await Term.create(termData)
  }

  static async deleteCourse(courseId: string) {
    await connectToDatabase()
    return await Course.findByIdAndDelete(courseId)
  }

  static async getAllUsers(schoolId: string) {
    await connectToDatabase()
    return await User.find({ school_id: schoolId, is_active: true })
      .sort({ created_at: -1 })
  }

  static async deleteUser(userId: string) {
    await connectToDatabase()
    return await User.findByIdAndDelete(userId)
  }

  static async getAllCourseEnrollments(schoolId: string) {
    await connectToDatabase()
    return await CourseEnrollment.find({ school_id: schoolId })
      .populate('student')
      .populate('course')
      .sort({ enrolled_at: -1 })
  }

  static async getCourseById(courseId: string) {
    await connectToDatabase()
    return await Course.findById(courseId)
  }

  static async createCourseEnrollment(enrollmentData: any) {
    await connectToDatabase()
    return await CourseEnrollment.create(enrollmentData)
  }

  static async updateCourseEnrollment(enrollmentId: string, updateData: any) {
    await connectToDatabase()
    return await CourseEnrollment.findByIdAndUpdate(enrollmentId, updateData, { new: true })
  }

  static async deleteCourseEnrollment(enrollmentId: string) {
    await connectToDatabase()
    return await CourseEnrollment.findByIdAndDelete(enrollmentId)
  }

  // Survey operations
  static async getSurveysBySchool(schoolId: string) {
    await connectToDatabase()
    return await Survey.find({ school_id: schoolId, is_active: true })
      .populate('course')
      .sort({ created_at: -1 })
  }

  static async createSurvey(surveyData: any) {
    await connectToDatabase()
    return await Survey.create(surveyData)
  }

  static async createSurveyQuestions(questionsData: any[]) {
    await connectToDatabase()
    return await SurveyQuestion.insertMany(questionsData)
  }

  static async getSurveyQuestions(surveyId: string) {
    await connectToDatabase()
    return await SurveyQuestion.find({ survey_id: surveyId })
      .sort({ order_number: 1 })
  }

  static async updateSurvey(surveyId: string, updateData: any) {
    await connectToDatabase()
    return await Survey.findByIdAndUpdate(surveyId, updateData, { new: true })
  }

  static async deleteSurvey(surveyId: string) {
    await connectToDatabase()
    return await Survey.findByIdAndDelete(surveyId)
  }

  static async deleteSurveyQuestion(questionId: string) {
    await connectToDatabase()
    return await SurveyQuestion.findByIdAndDelete(questionId)
  }

  static async getSurveyResponsesBySchool(schoolId: string) {
    await connectToDatabase()
    return await SurveyResponse.find({ school_id: schoolId })
      .populate('survey')
      .populate('question')
      .sort({ created_at: -1 })
  }

  // Course Enrollment operations
  static async enrollStudent(courseId: string, studentId: string, schoolId: string) {
    await connectToDatabase()
    return await CourseEnrollment.create({
      course_id: courseId,
      student_id: studentId,
      school_id: schoolId
    })
  }

  static async getStudentCourses(studentId: string) {
    await connectToDatabase()
    return await CourseEnrollment.find({ student_id: studentId, is_active: true })
      .populate('course')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          model: 'Subject'
        }
      })
      .populate({
        path: 'course',
        populate: {
          path: 'teacher',
          model: 'User'
        }
      })
  }

  // Assignment operations
  static async createAssignment(assignmentData: Partial<IAssignment>) {
    await connectToDatabase()
    return await Assignment.create(assignmentData)
  }

  static async getAssignmentsByCourse(courseId: string) {
    await connectToDatabase()
    return await Assignment.find({ course_id: courseId })
      .populate('course')
  }

  // Survey operations
  static async createSurvey(surveyData: Partial<ISurvey>) {
    await connectToDatabase()
    return await Survey.create(surveyData)
  }

  static async getSurveysByCourse(courseId: string) {
    await connectToDatabase()
    return await Survey.find({ course_id: courseId })
      .populate('course')
  }

  static async getActiveSurveysByCourses(courseIds: string[]) {
    await connectToDatabase()
    return await Survey.find({ 
      course_id: { $in: courseIds },
      status: 'active',
      closes_at: { $gte: new Date() }
    }).populate('course')
  }

  // Survey Question operations
  static async createSurveyQuestion(questionData: Partial<ISurveyQuestion>) {
    await connectToDatabase()
    return await SurveyQuestion.create(questionData)
  }

  static async getSurveyQuestions(surveyId: string) {
    await connectToDatabase()
    return await SurveyQuestion.find({ survey_id: surveyId }).sort({ order: 1 })
  }

  // Survey Response operations
  static async createSurveyResponse(responseData: Partial<ISurveyResponse>) {
    await connectToDatabase()
    return await SurveyResponse.create(responseData)
  }

  static async getSurveyResponses(surveyId: string, studentId: string) {
    await connectToDatabase()
    return await SurveyResponse.find({ survey_id: surveyId, student_id: studentId })
      .populate('question')
  }

  static async getSurveyResponsesBySurvey(surveyId: string) {
    await connectToDatabase()
    return await SurveyResponse.find({ survey_id: surveyId })
      .populate('question')
      .populate('student')
  }

  // Grade operations
  static async createGrade(gradeData: Partial<IGrade>) {
    await connectToDatabase()
    return await Grade.create(gradeData)
  }

  static async getGradesByStudent(studentId: string) {
    await connectToDatabase()
    return await Grade.find({ student_id: studentId })
      .populate('assignment')
      .populate({
        path: 'assignment',
        populate: {
          path: 'course',
          model: 'Course'
        }
      })
  }

  // Notification operations
  static async createNotification(notificationData: Partial<INotification>) {
    await connectToDatabase()
    return await Notification.create(notificationData)
  }

  static async getNotificationsByUser(userId: string) {
    await connectToDatabase()
    return await Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
  }

  // Attendance operations
  static async createAttendance(attendanceData: Partial<IAttendance>) {
    await connectToDatabase()
    return await Attendance.create(attendanceData)
  }

  static async getAttendanceByStudent(studentId: string) {
    await connectToDatabase()
    return await Attendance.find({ student_id: studentId })
      .populate('course')
  }

  // Meeting operations
  static async createMeeting(meetingData: Partial<IScheduledMeeting>) {
    await connectToDatabase()
    return await ScheduledMeeting.create(meetingData)
  }

  static async getMeetingsByTeacher(teacherId: string) {
    await connectToDatabase()
    return await ScheduledMeeting.find({ teacher_id: teacherId })
      .populate('student')
      .populate('survey')
  }

  // Feedback Message operations
  static async createFeedbackMessage(messageData: Partial<IFeedbackMessage>) {
    await connectToDatabase()
    return await FeedbackMessage.create(messageData)
  }

  static async getFeedbackMessagesByStudent(studentId: string) {
    await connectToDatabase()
    return await FeedbackMessage.find({ student_id: studentId })
      .populate('teacher')
      .populate('survey')
  }

  // Analytics operations
  static async getAnalyticsData(schoolId: string, startDate: Date, endDate: Date) {
    await connectToDatabase()
    
    const [gradesData, attendanceData, surveysData, assignmentsData, coursesData, usersData] = await Promise.all([
      Grade.find({ 
        school_id: schoolId,
        graded_at: { $gte: startDate, $lte: endDate }
      }).populate('assignment'),
      
      Attendance.find({ 
        school_id: schoolId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('course'),
      
      SurveyResponse.find({ 
        school_id: schoolId,
        submitted_at: { $gte: startDate, $lte: endDate }
      }).populate('survey').populate('question'),
      
      Assignment.find({ 
        school_id: schoolId,
        created_at: { $gte: startDate, $lte: endDate }
      }).populate('course'),
      
      Course.find({ school_id: schoolId, is_active: true }),
      
      User.find({ school_id: schoolId, is_active: true })
    ])

    return {
      gradesData,
      attendanceData,
      surveysData,
      assignmentsData,
      coursesData,
      usersData
    }
  }

  // Subject operations
  static async getSubjectsBySchool(schoolId: string) {
    await connectToDatabase()
    return await Subject.find({ school_id: schoolId, is_active: true })
  }

  static async createSubject(subjectData: any) {
    await connectToDatabase()
    return await Subject.create(subjectData)
  }

  static async updateSubject(subjectId: string, updateData: any) {
    await connectToDatabase()
    return await Subject.findByIdAndUpdate(subjectId, updateData, { new: true })
  }

  static async deleteSubject(subjectId: string) {
    await connectToDatabase()
    return await Subject.findByIdAndDelete(subjectId)
  }

  // Notification operations
  static async getNotificationsByUser(userId: string) {
    await connectToDatabase()
    return await Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
  }

  static async createNotification(notificationData: any) {
    await connectToDatabase()
    return await Notification.create(notificationData)
  }

  static async updateNotification(notificationId: string, updateData: any) {
    await connectToDatabase()
    return await Notification.findByIdAndUpdate(notificationId, updateData, { new: true })
  }
}

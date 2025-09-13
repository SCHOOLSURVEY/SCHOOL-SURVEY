// Client-side database service - No Mongoose, uses API calls only

export class DatabaseService {
  // School operations
  static async getAllSchools() {
    const response = await fetch('/api/mongodb/schools')
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.schools
  }

  static async createSchool(schoolData: any) {
    const response = await fetch('/api/mongodb/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.school
  }

  // User operations
  static async getUserByEmail(email: string) {
    const response = await fetch(`/api/mongodb/users?email=${email}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.user
  }

  static async getUsersBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/users?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.users
  }

  static async getUsersByRole(schoolId: string, role: string) {
    const response = await fetch(`/api/mongodb/users?schoolId=${schoolId}&role=${role}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.users
  }

  static async createUser(userData: any) {
    const response = await fetch('/api/mongodb/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.user
  }

  static async updateUser(userId: string, updateData: any) {
    const response = await fetch(`/api/mongodb/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.user
  }

  static async getAllUsers(schoolId: string) {
    const response = await fetch(`/api/mongodb/users?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.users
  }

  static async deleteUser(userId: string) {
    const response = await fetch(`/api/mongodb/users/${userId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.success
  }

  // Course Enrollment operations
  static async getAllCourseEnrollments(schoolId: string) {
    const response = await fetch(`/api/mongodb/course-enrollments?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.enrollments
  }

  static async getCourseById(courseId: string) {
    const response = await fetch(`/api/mongodb/courses/${courseId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.course
  }

  static async createCourseEnrollment(enrollmentData: any) {
    const response = await fetch('/api/mongodb/course-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollmentData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.enrollment
  }

  static async updateCourseEnrollment(enrollmentId: string, updateData: any) {
    const response = await fetch(`/api/mongodb/course-enrollments/${enrollmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.enrollment
  }

  static async deleteCourseEnrollment(enrollmentId: string) {
    const response = await fetch(`/api/mongodb/course-enrollments/${enrollmentId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.success
  }

  // Course operations
  static async getCoursesBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/courses?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.courses
  }

  static async getStudentCourses(studentId: string) {
    const response = await fetch(`/api/mongodb/courses/student/${studentId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.courses
  }

  // Survey operations
  static async getSurveysByCourse(courseId: string) {
    const response = await fetch(`/api/mongodb/surveys?courseId=${courseId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.surveys
  }

  static async getActiveSurveysByCourses(courseIds: string[]) {
    const response = await fetch('/api/mongodb/surveys/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseIds })
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.surveys
  }

  // Survey Response operations
  static async getSurveyResponses(surveyId: string, studentId: string) {
    const response = await fetch(`/api/mongodb/survey-responses?surveyId=${surveyId}&studentId=${studentId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.responses
  }

  static async createSurveyResponse(responseData: any) {
    const response = await fetch('/api/mongodb/survey-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.response
  }

  // Subject operations
  static async getSubjectsBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/subjects?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.subjects
  }

  // Course operations
  static async getCoursesBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/courses?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.courses
  }

  // Survey operations
  static async getSurveysBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/surveys?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.surveys
  }

  static async createSurvey(surveyData: any) {
    const response = await fetch('/api/mongodb/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.survey
  }

  static async createSurveyQuestions(questionsData: any[]) {
    const response = await fetch('/api/mongodb/survey-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: questionsData })
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.questions
  }

  static async getSurveyQuestions(surveyId: string) {
    const response = await fetch(`/api/mongodb/survey-questions?surveyId=${surveyId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.questions
  }

  static async updateSurvey(surveyId: string, updateData: any) {
    const response = await fetch(`/api/mongodb/surveys/${surveyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.survey
  }

  static async deleteSurvey(surveyId: string) {
    const response = await fetch(`/api/mongodb/surveys/${surveyId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.success
  }

  static async deleteSurveyQuestion(questionId: string) {
    const response = await fetch(`/api/mongodb/survey-questions/${questionId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.success
  }

  static async getSurveyResponsesBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/survey-responses?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.responses
  }

  static async deleteCourse(courseId: string) {
    const response = await fetch(`/api/mongodb/courses/${courseId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.success
  }

  // Term operations
  static async getTermsBySchool(schoolId: string) {
    const response = await fetch(`/api/mongodb/terms?schoolId=${schoolId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.terms
  }

  static async updateSubject(subjectId: string, updateData: any) {
    const response = await fetch(`/api/mongodb/subjects/${subjectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.subject
  }

  static async deleteSubject(subjectId: string) {
    const response = await fetch(`/api/mongodb/subjects/${subjectId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.success
  }

  // Notification operations
  static async getNotificationsByUser(userId: string) {
    const response = await fetch(`/api/mongodb/notifications?userId=${userId}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.notifications
  }

  static async updateNotification(notificationId: string, updateData: any) {
    const response = await fetch(`/api/mongodb/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.notification
  }
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedSurveyForm } from "@/components/student/enhanced-survey-form"
import { AttendanceView } from "@/components/student/attendance-view"
import { StudentAssignmentsList } from "@/components/student/assignments-list"
import { MeetingsFeedbackViewer } from "@/components/student/meetings-feedback-viewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Survey, User, School } from "@/lib/types"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, Clock, Users, RefreshCw, AlertCircle } from "lucide-react"

export default function SchoolSpecificStudentDashboard() {
  const params = useParams()
  const schoolSlug = params.school as string
  const [school, setSchool] = useState<School | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchSchoolInfo()
    // Get current user from localStorage
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      fetchStudentData(user.id)
    } else {
      // If no user data, stop loading after a timeout
      setTimeout(() => {
        setLoading(false)
      }, 5000)
    }
  }, [schoolSlug])

  const fetchSchoolInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug, abbreviation, primary_color, secondary_color, logo_url")
        .eq("slug", schoolSlug)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setSchool(data)
    } catch (error) {
      console.error("Error fetching school info:", error)
    }
  }

  const fetchStudentData = async (studentId: string, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("Student data fetch timed out")
      setLoading(false)
      setRefreshing(false)
    }, 10000) // 10 second timeout

    try {
      console.log("Fetching data for student:", studentId)

      // Get current user's school_id for filtering
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        console.error("No current user data found")
        setLoading(false)
        setRefreshing(false)
        return
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id
      console.log("School ID:", schoolId)

      // First, get courses the student is enrolled in (with necessary joins)
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select(`
          course_id,
          courses!inner(
            id,
            name,
            class_number,
            term,
            subjects!inner(name),
            users!inner(full_name)
          )
        `)
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError)
        throw enrollmentError
      }

      console.log("Enrollments found:", enrollments)
      setEnrolledCourses(enrollments || [])

      const courseIds = enrollments?.map((e) => e.course_id) || []
      console.log("Course IDs:", courseIds)

      if (courseIds.length === 0) {
        console.log("No course enrollments found")
        setAvailableSurveys([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Get active surveys for these courses (with course details)
      const { data: surveys, error: surveyError } = await supabase
        .from("surveys")
        .select(`
          *,
          courses!inner(
            name,
            class_number,
            subjects!inner(name),
            users!inner(full_name)
          )
        `)
        .in("course_id", courseIds)
        .eq("status", "active")
        .eq("school_id", schoolId)

      if (surveyError) {
        console.error("Survey error:", surveyError)
        throw surveyError
      }

      console.log("Active surveys found:", surveys)

      // Get surveys already completed by this student (filtered by school)
      const { data: responses, error: responseError } = await supabase
        .from("survey_responses")
        .select("survey_id")
        .eq("student_id", studentId)
        .eq("school_id", schoolId) // Filter by current school

      if (responseError) {
        console.error("Response error:", responseError)
        throw responseError
      }

      console.log("Completed responses:", responses)

      const completedSurveyIds = [...new Set(responses?.map((r) => r.survey_id))] || []
      const pendingSurveys = surveys?.filter((s) => !completedSurveyIds.includes(s.id)) || []

      console.log("Pending surveys:", pendingSurveys)
      setAvailableSurveys(pendingSurveys)
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSurveyComplete = () => {
    setSelectedSurvey(null)
    if (currentUser) {
      fetchStudentData(currentUser.id, true)
    }
  }

  const handleRefresh = () => {
    if (currentUser) {
      fetchStudentData(currentUser.id, true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h1>
          <p className="text-gray-600">The school you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please log in to access the student dashboard.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (selectedSurvey) {
    return <EnhancedSurveyForm survey={selectedSurvey} studentId={currentUser.id} onComplete={handleSurveyComplete} />
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome to {school.name}</h1>
            <p className="text-muted-foreground">Student Dashboard - {currentUser.full_name}</p>
            <p className="text-sm text-muted-foreground">
              ID: {currentUser.unique_id} | Class: {currentUser.class_number}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Course Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>My Courses</span>
              </CardTitle>
              <CardDescription>Courses you are enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    You are not enrolled in any courses yet.
                    <br />
                    Contact your administrator to get enrolled.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((enrollment) => (
                    <div key={enrollment.course_id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{enrollment.courses?.name || 'Course Name Not Available'}</h4>
                      <p className="text-sm text-muted-foreground">
                        Class {enrollment.courses?.class_number || 'N/A'} • {enrollment.courses?.subjects?.name || 'Subject Not Available'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Teacher: {enrollment.courses?.users?.full_name || 'Teacher Not Available'} • Term: {enrollment.courses?.term || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Surveys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Available Surveys ({availableSurveys.length})</span>
              </CardTitle>
              <CardDescription>Complete these surveys to help improve your learning experience</CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                  <p className="text-muted-foreground">
                    You need to be enrolled in courses to see surveys.
                    <br />
                    Contact your administrator for course enrollment.
                  </p>
                </div>
              ) : availableSurveys.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No surveys available at this time.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back later or contact your teachers for more information.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for new surveys
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableSurveys.map((survey) => (
                    <Card
                      key={survey.id}
                      className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 hover:border-l-blue-600"
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{survey.title}</CardTitle>
                            <CardDescription className="mt-1">{survey.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {survey.survey_type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Course: {survey.courses?.name}</span>
                          <span>•</span>
                          <span>Class: {survey.courses?.class_number}</span>
                          <span>•</span>
                          <span>Teacher: {survey.courses?.users?.full_name}</span>
                          {survey.closes_at && (
                            <>
                              <span>•</span>
                              <span>Closes: {new Date(survey.closes_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        <div className="pt-2">
                          <Button size="sm" className="w-full">
                            Start Survey
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance View */}
        <AttendanceView studentId={currentUser.id} />

        {/* Assignments */}
        <StudentAssignmentsList studentId={currentUser.id} />

        {/* Meetings & Feedback */}
        <MeetingsFeedbackViewer studentId={currentUser.id} />

        {/* Stats Card */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrolledCourses.length}</div>
              <p className="text-xs text-muted-foreground">Active course enrollments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Surveys</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableSurveys.length}</div>
              <p className="text-xs text-muted-foreground">Surveys waiting for your feedback</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {availableSurveys.filter((s) => s.survey_type === "weekly").length}
              </div>
              <p className="text-xs text-muted-foreground">Weekly surveys available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
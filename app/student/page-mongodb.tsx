"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedSurveyForm } from "@/components/student/enhanced-survey-form"
import { AttendanceView } from "@/components/student/attendance-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database-client"
import type { Survey, User } from "@/lib/types"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, Clock, Users, RefreshCw, AlertCircle } from "lucide-react"

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Get current user from localStorage (in a real app, use proper auth)
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      fetchStudentData(user.id)
    }
  }, [])

  const fetchStudentData = async (studentId: string, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)

    try {
      console.log("Fetching data for student:", studentId)

      // Get courses the student is enrolled in using MongoDB
      const enrollments = await DatabaseService.getStudentCourses(studentId)
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

      // Get active surveys for these courses using MongoDB
      const surveys = await DatabaseService.getActiveSurveysByCourses(courseIds)
      console.log("Active surveys found:", surveys)

      // Get surveys already completed by this student
      const completedSurveyIds = new Set()
      for (const survey of surveys) {
        const responses = await DatabaseService.getSurveyResponses(survey._id, studentId)
        if (responses && responses.length > 0) {
          completedSurveyIds.add(survey._id)
        }
      }

      // Filter out completed surveys
      const availableSurveys = surveys.filter(survey => !completedSurveyIds.has(survey._id))
      console.log("Available surveys:", availableSurveys)

      setAvailableSurveys(availableSurveys)
      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error("Error fetching student data:", error)
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSurveyComplete = () => {
    if (currentUser) {
      fetchStudentData(currentUser.id, true)
    }
    setSelectedSurvey(null)
  }

  const handleRefresh = () => {
    if (currentUser) {
      fetchStudentData(currentUser.id, true)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-green mx-auto mb-4"></div>
            <p className="text-almost-black">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-almost-black mb-2">Access Denied</h2>
            <p className="text-almost-black/70">Please log in to access your dashboard.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-almost-black">
              SchoolSurvey Student Dashboard
            </h1>
            <p className="text-almost-black/70">
              Welcome back, {currentUser.full_name}!
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-green hover:bg-emerald-green/90 text-white"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-almost-black">Available Surveys</CardTitle>
              <BookOpen className="h-4 w-4 text-emerald-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-almost-black">{availableSurveys.length}</div>
              <p className="text-xs text-almost-black/70">
                Surveys ready for completion
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-almost-black">Enrolled Courses</CardTitle>
              <Users className="h-4 w-4 text-royal-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-almost-black">{enrolledCourses.length}</div>
              <p className="text-xs text-almost-black/70">
                Active course enrollments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-almost-black">Class</CardTitle>
              <Clock className="h-4 w-4 text-vibrant-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-almost-black">{currentUser.class_number || "N/A"}</div>
              <p className="text-xs text-almost-black/70">
                Current class number
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Available Surveys */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-almost-black">Available Surveys</CardTitle>
            <CardDescription className="text-almost-black/70">
              Complete these surveys to provide feedback on your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableSurveys.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-almost-black/70">No surveys available at the moment.</p>
                <p className="text-sm text-almost-black/50 mt-2">
                  Check back later or contact your teacher for more information.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableSurveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-almost-black">{survey.title}</h3>
                      <p className="text-sm text-almost-black/70 mt-1">
                        {survey.course?.name} - {survey.course?.subject?.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {survey.survey_type}
                        </Badge>
                        <span className="text-xs text-almost-black/50">
                          Due: {new Date(survey.closes_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedSurvey(survey)}
                      className="bg-emerald-green hover:bg-emerald-green/90 text-white"
                    >
                      Take Survey
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance View */}
        <AttendanceView studentId={currentUser.id} />

        {/* Survey Form Modal */}
        {selectedSurvey && (
          <EnhancedSurveyForm
            survey={selectedSurvey}
            onComplete={handleSurveyComplete}
            onClose={() => setSelectedSurvey(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

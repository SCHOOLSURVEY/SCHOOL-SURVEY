"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { SurveyAnalytics } from "@/components/analytics/survey-analytics"
import { QuickSurveyCreator } from "@/components/teacher/quick-survey-creator"
import { Gradebook } from "@/components/teacher/gradebook"
import { AssignmentManager } from "@/components/teacher/assignment-manager"
import { AttendanceManager } from "@/components/teacher/attendance-manager"
import { TeacherCodeDisplay } from "@/components/teacher/teacher-code-display"
import { DatabaseService } from "@/lib/database-client"
import type { Course, User } from "@/lib/types"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, Users, FileText, BarChart3, Calendar } from "lucide-react"

export default function TeacherDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    pendingGrades: 0,
    activeSurveys: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Get current user from localStorage (in a real app, use proper auth)
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      fetchTeacherData(user.id)
    }
  }, [refreshKey])

  const fetchTeacherData = async (teacherId: string) => {
    try {
      // Fetch teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          subjects!inner(name, code),
          course_enrollments(count)
        `)
        .eq("teacher_id", teacherId)

      if (coursesError) throw coursesError

      // Calculate stats
      const courseIds = coursesData?.map((c) => c.id) || []

      // Get total enrolled students
      const { count: studentCount } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIds)

      // Get total assignments
      const { count: assignmentCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIds)

      // Get pending grades (assignments without grades)
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .in("course_id", courseIds)
        .eq("is_published", true)

      let pendingGrades = 0
      if (assignments) {
        for (const assignment of assignments) {
          const { count } = await supabase
            .from("grades")
            .select("*", { count: "exact", head: true })
            .eq("assignment_id", assignment.id)

          const { count: enrollmentCount } = await supabase
            .from("course_enrollments")
            .select("*", { count: "exact", head: true })
            .in("course_id", courseIds)

          pendingGrades += (enrollmentCount || 0) - (count || 0)
        }
      }

      // Get active surveys
      const { count: surveyCount } = await supabase
        .from("surveys")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIds)
        .eq("status", "active")

      setCourses(coursesData || [])
      setStats({
        totalStudents: studentCount || 0,
        totalAssignments: assignmentCount || 0,
        pendingGrades,
        activeSurveys: surveyCount || 0,
      })
    } catch (error) {
      console.error("Error fetching teacher data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSurveyCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    return <div>Please log in to access the teacher dashboard.</div>
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-almost-black">SchoolSurvey Teacher Dashboard</h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">Welcome, {currentUser.full_name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">ID: {currentUser.unique_id}</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Across all courses</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Assignments</CardTitle>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Created this term</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Grades</CardTitle>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.pendingGrades}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Need grading</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Surveys</CardTitle>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.activeSurveys}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Collecting feedback</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="account">My Account</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>Courses you are teaching this term</CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <p className="text-muted-foreground">
                      No courses assigned. Contact administration to get courses assigned.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div key={course.id} className="p-4 border rounded-lg">
                          <h3 className="font-medium">{course.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Class: {course.class_number} • Term: {course.term}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {course.subject?.name} ({course.subject?.code})
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {courses.length > 0 && (
                <QuickSurveyCreator teacherId={currentUser.id} onSurveyCreated={handleSurveyCreated} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentManager teacherId={currentUser.id} />
          </TabsContent>

          <TabsContent value="gradebook">
            <Gradebook teacherId={currentUser.id} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceManager teacherId={currentUser.id} />
          </TabsContent>

          <TabsContent value="surveys">
            <QuickSurveyCreator teacherId={currentUser.id} onSurveyCreated={handleSurveyCreated} />
          </TabsContent>

          <TabsContent value="analytics">
            <SurveyAnalytics />
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>Detailed information about your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {courses.map((course) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5" />
                          <span>{course.name}</span>
                        </CardTitle>
                        <CardDescription>
                          {course.subject?.name} • Class {course.class_number} • {course.term}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <h4 className="font-medium">Enrolled Students</h4>
                            <p className="text-2xl font-bold">{course.course_enrollments?.length || 0}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Subject Code</h4>
                            <p className="text-lg">{course.subject?.code}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Term</h4>
                            <p className="text-lg">{course.term}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              <TeacherCodeDisplay user={currentUser} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-lg font-semibold">{currentUser.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-lg">{currentUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">User ID</label>
                      <p className="text-lg font-mono">{currentUser.unique_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role</label>
                      <p className="text-lg capitalize">{currentUser.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

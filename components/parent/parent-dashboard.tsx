"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Mail,
  Phone,
} from "lucide-react"
import { Label } from "@/components/ui/label"

interface Student {
  id: string
  unique_id: string
  full_name: string
  class_number: string
  email: string
}

interface Course {
  id: string
  name: string
  class_number: string
  subjects: { name: string }
  users: { full_name: string }
}

interface Assignment {
  id: string
  title: string
  assignment_type: string
  points_possible: number
  due_date: string
  courses: { name: string }
}

interface Grade {
  id: string
  points_earned: number
  letter_grade: string
  assignments: { title: string; points_possible: number }
}

interface Survey {
  id: string
  title: string
  status: string
  closes_at: string
  courses: { name: string }
}

interface ParentDashboardProps {
  parentId: string
}

export function ParentDashboard({ parentId }: ParentDashboardProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string>("")

  useEffect(() => {
    fetchParentData()
  }, [parentId])

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData()
    }
  }, [selectedStudent])

  const fetchParentData = async () => {
    try {
      // Fetch students associated with this parent
      const { data: studentsData, error: studentsError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .or(`parent_email.eq.${parentId},parent_phone.eq.${parentId}`)

      if (studentsError) throw studentsError

      setStudents(studentsData || [])
      if (studentsData && studentsData.length > 0) {
        setSelectedStudent(studentsData[0].id)
      }
    } catch (error) {
      console.error("Error fetching parent data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentData = async () => {
    if (!selectedStudent) return

    try {
      // Fetch student's courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select(`
          course_id,
          courses!inner(
            id,
            name,
            class_number,
            subjects!inner(name),
            users!inner(full_name)
          )
        `)
        .eq("student_id", selectedStudent)

      if (enrollmentsError) throw enrollmentsError

      const coursesData = enrollmentsData?.map((e) => e.courses) || []
      setCourses(coursesData)

      // Fetch assignments for enrolled courses
      const courseIds = coursesData.map((c) => c.id)
      if (courseIds.length > 0) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("assignments")
          .select(`
            id,
            title,
            assignment_type,
            points_possible,
            due_date,
            courses!inner(name)
          `)
          .in("course_id", courseIds)
          .eq("is_published", true)
          .order("due_date")

        if (assignmentsError) throw assignmentsError
        setAssignments(assignmentsData || [])
      }

      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select(`
          id,
          points_earned,
          letter_grade,
          assignments!inner(title, points_possible)
        `)
        .eq("student_id", selectedStudent)

      if (gradesError) throw gradesError
      setGrades(gradesData || [])

      // Fetch surveys
      if (courseIds.length > 0) {
        const { data: surveysData, error: surveysError } = await supabase
          .from("surveys")
          .select(`
            id,
            title,
            status,
            closes_at,
            courses!inner(name)
          `)
          .in("course_id", courseIds)
          .eq("status", "active")

        if (surveysError) throw surveysError
        setSurveys(surveysData || [])
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
    }
  }

  const getStudentPerformance = (studentId: string) => {
    const studentGrades = grades.filter((g) => g.assignments)
    if (studentGrades.length === 0) return { average: 0, totalAssignments: 0, completedAssignments: 0 }

    let totalPoints = 0
    let totalPossible = 0

    studentGrades.forEach((grade) => {
      if (grade.points_earned !== null && grade.assignments) {
        totalPoints += grade.points_earned
        totalPossible += grade.assignments.points_possible
      }
    })

    const average = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0
    const completedAssignments = studentGrades.filter((g) => g.points_earned !== null).length

    return {
      average: Math.round(average * 100) / 100,
      totalAssignments: assignments.length,
      completedAssignments,
    }
  }

  const getUpcomingAssignments = () => {
    const now = new Date()
    const upcoming = assignments
      .filter((a) => new Date(a.due_date) > now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5)

    return upcoming
  }

  const getOverdueAssignments = () => {
    const now = new Date()
    return assignments.filter((a) => new Date(a.due_date) < now)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading parent dashboard...</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parent Dashboard</CardTitle>
          <CardDescription>No students associated with this account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please contact your school administrator to link your account with your child's student record.
          </p>
        </CardContent>
      </Card>
    )
  }

  const selectedStudentData = students.find((s) => s.id === selectedStudent)
  const performance = getStudentPerformance(selectedStudent)
  const upcomingAssignments = getUpcomingAssignments()
  const overdueAssignments = getOverdueAssignments()

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Select Student</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {students.map((student) => (
              <Button
                key={student.id}
                variant={selectedStudent === student.id ? "default" : "outline"}
                onClick={() => setSelectedStudent(student.id)}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>{student.full_name}</span>
                {selectedStudent === student.id && <CheckCircle className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedStudentData && (
        <>
          {/* Student Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.average}%</div>
                <p className="text-xs text-muted-foreground">
                  {performance.completedAssignments} of {performance.totalAssignments} assignments
                </p>
                <Progress value={performance.average} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">Active courses this term</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
                <p className="text-xs text-muted-foreground">Assignments due soon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueAssignments.length}</div>
                <p className="text-xs text-muted-foreground">Past due assignments</p>
              </CardContent>
            </Card>
          </div>

          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Student Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedStudentData.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Student ID</Label>
                  <p className="text-sm font-mono">{selectedStudentData.unique_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Class</Label>
                  <p className="text-sm">{selectedStudentData.class_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedStudentData.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Enrolled Courses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-muted-foreground">No courses enrolled yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <div key={course.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{course.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Class {course.class_number} • {course.subjects.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Teacher: {course.users.full_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Assignments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-muted-foreground">No assignments available.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.slice(0, 10).map((assignment) => {
                      const isOverdue = new Date(assignment.due_date) < new Date()
                      const isDueSoon = new Date(assignment.due_date) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                      const hasGrade = grades.some((g) => g.assignments?.title === assignment.title)

                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.title}</TableCell>
                          <TableCell>{assignment.courses.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {assignment.assignment_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">
                                {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasGrade ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Graded
                              </Badge>
                            ) : isOverdue ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : isDueSoon ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Due Soon
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Grades */}
          {grades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Recent Grades</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.slice(0, 10).map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.assignments?.title}</TableCell>
                        <TableCell>
                          {grade.points_earned}/{grade.assignments?.points_possible}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.letter_grade}</Badge>
                        </TableCell>
                        <TableCell>
                          {grade.assignments
                            ? Math.round((grade.points_earned / grade.assignments.points_possible) * 100)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Active Surveys */}
          {surveys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Active Surveys</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {surveys.map((survey) => (
                    <div key={survey.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{survey.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Course: {survey.courses.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Closes: {new Date(survey.closes_at).toLocaleDateString()}
                      </p>
                      <Badge className="mt-2" variant="default">
                        {survey.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

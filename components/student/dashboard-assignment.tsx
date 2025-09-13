"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database-client"
import { FileText, Calendar, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface DashboardAssignment {
  id: string
  title: string
  due_date: string | null
  assignment_type: string
  course: {
    name: string
    class_number: string
  }
  hasSubmission: boolean
}

interface StudentDashboardAssignmentsProps {
  studentId: string
}

export function StudentDashboardAssignments({ studentId }: StudentDashboardAssignmentsProps) {
  const [upcomingAssignments, setUpcomingAssignments] = useState<DashboardAssignment[]>([])
  const [overdueAssignments, setOverdueAssignments] = useState<DashboardAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [studentId])

  const fetchDashboardData = async () => {
    try {
      // Get student's enrolled courses
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", studentId)

      if (enrollmentError || !enrollments) {
        console.error("Error fetching enrollments:", enrollmentError)
        setLoading(false)
        return
      }

      const courseIds = enrollments.map((e) => e.course_id)

      if (courseIds.length === 0) {
        setLoading(false)
        return
      }

      // Get assignments for enrolled courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          assignment_type,
          courses!inner(name, class_number)
        `)
        .in("course_id", courseIds)
        .eq("is_published", true)
        .order("due_date", { ascending: true, nullsLast: true })

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError)
        setLoading(false)
        return
      }

      // Get submissions for these assignments
      const assignmentIds = assignments?.map((a) => a.id) || []

      if (assignmentIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: submissions } = await supabase
        .from("submissions")
        .select("assignment_id")
        .in("assignment_id", assignmentIds)
        .eq("student_id", studentId)

      const submittedAssignmentIds = new Set(submissions?.map((s) => s.assignment_id) || [])

      // Process assignments
      const now = new Date()
      const upcoming: DashboardAssignment[] = []
      const overdue: DashboardAssignment[] = []

      assignments?.forEach((assignment) => {
        const assignmentWithSubmission = {
          ...assignment,
          hasSubmission: submittedAssignmentIds.has(assignment.id),
        }

        if (assignment.due_date) {
          const dueDate = new Date(assignment.due_date)
          if (now > dueDate && !assignmentWithSubmission.hasSubmission) {
            overdue.push(assignmentWithSubmission)
          } else if (!assignmentWithSubmission.hasSubmission) {
            upcoming.push(assignmentWithSubmission)
          }
        } else if (!assignmentWithSubmission.hasSubmission) {
          upcoming.push(assignmentWithSubmission)
        }
      })

      setUpcomingAssignments(upcoming.slice(0, 5)) // Show only next 5
      setOverdueAssignments(overdue)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "Due tomorrow"
    if (diffDays > 1) return `Due in ${diffDays} days`
    return `Overdue by ${Math.abs(diffDays)} days`
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading assignments...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overdue Assignments Alert */}
      {overdueAssignments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-red-700 text-lg">
              <AlertTriangle className="h-5 w-5" />
              <span>Overdue Assignments ({overdueAssignments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueAssignments.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <div className="font-medium">{assignment.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.course.name} • {formatDueDate(assignment.due_date!)}
                    </div>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
              {overdueAssignments.length > 3 && (
                <Link href="/student/assignments">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View all {overdueAssignments.length} overdue assignments
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <FileText className="h-5 w-5" />
            <span>Upcoming Assignments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming assignments!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{assignment.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.course.name} - {assignment.course.class_number}
                    </div>
                    {assignment.due_date && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDueDate(assignment.due_date)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {assignment.assignment_type}
                    </Badge>
                  </div>
                </div>
              ))}
              <Link href="/student/assignments">
                <Button variant="outline" className="w-full mt-2 text-sm">
                  View All Assignments
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

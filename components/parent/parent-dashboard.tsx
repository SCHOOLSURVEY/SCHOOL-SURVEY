"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { Users, BookOpen, Calendar, GraduationCap } from "lucide-react"
import type { User, Grade, Assignment, Attendance, Notification } from "@/lib/types"

interface ParentDashboardProps {
  parentId: string
}

export function ParentDashboard({ parentId }: ParentDashboardProps) {
  const [children, setChildren] = useState<User[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [grades, setGrades] = useState<Grade[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParentData()
  }, [parentId])

  useEffect(() => {
    if (selectedChild) {
      fetchChildData()
    }
  }, [selectedChild])

  const fetchParentData = async () => {
    try {
      // Fetch parent's children
      const { data: relationships, error: relationshipsError } = await supabase
        .from("parent_student_relationships")
        .select(`
          student_id,
          users!parent_student_relationships_student_id_fkey(
            id, full_name, unique_id, class_number
          )
        `)
        .eq("parent_id", parentId)

      if (relationshipsError) throw relationshipsError

      const childrenData = relationships?.map((r) => r.users) || []
      setChildren(childrenData)

      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0].id)
      }

      // Fetch parent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", parentId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (notificationsError) throw notificationsError
      setNotifications(notificationsData || [])
    } catch (error) {
      console.error("Error fetching parent data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChildData = async () => {
    if (!selectedChild) return

    try {
      // Fetch child's grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select(`
          *,
          assignments!inner(
            title, points_possible, due_date, assignment_type,
            courses!inner(name, class_number)
          )
        `)
        .eq("student_id", selectedChild)
        .order("graded_at", { ascending: false })

      if (gradesError) throw gradesError

      // Fetch child's assignments (upcoming)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          *,
          courses!inner(
            name, class_number,
            course_enrollments!inner(student_id)
          )
        `)
        .eq("courses.course_enrollments.student_id", selectedChild)
        .eq("is_published", true)
        .gte("due_date", new Date().toISOString())
        .order("due_date")

      if (assignmentsError) throw assignmentsError

      // Fetch child's attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select(`
          *,
          courses!inner(name, class_number)
        `)
        .eq("student_id", selectedChild)
        .order("date", { ascending: false })
        .limit(30)

      if (attendanceError) throw attendanceError

      setGrades(gradesData || [])
      setAssignments(assignmentsData || [])
      setAttendance(attendanceData || [])
    } catch (error) {
      console.error("Error fetching child data:", error)
    }
  }

  const calculateOverallGrade = () => {
    if (grades.length === 0) return { average: 0, letterGrade: "N/A" }

    let totalPoints = 0
    let totalPossible = 0

    grades.forEach((grade) => {
      if (grade.points_earned !== null && grade.assignment) {
        totalPoints += grade.points_earned
        totalPossible += grade.assignment.points_possible
      }
    })

    if (totalPossible === 0) return { average: 0, letterGrade: "N/A" }

    const average = (totalPoints / totalPossible) * 100
    let letterGrade = "F"
    if (average >= 90) letterGrade = "A"
    else if (average >= 80) letterGrade = "B"
    else if (average >= 70) letterGrade = "C"
    else if (average >= 60) letterGrade = "D"

    return { average: Math.round(average * 100) / 100, letterGrade }
  }

  const getAttendanceRate = () => {
    if (attendance.length === 0) return 100

    const presentDays = attendance.filter((a) => a.status === "present").length
    return Math.round((presentDays / attendance.length) * 100)
  }

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  if (loading) {
    return <div>Loading parent dashboard...</div>
  }

  if (children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parent Portal</CardTitle>
          <CardDescription>No children linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contact the school administration to link your children to your parent account.
          </p>
        </CardContent>
      </Card>
    )
  }

  const selectedChildData = children.find((c) => c.id === selectedChild)
  const { average, letterGrade } = calculateOverallGrade()
  const attendanceRate = getAttendanceRate()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Parent Portal</span>
          </CardTitle>
          <CardDescription>Monitor your child's academic progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium">Select Child:</label>
            <div className="flex space-x-2">
              {children.map((child) => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child.id)}
                >
                  {child.full_name}
                </Button>
              ))}
            </div>
          </div>

          {selectedChildData && (
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{letterGrade}</div>
                  <p className="text-xs text-muted-foreground">{average}% average</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceRate}%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedChildData.class_number}</div>
                  <p className="text-xs text-muted-foreground">ID: {selectedChildData.unique_id}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Recent Grades</TabsTrigger>
          <TabsTrigger value="assignments">Upcoming Assignments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Recent Grades</CardTitle>
              <CardDescription>Latest graded assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.assignment?.title}</TableCell>
                      <TableCell>{grade.assignment?.courses?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {grade.assignment?.assignment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {grade.points_earned}/{grade.assignment?.points_possible}
                      </TableCell>
                      <TableCell>
                        <Badge variant={grade.letter_grade === "F" ? "destructive" : "default"}>
                          {grade.letter_grade}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(grade.graded_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {grades.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No grades available yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Assignments due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.course?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {assignment.assignment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.points_possible}</TableCell>
                      <TableCell>
                        {assignment.due_date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {assignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No upcoming assignments.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Recent attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.course?.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "absent"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {attendance.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No attendance records available.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent updates and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${notification.is_read ? "bg-muted/50" : "bg-background"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <Button variant="outline" size="sm" onClick={() => markNotificationRead(notification.id)}>
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No notifications available.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

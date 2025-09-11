"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// import { Calendar } from "@/components/ui/calendar"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Users, CheckCircle, XCircle, Clock, AlertTriangle, Plus, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Course, User } from "@/lib/types"

interface AttendanceRecord {
  id: string
  student_id: string
  course_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  recorded_by?: string
  created_at: string
  student?: User
  course?: Course
}

interface AttendanceManagerProps {
  teacherId: string
}

export function AttendanceManager({ teacherId }: AttendanceManagerProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; notes: string }>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchTeacherCourses()
  }, [teacherId])

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrolledStudents()
      fetchAttendanceRecords()
    }
  }, [selectedCourse, selectedDate])

  const fetchTeacherCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          subjects!inner(name, code)
        `)
        .eq("teacher_id", teacherId)
        .order("name")

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledStudents = async () => {
    if (!selectedCourse) return

    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          users!inner(*)
        `)
        .eq("course_id", selectedCourse)
        .eq("status", "active")

      if (error) throw error
      setEnrolledStudents(data?.map(e => e.users).filter(Boolean) || [])
    } catch (error) {
      console.error("Error fetching enrolled students:", error)
    }
  }

  const fetchAttendanceRecords = async () => {
    if (!selectedCourse) return

    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          users!attendance_student_id_fkey(*)
        `)
        .eq("school_id", schoolId)
        .eq("course_id", selectedCourse)
        .eq("date", format(selectedDate, "yyyy-MM-dd"))
        .order("created_at")

      if (error) throw error
      console.log("Fetched attendance records:", data)
      setAttendanceRecords(data || [])
    } catch (error) {
      console.error("Error fetching attendance records:", error)
    }
  }

  const markAttendance = async () => {
    if (!selectedCourse || !selectedDate) return

    setIsMarkingAttendance(true)
    const dateStr = format(selectedDate, "yyyy-MM-dd")

    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      console.log("Marking attendance for:", {
        schoolId,
        selectedCourse,
        dateStr,
        attendanceData,
        teacherId
      })

      // Delete existing records for this date and course
      const { error: deleteError } = await supabase
        .from("attendance")
        .delete()
        .eq("school_id", schoolId)
        .eq("course_id", selectedCourse)
        .eq("date", dateStr)

      if (deleteError) {
        console.error("Error deleting existing records:", deleteError)
        throw deleteError
      }

      console.log("Successfully deleted existing records")

      // Insert new attendance records
      const records = Object.entries(attendanceData).map(([studentId, data]) => ({
        school_id: schoolId,
        student_id: studentId,
        course_id: selectedCourse,
        date: dateStr,
        status: data.status,
        notes: data.notes || null,
        recorded_by: teacherId
      }))

      console.log("Records to insert:", records)

      if (records.length > 0) {
        const { error: insertError } = await supabase
          .from("attendance")
          .insert(records)

        if (insertError) {
          console.error("Error inserting records:", insertError)
          throw insertError
        }

        console.log("Successfully inserted attendance records")
      } else {
        console.log("No records to insert")
      }

      await fetchAttendanceRecords()
      setIsDialogOpen(false)
      setAttendanceData({})
      alert("Attendance marked successfully!")
    } catch (error) {
      console.error("Error marking attendance:", error)
      alert("Error marking attendance: " + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsMarkingAttendance(false)
    }
  }

  const initializeAttendanceData = () => {
    const initialData: Record<string, { status: string; notes: string }> = {}
    
    enrolledStudents.forEach(student => {
      const existingRecord = attendanceRecords.find(r => r.student_id === student.id)
      initialData[student.id] = {
        status: existingRecord?.status || "present",
        notes: existingRecord?.notes || ""
      }
    })
    
    setAttendanceData(initialData)
  }

  const updateAttendanceStatus = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }))
  }

  const updateAttendanceNotes = (studentId: string, notes: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800"
      case "absent": return "bg-red-100 text-red-800"
      case "late": return "bg-yellow-100 text-yellow-800"
      case "excused": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4" />
      case "absent": return <XCircle className="h-4 w-4" />
      case "late": return <Clock className="h-4 w-4" />
      case "excused": return <AlertTriangle className="h-4 w-4" />
      default: return null
    }
  }

  if (loading) {
    return <div>Loading attendance manager...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Attendance Management</span>
          </CardTitle>
          <CardDescription>Mark and track student attendance for your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - {course.class_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {selectedCourse && (
            <div className="mt-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={initializeAttendanceData}>
                    <Plus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Mark Attendance - {format(selectedDate, "PPP")}</DialogTitle>
                    <DialogDescription>
                      Mark attendance for all enrolled students in this course
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledStudents.map((student) => {
                          const existingRecord = attendanceRecords.find(r => r.student_id === student.id)
                          const currentData = attendanceData[student.id] || {
                            status: existingRecord?.status || "present",
                            notes: existingRecord?.notes || ""
                          }

                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{student.full_name}</div>
                                  <div className="text-sm text-muted-foreground">{student.unique_id}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={currentData.status}
                                  onValueChange={(value) => updateAttendanceStatus(student.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="excused">Excused</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Optional notes"
                                  value={currentData.notes}
                                  onChange={(e) => updateAttendanceNotes(student.id, e.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={markAttendance} disabled={isMarkingAttendance}>
                        {isMarkingAttendance ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCourse && attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records - {format(selectedDate, "PPP")}</CardTitle>
            <CardDescription>Current attendance status for all students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Recorded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.users?.full_name || 'Unknown Student'}</div>
                        <div className="text-sm text-muted-foreground">{record.users?.unique_id || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(record.status)}
                          <span className="capitalize">{record.status}</span>
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{record.notes || "-"}</TableCell>
                    <TableCell>{format(new Date(record.created_at), "PPp")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedCourse && attendanceRecords.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
            <p className="text-muted-foreground">
              No attendance has been marked for {format(selectedDate, "PPP")} yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


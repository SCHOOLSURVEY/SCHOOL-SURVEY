"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatabaseService } from "@/lib/database-client"
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import type { Course } from "@/lib/types"

interface AttendanceRecord {
  id: string
  student_id: string
  course_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  created_at: string
  course?: Course
}

interface AttendanceStats {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
}

interface StudentAttendanceViewProps {
  studentId: string
}

export function AttendanceView({ studentId }: StudentAttendanceViewProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  useEffect(() => {
    fetchEnrolledCourses()
  }, [studentId])

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceRecords()
    }
  }, [selectedCourse, selectedMonth])

  const fetchEnrolledCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          courses!inner(
            id,
            name,
            class_number,
            term,
            subjects!inner(name, code)
          )
        `)
        .eq("student_id", studentId)
        .eq("status", "active")

      if (error) throw error
      setCourses(data?.map(e => e.courses).filter(Boolean) || [])
      if (data && data.length > 0) {
        setSelectedCourse(data[0].courses.id)
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceRecords = async () => {
    if (!selectedCourse) return

    try {
      const startDate = startOfMonth(selectedMonth)
      const endDate = endOfMonth(selectedMonth)

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          courses!inner(
            id,
            name,
            class_number,
            subjects!inner(name)
          )
        `)
        .eq("student_id", studentId)
        .eq("course_id", selectedCourse)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true })

      if (error) throw error
      setAttendanceRecords(data || [])
      calculateAttendanceStats(data || [], startDate, endDate)
    } catch (error) {
      console.error("Error fetching attendance records:", error)
    }
  }

  const calculateAttendanceStats = (records: AttendanceRecord[], startDate: Date, endDate: Date) => {
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    const schoolDays = allDays.filter(day => day.getDay() !== 0 && day.getDay() !== 6) // Exclude weekends
    
    const totalDays = schoolDays.length
    const presentDays = records.filter(r => r.status === "present").length
    const absentDays = records.filter(r => r.status === "absent").length
    const lateDays = records.filter(r => r.status === "late").length
    const excusedDays = records.filter(r => r.status === "excused").length
    
    const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0

    setAttendanceStats({
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendanceRate
    })
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

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return "text-green-600"
    if (rate >= 85) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return <div>Loading attendance data...</div>
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Courses Enrolled</h3>
          <p className="text-muted-foreground">
            You are not enrolled in any courses yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>My Attendance</span>
          </CardTitle>
          <CardDescription>Track your attendance across all enrolled courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Course</label>
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
              <label className="text-sm font-medium">Select Month</label>
              <Select 
                value={format(selectedMonth, "yyyy-MM")} 
                onValueChange={(value) => setSelectedMonth(new Date(value + "-01"))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() - i)
                    return (
                      <SelectItem key={format(date, "yyyy-MM")} value={format(date, "yyyy-MM")}>
                        {format(date, "MMMM yyyy")}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {attendanceStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceRateColor(attendanceStats.attendanceRate)}`}>
                {attendanceStats.attendanceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {attendanceStats.presentDays + attendanceStats.lateDays} of {attendanceStats.totalDays} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendanceStats.presentDays}</div>
              <p className="text-xs text-muted-foreground">Days present</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{attendanceStats.absentDays}</div>
              <p className="text-xs text-muted-foreground">Days absent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Days</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{attendanceStats.lateDays}</div>
              <p className="text-xs text-muted-foreground">Days late</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records - {format(selectedMonth, "MMMM yyyy")}</CardTitle>
          <CardDescription>
            Detailed attendance records for {courses.find(c => c.id === selectedCourse)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.date), "PPP")}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
              <p className="text-muted-foreground">
                No attendance records found for {format(selectedMonth, "MMMM yyyy")}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AttendanceView

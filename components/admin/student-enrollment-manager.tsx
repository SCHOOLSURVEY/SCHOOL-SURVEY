"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Users, Plus, Trash2 } from "lucide-react"

interface Student {
  id: string
  full_name: string
  unique_id: string
  class_number: string
}

interface Course {
  id: string
  name: string
  class_number: string
  subjects: { name: string }
  users: { full_name: string }
}

interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  users: { full_name: string; unique_id: string }
  courses: { name: string; class_number: string }
}

export function StudentEnrollmentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("users")
        .select("id, full_name, unique_id, class_number")
        .eq("role", "student")
        .order("full_name")

      if (studentsError) throw studentsError

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          class_number,
          subjects!inner(name),
          users!inner(full_name)
        `)
        .order("name")

      if (coursesError) throw coursesError

      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          users!inner(full_name, unique_id),
          courses!inner(name, class_number)
        `)
        .order("enrolled_at", { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      setStudents(studentsData || [])
      setCourses(coursesData || [])
      setEnrollments(enrollmentsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const enrollStudent = async () => {
    if (!selectedStudent || !selectedCourse) return

    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("student_id", selectedStudent)
        .eq("course_id", selectedCourse)
        .single()

      if (existing) {
        alert("Student is already enrolled in this course")
        return
      }

      const { error } = await supabase.from("course_enrollments").insert([
        {
          student_id: selectedStudent,
          course_id: selectedCourse,
        },
      ])

      if (error) throw error

      setSelectedStudent("")
      setSelectedCourse("")
      fetchData()
      alert("Student enrolled successfully!")
    } catch (error) {
      console.error("Error enrolling student:", error)
      alert("Error enrolling student")
    }
  }

  const unenrollStudent = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to unenroll this student?")) return

    try {
      const { error } = await supabase.from("course_enrollments").delete().eq("id", enrollmentId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error unenrolling student:", error)
    }
  }

  const autoEnrollByClass = async () => {
    if (!confirm("This will automatically enroll students in courses that match their class number. Continue?")) return

    try {
      // Get all students and courses
      const studentsInCourses = []

      for (const student of students) {
        const matchingCourses = courses.filter((course) => course.class_number === student.class_number)

        for (const course of matchingCourses) {
          // Check if already enrolled
          const isEnrolled = enrollments.some(
            (enrollment) => enrollment.student_id === student.id && enrollment.course_id === course.id,
          )

          if (!isEnrolled) {
            studentsInCourses.push({
              student_id: student.id,
              course_id: course.id,
            })
          }
        }
      }

      if (studentsInCourses.length === 0) {
        alert("No new enrollments needed. All students are already enrolled in matching courses.")
        return
      }

      const { error } = await supabase.from("course_enrollments").insert(studentsInCourses)

      if (error) throw error

      fetchData()
      alert(`Successfully enrolled ${studentsInCourses.length} students in courses!`)
    } catch (error) {
      console.error("Error auto-enrolling students:", error)
      alert("Error auto-enrolling students")
    }
  }

  if (loading) {
    return <div>Loading enrollment data...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Enrollment Management</CardTitle>
          <CardDescription>Enroll students in courses to enable survey participation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.unique_id}) - Class {student.class_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - Class {course.class_number} ({course.subjects.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={enrollStudent} disabled={!selectedStudent || !selectedCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Enroll
            </Button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Total Enrollments: {enrollments.length} | Students: {students.length} | Courses: {courses.length}
            </div>
            <Button onClick={autoEnrollByClass} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Auto-Enroll by Class
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Enrollments</CardTitle>
          <CardDescription>Students enrolled in courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {enrollment.users.full_name}
                    <br />
                    <span className="text-xs text-muted-foreground">{enrollment.users.unique_id}</span>
                  </TableCell>
                  <TableCell>{enrollment.courses.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{enrollment.courses.class_number}</Badge>
                  </TableCell>
                  <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unenrollStudent(enrollment.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {enrollments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students enrolled yet. Use the enrollment form above or auto-enroll by class.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

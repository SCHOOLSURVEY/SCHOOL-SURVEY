"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Plus, Trash2, Users, BookOpen, UserPlus } from "lucide-react"

interface Student {
  id: string
  unique_id: string
  full_name: string
  email: string
  class_number?: string
  created_at: string
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
  status: "active" | "dropped" | "completed"
  student: Student
  course: Course
}

export function StudentEnrollmentManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: "",
    course_id: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Fetch enrollments with related data
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          student:users!inner(
            id,
            unique_id,
            full_name,
            email,
            class_number,
            created_at
          ),
          course:courses!inner(
            id,
            name,
            class_number,
            subjects!inner(name),
            users!inner(full_name)
          )
        `)
        .eq("school_id", schoolId) // Filter by current school
        .order("enrolled_at", { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      // Fetch available students
      const { data: studentsData, error: studentsError } = await supabase
        .from("users")
        .select("id, unique_id, full_name, email, class_number, created_at")
        .eq("role", "student")
        .eq("school_id", schoolId) // Filter by current school
        .order("full_name")

      if (studentsError) throw studentsError

      // Fetch available courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          class_number,
          subjects!inner(name),
          users!inner(full_name)
        `)
        .eq("school_id", schoolId) // Filter by current school
        .order("name")

      if (coursesError) throw coursesError

      setEnrollments(enrollmentsData || [])
      setStudents(studentsData || [])
      setCourses(coursesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const enrollStudent = async () => {
    if (!newEnrollment.student_id || !newEnrollment.course_id) {
      alert("Please select both student and course")
      return
    }

    try {
      // Check if student is already enrolled
      const existingEnrollment = enrollments.find(
        (e) => e.student_id === newEnrollment.student_id && e.course_id === newEnrollment.course_id
      )

      if (existingEnrollment) {
        alert("Student is already enrolled in this course")
        return
      }

      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Get the course details to extract term_id
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("term_id")
        .eq("id", newEnrollment.course_id)
        .single()

      if (courseError || !courseData) {
        throw new Error("Could not find course details")
      }

      const { error } = await supabase.from("course_enrollments").insert([
        {
          school_id: schoolId,
          student_id: newEnrollment.student_id,
          course_id: newEnrollment.course_id,
          term_id: courseData.term_id,
          status: "active",
        },
      ])

      if (error) throw error

      setNewEnrollment({ student_id: "", course_id: "" })
      setIsEnrollDialogOpen(false)
      fetchData()
      alert("Student enrolled successfully!")
    } catch (error) {
      console.error("Error enrolling student:", error)
      alert("Error enrolling student")
    }
  }

  const updateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("course_enrollments")
        .update({ status: newStatus })
        .eq("id", enrollmentId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error updating enrollment:", error)
    }
  }

  const removeEnrollment = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return

    try {
      const { error } = await supabase.from("course_enrollments").delete().eq("id", enrollmentId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error removing enrollment:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "dropped":
        return <Badge variant="destructive">Dropped</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <div>Loading enrollments...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Student Enrollment Management</span>
              </CardTitle>
              <CardDescription>Manage student course enrollments</CardDescription>
            </div>
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={students.length === 0 || courses.length === 0}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Student in Course</DialogTitle>
                  <DialogDescription>Add a student to a specific course</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">Student</Label>
                    <Select
                      value={newEnrollment.student_id}
                      onValueChange={(value) => setNewEnrollment({ ...newEnrollment, student_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name} ({student.unique_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select
                      value={newEnrollment.course_id}
                      onValueChange={(value) => setNewEnrollment({ ...newEnrollment, course_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} - {course.class_number} ({course.subjects.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={enrollStudent} className="w-full" disabled={!newEnrollment.student_id || !newEnrollment.course_id}>
                    Enroll Student
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No students available. Please create student accounts first.</p>
            </div>
          )}
          {courses.length === 0 && students.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No courses available. Please create courses first.</p>
            </div>
          )}
          {students.length > 0 && courses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{enrollment.student.full_name}</div>
                        <div className="text-sm text-muted-foreground">{enrollment.student.unique_id}</div>
                        {enrollment.student.class_number && (
                          <div className="text-xs text-muted-foreground">Class: {enrollment.student.class_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{enrollment.course.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.course.class_number} • {enrollment.course.subjects.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.course.users.full_name}</TableCell>
                    <TableCell>
                      <Select
                        value={enrollment.status}
                        onValueChange={(value) => updateEnrollmentStatus(enrollment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="dropped">Dropped</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEnrollment(enrollment.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {enrollments.length === 0 && students.length > 0 && courses.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No enrollments yet. Click "Enroll Student" to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

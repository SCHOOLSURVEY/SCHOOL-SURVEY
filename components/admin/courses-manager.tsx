"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Plus, Trash2, Users } from "lucide-react"

interface Course {
  id: string
  name: string
  class_number: string
  term: string
  created_at: string
  subjects: { name: string; code: string }
  users: { full_name: string; unique_id: string }
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Teacher {
  id: string
  full_name: string
  unique_id: string
}

export function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [newCourse, setNewCourse] = useState({
    name: "",
    subject_id: "",
    teacher_id: "",
    class_number: "",
    term: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch courses with related data
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          subjects!inner(name, code),
          users!inner(full_name, unique_id)
        `)
        .order("created_at", { ascending: false })

      if (coursesError) throw coursesError

      // Fetch subjects for dropdown
      const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*").order("name")

      if (subjectsError) throw subjectsError

      // Fetch teachers for dropdown
      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select("id, full_name, unique_id")
        .eq("role", "teacher")
        .order("full_name")

      if (teachersError) throw teachersError

      setCourses(coursesData || [])
      setSubjects(subjectsData || [])
      setTeachers(teachersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async () => {
    try {
      const { error } = await supabase.from("courses").insert([
        {
          name: newCourse.name,
          subject_id: newCourse.subject_id,
          teacher_id: newCourse.teacher_id,
          class_number: newCourse.class_number,
          term: newCourse.term,
        },
      ])

      if (error) throw error

      setNewCourse({ name: "", subject_id: "", teacher_id: "", class_number: "", term: "" })
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error creating course:", error)
      alert("Error creating course")
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also remove all student enrollments.")) {
      return
    }

    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Error deleting course")
    }
  }

  if (loading) {
    return <div>Loading courses...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Courses Management</CardTitle>
            <CardDescription>Create and manage school courses</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={subjects.length === 0 || teachers.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Assign a teacher to a subject for a specific class and term</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-name">Course Name</Label>
                  <Input
                    id="course-name"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    placeholder="e.g., Advanced Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={newCourse.subject_id}
                    onValueChange={(value) => setNewCourse({ ...newCourse, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select
                    value={newCourse.teacher_id}
                    onValueChange={(value) => setNewCourse({ ...newCourse, teacher_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name} ({teacher.unique_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class-number">Class</Label>
                    <Input
                      id="class-number"
                      value={newCourse.class_number}
                      onChange={(e) => setNewCourse({ ...newCourse, class_number: e.target.value })}
                      placeholder="e.g., 10A, 12B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Input
                      id="term"
                      value={newCourse.term}
                      onChange={(e) => setNewCourse({ ...newCourse, term: e.target.value })}
                      placeholder="e.g., Fall 2024"
                    />
                  </div>
                </div>
                <Button
                  onClick={createCourse}
                  className="w-full"
                  disabled={
                    !newCourse.name ||
                    !newCourse.subject_id ||
                    !newCourse.teacher_id ||
                    !newCourse.class_number ||
                    !newCourse.term
                  }
                >
                  Create Course
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No subjects available. Please create subjects first before adding courses.</p>
          </div>
        )}
        {teachers.length === 0 && subjects.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No teachers available. Please onboard teachers first before creating courses.</p>
          </div>
        )}
        {subjects.length > 0 && teachers.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>
                    {course.subjects.name} ({course.subjects.code})
                  </TableCell>
                  <TableCell>
                    {course.users.full_name} ({course.users.unique_id})
                  </TableCell>
                  <TableCell>{course.class_number}</TableCell>
                  <TableCell>{course.term}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>0</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCourse(course.id)}
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
        {courses.length === 0 && subjects.length > 0 && teachers.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No courses created yet. Click "Add Course" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

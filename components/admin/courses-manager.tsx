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
import { DatabaseService } from "@/lib/database-client"
import { Plus, Trash2, Users } from "lucide-react"

interface Course {
  _id: string
  name: string
  class_number: string
  term: string
  created_at: string
  subjects: { name: string; code: string }
  users: { full_name: string; unique_id: string }
}

interface Subject {
  _id: string
  name: string
  code: string
}

interface Teacher {
  _id: string
  full_name: string
  unique_id: string
}

interface Term {
  _id: string
  academic_year_id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

export function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [newCourse, setNewCourse] = useState({
    name: "",
    subject_id: "",
    teacher_id: "",
    class_number: "",
    term: "",
    term_id: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

      // Fetch courses, subjects, teachers, and terms using MongoDB
      const [coursesData, subjectsData, teachersData, termsData] = await Promise.all([
        DatabaseService.getCoursesBySchool(schoolId),
        DatabaseService.getSubjectsBySchool(schoolId),
        DatabaseService.getUsersByRole(schoolId, "teacher"),
        DatabaseService.getTermsBySchool(schoolId)
      ])

      setCourses(coursesData || [])
      setSubjects(subjectsData || [])
      setTeachers(teachersData || [])
      setTerms(termsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      await DatabaseService.createCourse({
        school_id: schoolId,
        name: newCourse.name,
        subject_id: newCourse.subject_id,
        teacher_id: newCourse.teacher_id,
        class_number: newCourse.class_number,
        term: newCourse.term,
        term_id: newCourse.term_id,
      })

      setNewCourse({ name: "", subject_id: "", teacher_id: "", class_number: "", term: "", term_id: "" })
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error creating course:", error)
      alert(`Error creating course: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also remove all student enrollments.")) {
      return
    }

    try {
      await DatabaseService.deleteCourse(courseId)
      fetchData()
    } catch (error) {
      console.error("Error deleting course:", error)
      alert(`Error deleting course: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return <div>Loading courses...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Courses Management</CardTitle>
            <CardDescription className="text-sm">Create and manage school courses</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={subjects.length === 0 || teachers.length === 0} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Assign a teacher to a subject for a specific class</DialogDescription>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {terms.length === 0 ? (
                      <div className="p-3 border border-dashed border-gray-300 rounded-md text-center text-sm text-gray-500">
                        No terms available. Please create terms first.
                      </div>
                    ) : (
                      <Select value={newCourse.term_id} onValueChange={(value) => {
                        const selectedTerm = terms.find(t => t.id === value)
                        setNewCourse({ 
                          ...newCourse, 
                          term_id: value,
                          term: selectedTerm?.name || ""
                        })
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a term" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name} {term.is_current ? '(Current)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    !newCourse.term || !newCourse.term_id
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Course Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Teacher</TableHead>
                  <TableHead className="hidden lg:table-cell">Class</TableHead>
                  <TableHead className="hidden xl:table-cell">Term</TableHead>
                  <TableHead className="hidden md:table-cell">Students</TableHead>
                  <TableHead className="min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.name}</div>
                        <div className="sm:hidden mt-1 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {course.subjects.name} ({course.subjects.code})
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {course.users.full_name} ({course.users.unique_id})
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">{course.class_number}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {course.subjects.name} ({course.subjects.code})
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {course.users.full_name} ({course.users.unique_id})
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{course.class_number}</TableCell>
                    <TableCell className="hidden md:table-cell">
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
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

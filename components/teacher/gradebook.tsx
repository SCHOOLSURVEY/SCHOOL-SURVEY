"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DatabaseService } from "@/lib/database-client"
import { BookOpen, Edit, Save } from "lucide-react"
import type { Assignment, Grade, User, Course } from "@/lib/types"

interface GradebookProps {
  teacherId: string
}

export function Gradebook({ teacherId }: GradebookProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGrade, setEditingGrade] = useState<string | null>(null)
  const [gradeValues, setGradeValues] = useState<Record<string, { points: string; comments: string }>>({})

  useEffect(() => {
    fetchTeacherCourses()
  }, [teacherId])

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData()
    }
  }, [selectedCourse])

  const fetchTeacherCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          subjects!inner(name, code)
        `)
        .eq("teacher_id", teacherId)

      if (error) throw error
      setCourses(data || [])
      if (data && data.length > 0) {
        setSelectedCourse(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseData = async () => {
    if (!selectedCourse) return

    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", selectedCourse)
        .eq("is_published", true)
        .order("due_date")

      if (assignmentsError) throw assignmentsError

      // Fetch enrolled students
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select(`
          student_id,
          users!inner(id, full_name, unique_id)
        `)
        .eq("course_id", selectedCourse)

      if (enrollmentsError) throw enrollmentsError

      const studentsData = enrollmentsData?.map((e) => e.users) || []

      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select(`
          *,
          assignments!inner(course_id)
        `)
        .eq("assignments.course_id", selectedCourse)

      if (gradesError) throw gradesError

      setAssignments(assignmentsData || [])
      setStudents(studentsData || [])
      setGrades(gradesData || [])
    } catch (error) {
      console.error("Error fetching course data:", error)
    }
  }

  const getGrade = (studentId: string, assignmentId: string) => {
    return grades.find((g) => g.student_id === studentId && g.assignment_id === assignmentId)
  }

  const calculateLetterGrade = (points: number, possible: number) => {
    const percentage = (points / possible) * 100
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const handleGradeEdit = (studentId: string, assignmentId: string) => {
    const gradeKey = `${studentId}-${assignmentId}`
    const existingGrade = getGrade(studentId, assignmentId)

    setEditingGrade(gradeKey)
    setGradeValues({
      ...gradeValues,
      [gradeKey]: {
        points: existingGrade?.points_earned?.toString() || "",
        comments: existingGrade?.comments || "",
      },
    })
  }

  const saveGrade = async (studentId: string, assignmentId: string) => {
    const gradeKey = `${studentId}-${assignmentId}`
    const values = gradeValues[gradeKey]

    if (!values) return

    try {
      const assignment = assignments.find((a) => a.id === assignmentId)
      if (!assignment) return

      const pointsEarned = Number.parseFloat(values.points) || 0
      const letterGrade = calculateLetterGrade(pointsEarned, assignment.points_possible)

      const gradeData = {
        assignment_id: assignmentId,
        student_id: studentId,
        points_earned: pointsEarned,
        letter_grade: letterGrade,
        comments: values.comments,
        graded_by: teacherId,
      }

      const existingGrade = getGrade(studentId, assignmentId)

      if (existingGrade) {
        const { error } = await supabase.from("grades").update(gradeData).eq("id", existingGrade.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("grades").insert([gradeData])

        if (error) throw error
      }

      // Create notification for student
      await supabase.from("notifications").insert([
        {
          user_id: studentId,
          title: "New Grade Posted",
          message: `Your grade for "${assignment.title}" has been posted: ${letterGrade} (${pointsEarned}/${assignment.points_possible})`,
          type: "grade",
          action_url: "/student",
        },
      ])

      setEditingGrade(null)
      fetchCourseData()
    } catch (error) {
      console.error("Error saving grade:", error)
      alert("Error saving grade")
    }
  }

  const calculateStudentAverage = (studentId: string) => {
    const studentGrades = grades.filter((g) => g.student_id === studentId)
    if (studentGrades.length === 0) return { average: 0, letterGrade: "N/A" }

    let totalPoints = 0
    let totalPossible = 0

    studentGrades.forEach((grade) => {
      const assignment = assignments.find((a) => a.id === grade.assignment_id)
      if (assignment && grade.points_earned !== null) {
        totalPoints += grade.points_earned
        totalPossible += assignment.points_possible
      }
    })

    if (totalPossible === 0) return { average: 0, letterGrade: "N/A" }

    const average = (totalPoints / totalPossible) * 100
    const letterGrade = calculateLetterGrade(totalPoints, totalPossible)

    return { average: Math.round(average * 100) / 100, letterGrade }
  }

  if (loading) {
    return <div>Loading gradebook...</div>
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gradebook</CardTitle>
          <CardDescription>No courses assigned</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You don't have any courses assigned yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Gradebook</span>
          </CardTitle>
          <CardDescription>Manage grades for your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="course-select">Select Course:</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-64">
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

            {selectedCourse && (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48 sticky left-0 bg-background">Student</TableHead>
                        {assignments.map((assignment) => (
                          <TableHead key={assignment.id} className="text-center min-w-32">
                            <div className="space-y-1">
                              <div className="font-medium">{assignment.title}</div>
                              <div className="text-xs text-muted-foreground">{assignment.points_possible} pts</div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.due_date && new Date(assignment.due_date).toLocaleDateString()}
                              </div>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-32">
                          <div className="space-y-1">
                            <div className="font-medium">Average</div>
                            <div className="text-xs text-muted-foreground">Overall</div>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const { average, letterGrade } = calculateStudentAverage(student.id)
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="sticky left-0 bg-background">
                              <div>
                                <div className="font-medium">{student.full_name}</div>
                                <div className="text-xs text-muted-foreground">{student.unique_id}</div>
                              </div>
                            </TableCell>
                            {assignments.map((assignment) => {
                              const grade = getGrade(student.id, assignment.id)
                              const gradeKey = `${student.id}-${assignment.id}`
                              const isEditing = editingGrade === gradeKey

                              return (
                                <TableCell key={assignment.id} className="text-center">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Input
                                        type="number"
                                        placeholder="Points"
                                        value={gradeValues[gradeKey]?.points || ""}
                                        onChange={(e) =>
                                          setGradeValues({
                                            ...gradeValues,
                                            [gradeKey]: {
                                              ...gradeValues[gradeKey],
                                              points: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-20 text-center"
                                        max={assignment.points_possible}
                                      />
                                      <div className="flex space-x-1">
                                        <Button size="sm" onClick={() => saveGrade(student.id, assignment.id)}>
                                          <Save className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingGrade(null)}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="cursor-pointer hover:bg-muted p-2 rounded"
                                      onClick={() => handleGradeEdit(student.id, assignment.id)}
                                    >
                                      {grade ? (
                                        <div className="space-y-1">
                                          <div className="font-medium">
                                            {grade.points_earned}/{assignment.points_possible}
                                          </div>
                                          <Badge variant="outline">{grade.letter_grade}</Badge>
                                        </div>
                                      ) : (
                                        <div className="text-muted-foreground">
                                          <Edit className="h-4 w-4 mx-auto" />
                                          <div className="text-xs">Click to grade</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <div className="font-medium">{average}%</div>
                                <Badge variant={letterGrade === "F" ? "destructive" : "default"}>{letterGrade}</Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

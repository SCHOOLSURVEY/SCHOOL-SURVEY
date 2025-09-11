"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Save, 
  Download,
  BarChart3,
  Calculator
} from "lucide-react"
import type { Course, User, Assignment, Grade } from "@/lib/types"

interface StudentGrade {
  student_id: string
  student_name: string
  student_unique_id: string
  grades: Record<string, Grade>
  total_points: number
  total_possible: number
  percentage: number
  letter_grade: string
  gpa: number
}

interface AssignmentStats {
  assignment_id: string
  title: string
  points_possible: number
  average_score: number
  highest_score: number
  lowest_score: number
  completion_rate: number
  grade_distribution: Record<string, number>
}

interface AdvancedGradebookProps {
  teacherId: string
}

export function AdvancedGradebook({ teacherId }: AdvancedGradebookProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; assignmentId: string } | null>(null)
  const [gradeForm, setGradeForm] = useState({ points: "", letter: "", comments: "" })
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)

  useEffect(() => {
    fetchTeacherCourses()
  }, [teacherId])

  useEffect(() => {
    if (selectedCourse) {
      fetchGradebookData()
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
        .order("name")

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

  const fetchGradebookData = async () => {
    if (!selectedCourse) return

    try {
      // Fetch enrolled students
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select(`
          users!inner(*)
        `)
        .eq("course_id", selectedCourse)
        .eq("status", "active")

      if (enrollmentError) throw enrollmentError

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", selectedCourse)
        .eq("is_published", true)
        .order("created_at", { ascending: true })

      if (assignmentsError) throw assignmentsError

      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .in("assignment_id", assignmentsData?.map(a => a.id) || [])

      if (gradesError) throw gradesError

      setAssignments(assignmentsData || [])

      // Process student grades
      const studentGrades: StudentGrade[] = (enrollments || []).map(enrollment => {
        const student = enrollment.users
        const studentGradesMap: Record<string, Grade> = {}
        let totalPoints = 0
        let totalPossible = 0

        // Calculate grades for this student
        (assignmentsData || []).forEach(assignment => {
          const grade = gradesData?.find(g => g.student_id === student.id && g.assignment_id === assignment.id)
          if (grade) {
            studentGradesMap[assignment.id] = grade
            totalPoints += grade.points_earned || 0
          }
          totalPossible += assignment.points_possible
        })

        const percentage = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0
        const letterGrade = calculateLetterGrade(percentage)
        const gpa = calculateGPA(percentage)

        return {
          student_id: student.id,
          student_name: student.full_name,
          student_unique_id: student.unique_id,
          grades: studentGradesMap,
          total_points: totalPoints,
          total_possible: totalPossible,
          percentage,
          letter_grade: letterGrade,
          gpa
        }
      })

      setStudents(studentGrades)

      // Calculate assignment statistics
      const stats: AssignmentStats[] = (assignmentsData || []).map(assignment => {
        const assignmentGrades = gradesData?.filter(g => g.assignment_id === assignment.id) || []
        const scores = assignmentGrades.map(g => g.points_earned || 0)
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0
        const completionRate = (assignmentGrades.length / studentGrades.length) * 100

        // Grade distribution
        const distribution = {
          A: assignmentGrades.filter(g => calculateLetterGrade((g.points_earned || 0) / assignment.points_possible * 100) === "A").length,
          B: assignmentGrades.filter(g => calculateLetterGrade((g.points_earned || 0) / assignment.points_possible * 100) === "B").length,
          C: assignmentGrades.filter(g => calculateLetterGrade((g.points_earned || 0) / assignment.points_possible * 100) === "C").length,
          D: assignmentGrades.filter(g => calculateLetterGrade((g.points_earned || 0) / assignment.points_possible * 100) === "D").length,
          F: assignmentGrades.filter(g => calculateLetterGrade((g.points_earned || 0) / assignment.points_possible * 100) === "F").length,
        }

        return {
          assignment_id: assignment.id,
          title: assignment.title,
          points_possible: assignment.points_possible,
          average_score: averageScore,
          highest_score: highestScore,
          lowest_score: lowestScore,
          completion_rate: completionRate,
          grade_distribution: distribution
        }
      })

      setAssignmentStats(stats)
    } catch (error) {
      console.error("Error fetching gradebook data:", error)
    }
  }

  const calculateLetterGrade = (percentage: number): string => {
    if (percentage >= 97) return "A+"
    if (percentage >= 93) return "A"
    if (percentage >= 90) return "A-"
    if (percentage >= 87) return "B+"
    if (percentage >= 83) return "B"
    if (percentage >= 80) return "B-"
    if (percentage >= 77) return "C+"
    if (percentage >= 73) return "C"
    if (percentage >= 70) return "C-"
    if (percentage >= 67) return "D+"
    if (percentage >= 63) return "D"
    if (percentage >= 60) return "D-"
    return "F"
  }

  const calculateGPA = (percentage: number): number => {
    if (percentage >= 97) return 4.0
    if (percentage >= 93) return 4.0
    if (percentage >= 90) return 3.7
    if (percentage >= 87) return 3.3
    if (percentage >= 83) return 3.0
    if (percentage >= 80) return 2.7
    if (percentage >= 77) return 2.3
    if (percentage >= 73) return 2.0
    if (percentage >= 70) return 1.7
    if (percentage >= 67) return 1.3
    if (percentage >= 63) return 1.0
    if (percentage >= 60) return 0.7
    return 0.0
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const openGradeDialog = (studentId: string, assignmentId: string) => {
    const student = students.find(s => s.student_id === studentId)
    const grade = student?.grades[assignmentId]
    
    setEditingGrade({ studentId, assignmentId })
    setGradeForm({
      points: grade?.points_earned?.toString() || "",
      letter: grade?.letter_grade || "",
      comments: grade?.comments || ""
    })
    setIsGradeDialogOpen(true)
  }

  const saveGrade = async () => {
    if (!editingGrade || !gradeForm.points) return

    try {
      const pointsEarned = parseInt(gradeForm.points)
      const assignment = assignments.find(a => a.id === editingGrade.assignmentId)
      if (!assignment) return

      const percentage = (pointsEarned / assignment.points_possible) * 100
      const letterGrade = calculateLetterGrade(percentage)

      const { error } = await supabase
        .from("grades")
        .upsert({
          assignment_id: editingGrade.assignmentId,
          student_id: editingGrade.studentId,
          points_earned: pointsEarned,
          letter_grade: letterGrade,
          comments: gradeForm.comments || null,
          graded_by: teacherId
        })

      if (error) throw error

      setIsGradeDialogOpen(false)
      setEditingGrade(null)
      fetchGradebookData()
    } catch (error) {
      console.error("Error saving grade:", error)
    }
  }

  const exportGradebook = () => {
    const csvContent = [
      ["Student ID", "Student Name", ...assignments.map(a => a.title), "Total Points", "Percentage", "Letter Grade", "GPA"],
      ...students.map(student => [
        student.student_unique_id,
        student.student_name,
        ...assignments.map(assignment => {
          const grade = student.grades[assignment.id]
          return grade ? grade.points_earned : ""
        }),
        student.total_points,
        student.percentage.toFixed(1),
        student.letter_grade,
        student.gpa.toFixed(2)
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gradebook-${selectedCourse}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div>Loading gradebook...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Advanced Gradebook</span>
              </CardTitle>
              <CardDescription>Comprehensive grading and analytics for your courses</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - {course.class_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportGradebook} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grades" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grades">Student Grades</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="statistics">Assignment Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="grades">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      {assignments.map((assignment) => (
                        <TableHead key={assignment.id} className="min-w-[120px]">
                          <div className="text-center">
                            <div className="font-medium text-xs">{assignment.title}</div>
                            <div className="text-xs text-muted-foreground">{assignment.points_possible} pts</div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">GPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.student_name}</div>
                            <div className="text-sm text-muted-foreground">{student.student_unique_id}</div>
                          </div>
                        </TableCell>
                        {assignments.map((assignment) => {
                          const grade = student.grades[assignment.id]
                          return (
                            <TableCell key={assignment.id} className="text-center">
                              {grade ? (
                                <div className="space-y-1">
                                  <div className="font-medium">{grade.points_earned}</div>
                                  <div className="text-xs text-muted-foreground">{grade.letter_grade}</div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openGradeDialog(student.student_id, assignment.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center">
                          <div className="font-medium">{student.total_points}/{student.total_possible}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`font-medium ${getGradeColor(student.percentage)}`}>
                            {student.percentage.toFixed(1)}% ({student.letter_grade})
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{student.gpa.toFixed(2)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length > 0 ? (students.reduce((sum, s) => sum + s.percentage, 0) / students.length).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Overall class performance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Passing Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length > 0 ? ((students.filter(s => s.percentage >= 60).length / students.length) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Students with 60%+</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Achievers</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length > 0 ? ((students.filter(s => s.percentage >= 90).length / students.length) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Students with 90%+</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length > 0 ? ((students.filter(s => s.percentage < 60).length / students.length) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Students below 60%</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics">
              <div className="space-y-4">
                {assignmentStats.map((stat) => (
                  <Card key={stat.assignment_id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{stat.title}</CardTitle>
                      <CardDescription>{stat.points_possible} points possible</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <div className="text-2xl font-bold">{stat.average_score.toFixed(1)}</div>
                          <p className="text-xs text-muted-foreground">Average Score</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.highest_score}</div>
                          <p className="text-xs text-muted-foreground">Highest Score</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.lowest_score}</div>
                          <p className="text-xs text-muted-foreground">Lowest Score</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.completion_rate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Completion Rate</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Grade Distribution</h4>
                        <div className="flex space-x-4">
                          {Object.entries(stat.grade_distribution).map(([grade, count]) => (
                            <div key={grade} className="text-center">
                              <div className="text-lg font-bold">{count}</div>
                              <div className="text-xs text-muted-foreground">{grade}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Grade Edit Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>Update the student's grade for this assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points Earned</Label>
              <Input
                id="points"
                type="number"
                value={gradeForm.points}
                onChange={(e) => setGradeForm({ ...gradeForm, points: e.target.value })}
                placeholder="Enter points earned"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={gradeForm.comments}
                onChange={(e) => setGradeForm({ ...gradeForm, comments: e.target.value })}
                placeholder="Add feedback or comments"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveGrade} disabled={!gradeForm.points}>
                <Save className="h-4 w-4 mr-2" />
                Save Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}




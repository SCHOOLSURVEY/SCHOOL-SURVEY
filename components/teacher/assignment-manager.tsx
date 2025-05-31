"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2, Eye, Calendar, FileText, Users } from "lucide-react"
import type { Assignment, Course, Submission } from "@/lib/types"

interface AssignmentManagerProps {
  teacherId: string
}

export function AssignmentManager({ teacherId }: AssignmentManagerProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    course_id: "",
    assignment_type: "homework",
    points_possible: 100,
    due_date: "",
    is_published: false,
  })

  useEffect(() => {
    fetchData()
  }, [teacherId])

  const fetchData = async () => {
    try {
      // Fetch teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          subjects!inner(name, code)
        `)
        .eq("teacher_id", teacherId)

      if (coursesError) throw coursesError

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          *,
          courses!inner(name, class_number)
        `)
        .in("course_id", coursesData?.map((c) => c.id) || [])
        .order("created_at", { ascending: false })

      if (assignmentsError) throw assignmentsError

      setCourses(coursesData || [])
      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async () => {
    try {
      const { error } = await supabase.from("assignments").insert([
        {
          ...newAssignment,
          due_date: newAssignment.due_date ? new Date(newAssignment.due_date).toISOString() : null,
        },
      ])

      if (error) throw error

      // Create notifications for enrolled students if published
      if (newAssignment.is_published) {
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("student_id")
          .eq("course_id", newAssignment.course_id)

        if (enrollments) {
          const notifications = enrollments.map((e) => ({
            user_id: e.student_id,
            title: "New Assignment Posted",
            message: `New assignment "${newAssignment.title}" has been posted`,
            type: "assignment",
            action_url: "/student",
          }))

          await supabase.from("notifications").insert(notifications)
        }
      }

      setNewAssignment({
        title: "",
        description: "",
        course_id: "",
        assignment_type: "homework",
        points_possible: 100,
        due_date: "",
        is_published: false,
      })
      setIsCreateDialogOpen(false)
      fetchData()
      alert("Assignment created successfully!")
    } catch (error) {
      console.error("Error creating assignment:", error)
      alert("Error creating assignment")
    }
  }

  const togglePublished = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("assignments")
        .update({ is_published: !currentStatus })
        .eq("id", assignmentId)

      if (error) throw error

      // If publishing, notify students
      if (!currentStatus) {
        const assignment = assignments.find((a) => a.id === assignmentId)
        if (assignment) {
          const { data: enrollments } = await supabase
            .from("course_enrollments")
            .select("student_id")
            .eq("course_id", assignment.course_id)

          if (enrollments) {
            const notifications = enrollments.map((e) => ({
              user_id: e.student_id,
              title: "Assignment Published",
              message: `Assignment "${assignment.title}" is now available`,
              type: "assignment",
              action_url: "/student",
            }))

            await supabase.from("notifications").insert(notifications)
          }
        }
      }

      fetchData()
    } catch (error) {
      console.error("Error updating assignment:", error)
    }
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (
      !confirm("Are you sure you want to delete this assignment? This will also delete all submissions and grades.")
    ) {
      return
    }

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", assignmentId)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error deleting assignment:", error)
    }
  }

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          users!inner(full_name, unique_id)
        `)
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
      setSelectedAssignment(assignmentId)
      setIsSubmissionsDialogOpen(true)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    }
  }

  const getSubmissionCount = (assignmentId: string) => {
    // This would be fetched from the database in a real implementation
    return Math.floor(Math.random() * 10) // Placeholder
  }

  if (loading) {
    return <div>Loading assignments...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Assignment Management</span>
              </CardTitle>
              <CardDescription>Create and manage assignments for your courses</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={courses.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>Create a new assignment for your students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignment-title">Assignment Title</Label>
                      <Input
                        id="assignment-title"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        placeholder="e.g., Chapter 5 Homework"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={newAssignment.course_id}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, course_id: value })}
                      >
                        <SelectTrigger>
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      placeholder="Assignment instructions and requirements"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newAssignment.assignment_type}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, assignment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homework">Homework</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points">Points Possible</Label>
                      <Input
                        id="points"
                        type="number"
                        value={newAssignment.points_possible}
                        onChange={(e) =>
                          setNewAssignment({ ...newAssignment, points_possible: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input
                        id="due-date"
                        type="datetime-local"
                        value={newAssignment.due_date}
                        onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publish"
                      checked={newAssignment.is_published}
                      onCheckedChange={(checked) =>
                        setNewAssignment({ ...newAssignment, is_published: checked as boolean })
                      }
                    />
                    <Label htmlFor="publish">Publish immediately (students can see it right away)</Label>
                  </div>

                  <Button
                    onClick={createAssignment}
                    className="w-full"
                    disabled={!newAssignment.title || !newAssignment.course_id}
                  >
                    Create Assignment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No courses assigned. Contact administration to get courses assigned.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>
                      {assignment.course?.name} - {assignment.course?.class_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {assignment.assignment_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{assignment.points_possible}</TableCell>
                    <TableCell>
                      {assignment.due_date ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.is_published ? "default" : "secondary"}>
                        {assignment.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => fetchSubmissions(assignment.id)}>
                        <Users className="h-4 w-4 mr-1" />
                        View ({getSubmissionCount(assignment.id)})
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublished(assignment.id, assignment.is_published)}
                          className="h-8 w-8 p-0"
                        >
                          {assignment.is_published ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAssignment(assignment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {assignments.length === 0 && courses.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No assignments created yet. Click "Create Assignment" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Dialog */}
      <Dialog open={isSubmissionsDialogOpen} onOpenChange={setIsSubmissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Submissions</DialogTitle>
            <DialogDescription>View and manage student submissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.student?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{submission.student?.unique_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{submission.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {submission.content && <p className="text-sm line-clamp-3">{submission.content}</p>}
                        {submission.file_url && (
                          <a href={submission.file_url} className="text-blue-600 hover:underline text-sm">
                            View File
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {submissions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No submissions yet for this assignment.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

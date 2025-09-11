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
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    course_id: "",
    assignment_type: "homework",
    points_possible: 100,
    due_date: "",
    is_published: false,
  })

  const [gradeForm, setGradeForm] = useState({
    points_earned: "",
    letter_grade: "",
    comments: "",
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
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const { error } = await supabase.from("assignments").insert([
        {
          school_id: schoolId,
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
      // Get current user's school_id from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const schoolId = currentUser.school_id

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          users!submissions_student_id_fkey(full_name, unique_id)
        `)
        .eq("assignment_id", assignmentId)
        .eq("school_id", schoolId)
        .order("submitted_at", { ascending: false })

      if (error) {
        console.error("Error fetching submissions:", error)
        throw error
      }
      
      console.log("Fetched submissions data:", data)
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

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // Get the public URL for the file
      const { data } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileUrl)
      
      if (data?.publicUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = data.publicUrl
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Fallback to download method if public URL doesn't work
        const { data: fileData, error } = await supabase.storage
          .from('submissions')
          .download(fileUrl)
        
        if (error) {
          console.error('Download error:', error)
          if (error.message.includes('Bucket not found')) {
            alert('File storage is not set up. Please contact your administrator.')
          } else {
            alert(`Failed to download file: ${error.message}`)
          }
          return
        }
        
        // Create a blob URL and trigger download
        const url = URL.createObjectURL(fileData)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file. Please try again.')
    }
  }

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeForm({
      points_earned: "",
      letter_grade: "",
      comments: "",
    })
    setIsGradingDialogOpen(true)
  }

  const submitGrade = async () => {
    if (!selectedSubmission || !selectedAssignment) return

    try {
      // Get current user's school_id from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const schoolId = currentUser.school_id

      const { error } = await supabase.from("grades").insert({
        school_id: schoolId,
        assignment_id: selectedAssignment,
        student_id: selectedSubmission.student_id,
        points_earned: parseInt(gradeForm.points_earned) || null,
        letter_grade: gradeForm.letter_grade || null,
        comments: gradeForm.comments || null,
        graded_by: currentUser.id,
      })

      if (error) {
        console.error("Error submitting grade:", error)
        alert("Failed to submit grade. Please try again.")
        return
      }

      // Update submission status to graded
      const { error: updateError } = await supabase
        .from("submissions")
        .update({ status: "graded" })
        .eq("id", selectedSubmission.id)

      if (updateError) {
        console.error("Error updating submission status:", updateError)
      }

      alert("Grade submitted successfully!")
      setIsGradingDialogOpen(false)
      setSelectedSubmission(null)
      
      // Refresh submissions to show updated status
      if (selectedAssignment) {
        fetchSubmissions(selectedAssignment)
      }
    } catch (error) {
      console.error("Error submitting grade:", error)
      alert("Failed to submit grade. Please try again.")
    }
  }

  if (loading) {
    return <div>Loading assignments...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Assignment Management</span>
              </CardTitle>
              <CardDescription className="text-sm">Create and manage assignments for your courses</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={courses.length === 0} className="w-full sm:w-auto">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Assignment</TableHead>
                    <TableHead className="hidden sm:table-cell">Course</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Points</TableHead>
                    <TableHead className="hidden xl:table-cell">Due Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Submissions</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
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
                          <div className="sm:hidden mt-2 space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {assignment.course?.name} - {assignment.course?.class_number}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {assignment.assignment_type}
                              </Badge>
                              <span className="text-xs">{assignment.points_possible} pts</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Badge variant={assignment.is_published ? "default" : "secondary"} className="text-xs">
                                {assignment.is_published ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {assignment.course?.name} - {assignment.course?.class_number}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {assignment.assignment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{assignment.points_possible}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {assignment.due_date ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={assignment.is_published ? "default" : "secondary"}>
                          {assignment.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                            title={assignment.is_published ? "Unpublish" : "Publish"}
                          >
                            {assignment.is_published ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAssignment(assignment.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="md:hidden">
                            <Button variant="outline" size="sm" onClick={() => fetchSubmissions(assignment.id)}>
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                {submissions.map((submission) => {
                  console.log("Rendering submission:", submission)
                  return (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.users?.full_name || 'Unknown Student'}</div>
                        <div className="text-sm text-muted-foreground">{submission.users?.unique_id || 'No ID'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{submission.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {submission.content && <p className="text-sm line-clamp-3">{submission.content}</p>}
                            {submission.attachments && submission.attachments.length > 0 && (
                              <div className="mt-1">
                                {submission.attachments.map((attachment, index) => (
                                  <button
                                    key={index}
                                    onClick={() => downloadFile(attachment.url, attachment.name)}
                                    className="text-blue-600 hover:underline text-sm block text-left"
                                  >
                                    📎 {attachment.name}
                                  </button>
                                ))}
                              </div>
                            )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openGradingDialog(submission)}
                      >
                        Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {submissions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No submissions yet for this assignment.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={isGradingDialogOpen} onOpenChange={setIsGradingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Assignment</DialogTitle>
            <DialogDescription>
              Grade the submission for {selectedSubmission?.users?.full_name || 'Student'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Student Information</h4>
              <p><strong>Name:</strong> {selectedSubmission?.users?.full_name || 'Unknown'}</p>
              <p><strong>ID:</strong> {selectedSubmission?.users?.unique_id || 'Unknown'}</p>
              <p><strong>Submitted:</strong> {selectedSubmission?.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleString() : 'Unknown'}</p>
            </div>

            {/* Submission Content */}
            {selectedSubmission?.content && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Student Response</h4>
                <p className="text-sm">{selectedSubmission.content}</p>
              </div>
            )}

            {/* File Attachments */}
            {selectedSubmission?.attachments && selectedSubmission.attachments.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2">File Attachments</h4>
                <div className="space-y-1">
                  {selectedSubmission.attachments.map((attachment, index) => (
                    <button
                      key={index}
                      onClick={() => downloadFile(attachment.url, attachment.name)}
                      className="text-blue-600 hover:underline text-sm block"
                    >
                      📎 {attachment.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grading Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points-earned">Points Earned</Label>
                  <Input
                    id="points-earned"
                    type="number"
                    value={gradeForm.points_earned}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, points_earned: e.target.value }))}
                    placeholder="e.g., 85"
                  />
                </div>
                <div>
                  <Label htmlFor="letter-grade">Letter Grade</Label>
                  <Select
                    value={gradeForm.letter_grade}
                    onValueChange={(value) => setGradeForm(prev => ({ ...prev, letter_grade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="C+">C+</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C-">C-</SelectItem>
                      <SelectItem value="D+">D+</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={gradeForm.comments}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Add feedback for the student..."
                  rows={4}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsGradingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitGrade}>
                Submit Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

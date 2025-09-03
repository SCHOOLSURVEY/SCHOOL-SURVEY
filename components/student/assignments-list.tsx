"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Calendar, FileText, CheckCircle, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Assignment {
  id: string
  title: string
  description: string
  assignment_type: string
  points_possible: number
  due_date: string | null
  created_at: string
  course: {
    name: string
    class_number: string
    teacher: {
      full_name: string
    }
  }
}

interface Submission {
  id: string
  content: string
  file_url: string | null
  submitted_at: string
  status: string
}

interface StudentAssignmentsProps {
  studentId: string
}

export function StudentAssignmentsList({ studentId }: StudentAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissionContent, setSubmissionContent] = useState("")
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [studentId])

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get student's enrolled courses
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", studentId)

      if (enrollmentError) {
        console.error("Error fetching enrollments:", enrollmentError)
        setError("Failed to fetch your course enrollments. Please try again.")
        return
      }

      if (!enrollments || enrollments.length === 0) {
        console.log("No course enrollments found for student")
        setLoading(false)
        return
      }

      const courseIds = enrollments.map((e) => e.course_id)

      // Get published assignments for enrolled courses
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          description,
          assignment_type,
          points_possible,
          due_date,
          created_at,
          courses!inner(
            name,
            class_number,
            teacher_id,
            users!inner(full_name)
          )
        `)
        .in("course_id", courseIds)
        .eq("is_published", true)
        .order("due_date", { ascending: true, nullsLast: true })

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError)
        setError("Failed to fetch assignments. Please try again.")
        return
      }

      // Format the assignments data to match our interface
      const formattedAssignments =
        assignmentsData?.map((assignment) => ({
          ...assignment,
          course: {
            ...assignment.course,
            teacher: {
              full_name: assignment.course.users.full_name,
            },
          },
        })) || []

      // Get existing submissions for these assignments
      const assignmentIds = assignmentsData?.map((a) => a.id) || []
      if (assignmentIds.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("submissions")
          .select("*")
          .in("assignment_id", assignmentIds)
          .eq("student_id", studentId)

        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError)
        } else {
          const submissionsMap =
            submissionsData?.reduce(
              (acc, sub) => {
                acc[sub.assignment_id] = sub
                return acc
              },
              {} as Record<string, Submission>,
            ) || {}
          setSubmissions(submissionsMap)
        }
      }

      setAssignments(formattedAssignments)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const submitAssignment = async () => {
    if (!selectedAssignment || (!submissionContent.trim() && !submissionFile)) {
      alert("Please provide either text content or upload a file")
      return
    }

    setSubmitting(true)
    setSubmitSuccess(false)
    try {
      let fileUrl = null

      // Handle file upload if there's a file
      if (submissionFile) {
        const fileExt = submissionFile.name.split(".").pop()
        const fileName = `${studentId}/${selectedAssignment.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("submissions")
          .upload(fileName, submissionFile)

        if (uploadError) {
          console.error("File upload error:", uploadError)
          alert("Failed to upload file. Please try again.")
          return
        }

        const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(uploadData.path)

        fileUrl = urlData.publicUrl
      }

      // Create submission record
      const { error: submissionError } = await supabase.from("submissions").insert({
        assignment_id: selectedAssignment.id,
        student_id: studentId,
        content: submissionContent.trim() || null,
        file_url: fileUrl,
        status: "submitted",
      })

      if (submissionError) {
        console.error("Submission error:", submissionError)
        alert("Failed to submit assignment. Please try again.")
        return
      }

      // Reset form and close dialog
      setSubmissionContent("")
      setSubmissionFile(null)
      setSubmitSuccess(true)

      // Refresh assignments to show new submission
      fetchAssignments()

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setIsSubmitDialogOpen(false)
        setSelectedAssignment(null)
      }, 1500)
    } catch (error) {
      console.error("Error submitting assignment:", error)
      alert("Failed to submit assignment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setSubmissionContent("")
    setSubmissionFile(null)
    setSubmitSuccess(false)
    setIsSubmitDialogOpen(true)
  }

  const getStatusBadge = (assignment: Assignment) => {
    const submission = submissions[assignment.id]
    const now = new Date()
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null

    if (submission) {
      return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
    } else if (dueDate && now > dueDate) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (dueDate && now > new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
    } else {
      return <Badge variant="outline">Pending</Badge>
    }
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date"
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day(s)`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else {
      return `Due in ${diffDays} day(s)`
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading assignments...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>My Assignments</span>
          </CardTitle>
          <CardDescription>View and submit your assignments from all enrolled courses</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments available at this time.</p>
              <p className="text-sm">Check back later or contact your teacher if you think this is an error.</p>
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
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {assignment.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.course.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.course.class_number} • {assignment.course.teacher.full_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {assignment.assignment_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{assignment.points_possible} pts</TableCell>
                    <TableCell>
                      {assignment.due_date ? (
                        <div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{new Date(assignment.due_date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{formatDueDate(assignment.due_date)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment)}</TableCell>
                    <TableCell>
                      {submissions[assignment.id] ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Submitted</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openSubmitDialog(assignment)}
                          className="flex items-center space-x-1"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Submit</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment && (
                <>
                  Submit your work for "{selectedAssignment.title}"
                  {selectedAssignment.due_date && (
                    <span className="block mt-1 text-sm">
                      Due: {new Date(selectedAssignment.due_date).toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {submitSuccess ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Assignment submitted successfully!</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="submission-content">Written Response (Optional)</Label>
                  <Textarea
                    id="submission-content"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submission-file">Upload File (Optional)</Label>
                  <Input
                    id="submission-file"
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: PDF, Word documents, text files, images
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={submitAssignment}
                    disabled={submitting || (!submissionContent.trim() && !submissionFile)}
                  >
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { DatabaseService } from "@/lib/database-client"
import { Calendar, FileText, CheckCircle, Upload, AlertCircle, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUpload } from "@/components/shared/file-upload"

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
  attachments: Array<{
    name: string
    url: string
    size: number
    type: string
  }> | null
  submitted_at: string
  status: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
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
        setLoading(false)
        return
      }

      const courseIds = enrollments.map((e) => e.course_id)

      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

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
            teacher_id
          )
        `)
        .eq("school_id", schoolId)
        .in("course_id", courseIds)
        .eq("is_published", true)
        .order("due_date", { ascending: true, nullsLast: true })

      if (assignmentsError) {
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
              full_name: "Teacher", // We'll fetch teacher names separately if needed
            },
          },
        })) || []

      // Get existing submissions for these assignments
      const assignmentIds = assignmentsData?.map((a) => a.id) || []
      if (assignmentIds.length > 0) {
        // Get current user's school_id from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        const schoolId = currentUser.school_id

        const { data: submissionsData, error: submissionsError } = await supabase
          .from("submissions")
          .select("*")
          .in("assignment_id", assignmentIds)
          .eq("student_id", studentId)
          .eq("school_id", schoolId)

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
    if (!selectedAssignment || (!submissionContent.trim() && uploadedFiles.length === 0)) {
      alert("Please provide either text content or upload a file")
      return
    }

    setSubmitting(true)
    setSubmitSuccess(false)
    try {
      // Create submission record with file attachments
      const fileAttachments = uploadedFiles.map(file => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type
      }))
      
      // Get current user's school_id from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const schoolId = currentUser.school_id

      if (!schoolId) {
        alert("Unable to determine school. Please log out and log back in.")
        return
      }

      const { error: submissionError } = await supabase.from("submissions").insert({
        assignment_id: selectedAssignment.id,
        student_id: studentId,
        school_id: schoolId,
        content: submissionContent.trim() || null,
        attachments: fileAttachments.length > 0 ? fileAttachments : null,
        status: "submitted",
      })

      if (submissionError) {
        console.error("Submission error:", submissionError)
        console.error("Submission data:", {
          assignment_id: selectedAssignment.id,
          student_id: studentId,
          school_id: schoolId,
          content: submissionContent.trim() || null,
          attachments: fileAttachments.length > 0 ? fileAttachments : null,
          status: "submitted",
        })
        alert(`Failed to submit assignment: ${submissionError.message || 'Unknown error'}`)
        return
      }

      // Reset form and close dialog
      setSubmissionContent("")
      setUploadedFiles([])
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
    setUploadedFiles([])
    setSubmitSuccess(false)
    setIsSubmitDialogOpen(true)
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
                    <TableHead className="min-w-[120px]">Actions</TableHead>
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
                          <div className="sm:hidden mt-2 space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {assignment.course.name} • {assignment.course.class_number}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {assignment.assignment_type}
                              </Badge>
                              <span className="text-xs">{assignment.points_possible} pts</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getStatusBadge(assignment)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div>
                          <div className="font-medium">{assignment.course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.course.class_number} • {assignment.course.teacher.full_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {assignment.assignment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{assignment.points_possible} pts</TableCell>
                      <TableCell className="hidden xl:table-cell">
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
                      <TableCell className="hidden lg:table-cell">{getStatusBadge(assignment)}</TableCell>
                      <TableCell>
                        {submissions[assignment.id] ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 hidden sm:inline">Submitted</span>
                            {submissions[assignment.id].attachments && submissions[assignment.id].attachments!.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  submissions[assignment.id].attachments!.forEach((attachment) => {
                                    downloadFile(attachment.url, attachment.name)
                                  })
                                }}
                                className="ml-2"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openSubmitDialog(assignment)}
                            className="flex items-center space-x-1 w-full sm:w-auto"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Submit</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                {/* Show previous submission if exists */}
                {selectedAssignment && submissions[selectedAssignment.id] && (
                  <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Label className="text-green-800 font-medium">Previous Submission</Label>
                    </div>
                    {submissions[selectedAssignment.id].content && (
                      <div className="text-sm text-green-700">
                        <strong>Response:</strong> {submissions[selectedAssignment.id].content}
                      </div>
                    )}
                    {submissions[selectedAssignment.id].attachments && submissions[selectedAssignment.id].attachments!.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-700"><strong>Files:</strong></span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            submissions[selectedAssignment.id].attachments!.forEach((attachment) => {
                              downloadFile(attachment.url, attachment.name)
                            })
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download Files
                        </Button>
                      </div>
                    )}
                    <div className="text-xs text-green-600">
                      Submitted: {new Date(submissions[selectedAssignment.id].submitted_at).toLocaleString()}
                    </div>
                  </div>
                )}

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
                  <Label>Upload Files (Optional)</Label>
                  <FileUpload
                    onUploadComplete={(files) => setUploadedFiles(prev => [...prev, ...files])}
                    onUploadError={(error) => alert(error)}
                    maxFiles={5}
                    maxSize={10}
                    acceptedTypes={["image/*", "application/pdf", ".doc", ".docx", ".txt", ".zip", ".rar"]}
                    bucket="submissions"
                    folder={`${studentId}/${selectedAssignment?.id}`}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={submitAssignment}
                    disabled={submitting || (!submissionContent.trim() && uploadedFiles.length === 0)}
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

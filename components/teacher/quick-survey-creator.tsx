"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatabaseService } from "@/lib/database-client"

interface Course {
  id: string
  name: string
  class_number: string
  subjects: { name: string }
}

interface QuickSurveyCreatorProps {
  teacherId: string
  onSurveyCreated: () => void
}

export function QuickSurveyCreator({ teacherId, onSurveyCreated }: QuickSurveyCreatorProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    course_id: "",
    survey_type: "weekly",
  })

  useEffect(() => {
    fetchTeacherCourses()
  }, [teacherId])

  const fetchTeacherCourses = async () => {
    try {
      console.log("Fetching courses for teacher:", teacherId)

      const { data, error } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          class_number,
          subjects!inner(name)
        `)
        .eq("teacher_id", teacherId)

      if (error) {
        console.error("Error fetching courses:", error)
        setError(`Failed to fetch courses: ${error.message}`)
        return
      }

      console.log("Fetched courses:", data)
      setCourses(data || [])

      if (!data || data.length === 0) {
        setError("No courses found. Please make sure you have courses assigned.")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError("Failed to fetch courses. Please try again.")
    }
  }

  const createQuickSurvey = async () => {
    if (!newSurvey.course_id) {
      setError("Please select a course")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Creating survey with data:", newSurvey)

      const closesAt = new Date()
      closesAt.setDate(closesAt.getDate() + 7) // Default 7 days

      const surveyData = {
        title: newSurvey.title || `${newSurvey.survey_type} Feedback`,
        description: newSurvey.description || "Please rate your learning experience",
        course_id: newSurvey.course_id,
        survey_type: newSurvey.survey_type,
        status: "active",
        closes_at: closesAt.toISOString(),
      }

      console.log("Survey data to insert:", surveyData)

      // Try to create survey with service role bypass if needed
      const { data: survey, error } = await supabase.from("surveys").insert([surveyData]).select().single()

      if (error) {
        console.error("Survey creation error:", error)
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        // Handle specific RLS recursion error
        if (error.message.includes("infinite recursion") || error.message.includes("user_profiles")) {
          throw new Error(
            "Database permission error. Please contact your administrator to fix the user profile policies.",
          )
        }

        throw new Error(`Failed to create survey: ${error.message}`)
      }

      console.log("Survey created successfully:", survey)

      // Add default questions
      const defaultQuestions = [
        {
          survey_id: survey.id,
          question_text: "How well did you understand the material taught?",
          question_type: "rating",
          order_number: 1,
        },
        {
          survey_id: survey.id,
          question_text: "How would you rate the teaching style and clarity?",
          question_type: "rating",
          order_number: 2,
        },
        {
          survey_id: survey.id,
          question_text: "Any additional feedback or suggestions?",
          question_type: "text",
          order_number: 3,
        },
      ]

      console.log("Adding default questions:", defaultQuestions)

      const { error: questionsError } = await supabase.from("survey_questions").insert(defaultQuestions)

      if (questionsError) {
        console.error("Questions creation error:", questionsError)
        console.error("Questions error details:", {
          message: questionsError.message,
          details: questionsError.details,
          hint: questionsError.hint,
          code: questionsError.code,
        })
        throw new Error(`Failed to create survey questions: ${questionsError.message}`)
      }

      console.log("Survey and questions created successfully")

      // Reset form
      setNewSurvey({ title: "", description: "", course_id: "", survey_type: "weekly" })
      setSuccess("Survey created successfully!")
      onSurveyCreated()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error creating survey:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Test database connection
  const testConnection = async () => {
    try {
      console.log("Testing database connection...")
      const { data, error } = await supabase.from("surveys").select("count", { count: "exact", head: true })

      if (error) {
        console.error("Database connection test failed:", error)
        setError(`Database connection failed: ${error.message}`)
      } else {
        console.log("Database connection successful")
        setSuccess("Database connection is working")
        setTimeout(() => setSuccess(""), 2000)
      }
    } catch (error) {
      console.error("Connection test error:", error)
      setError("Failed to test database connection")
    }
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>SchoolSurvey Creator</CardTitle>
          <CardDescription>Create a feedback survey for your students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-title">Survey Title (optional)</Label>
            <Input
              id="quick-title"
              value={newSurvey.title}
              onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
              placeholder="Leave empty for default title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-description">Description (optional)</Label>
            <Textarea
              id="quick-description"
              value={newSurvey.description}
              onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
              placeholder="Leave empty for default description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-course">Course</Label>
              <Select
                value={newSurvey.course_id}
                onValueChange={(value) => setNewSurvey({ ...newSurvey, course_id: value })}
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

            <div className="space-y-2">
              <Label htmlFor="quick-type">Type</Label>
              <Select
                value={newSurvey.survey_type}
                onValueChange={(value) => setNewSurvey({ ...newSurvey, survey_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="term">Term</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createQuickSurvey} className="flex-1" disabled={loading || !newSurvey.course_id}>
              {loading ? "Creating..." : "Create Survey"}
            </Button>

            <Button variant="outline" onClick={testConnection} disabled={loading}>
              Test DB
            </Button>
          </div>

          {courses.length === 0 && !error && (
            <p className="text-sm text-gray-500 text-center">
              No courses available. Please contact your administrator.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

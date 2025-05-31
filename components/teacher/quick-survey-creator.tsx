"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

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
      const { data, error } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          class_number,
          subjects!inner(name)
        `)
        .eq("teacher_id", teacherId)

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const createQuickSurvey = async () => {
    if (!newSurvey.course_id) return

    setLoading(true)
    try {
      const closesAt = new Date()
      closesAt.setDate(closesAt.getDate() + 7) // Default 7 days

      const { data: survey, error } = await supabase
        .from("surveys")
        .insert([
          {
            title: newSurvey.title || `${newSurvey.survey_type} Feedback`,
            description: newSurvey.description || "Please rate your learning experience",
            course_id: newSurvey.course_id,
            survey_type: newSurvey.survey_type,
            status: "active",
            closes_at: closesAt.toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

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

      const { error: questionsError } = await supabase.from("survey_questions").insert(defaultQuestions)

      if (questionsError) throw questionsError

      setNewSurvey({ title: "", description: "", course_id: "", survey_type: "weekly" })
      onSurveyCreated()
      alert("Survey created successfully!")
    } catch (error) {
      console.error("Error creating survey:", error)
      alert("Error creating survey")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Survey Creator</CardTitle>
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
        <Button onClick={createQuickSurvey} className="w-full" disabled={loading || !newSurvey.course_id}>
          {loading ? "Creating..." : "Create Survey"}
        </Button>
      </CardContent>
    </Card>
  )
}

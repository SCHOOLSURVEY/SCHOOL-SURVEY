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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatabaseService } from "@/lib/database-client"
import { Plus, Trash2, Edit, Eye, Users } from "lucide-react"

interface Survey {
  id: string
  title: string
  description: string
  survey_type: string
  status: string
  created_at: string
  closes_at: string
  courses: {
    name: string
    class_number: string
    subjects: { name: string }
  }
}

interface Course {
  id: string
  name: string
  class_number: string
  subjects: { name: string }
}

interface SurveyQuestion {
  id: string
  question_text: string
  question_type: string
  options: any
  order_number: number
}

export function SurveyManager() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])

  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    course_id: "",
    survey_type: "weekly",
    closes_in_days: 7,
  })

  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "rating",
    options: [],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch surveys with course data
      const { data: surveysData, error: surveysError } = await supabase
        .from("surveys")
        .select(`
          *,
          courses!inner(
            name,
            class_number,
            subjects!inner(name)
          )
        `)
        .order("created_at", { ascending: false })

      if (surveysError) throw surveysError

      // Fetch courses for dropdown
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          class_number,
          subjects!inner(name)
        `)
        .order("name")

      if (coursesError) throw coursesError

      setSurveys(surveysData || [])
      setCourses(coursesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSurvey = async () => {
    try {
      const closesAt = new Date()
      closesAt.setDate(closesAt.getDate() + newSurvey.closes_in_days)

      const { data: survey, error } = await supabase
        .from("surveys")
        .insert([
          {
            title: newSurvey.title,
            description: newSurvey.description,
            course_id: newSurvey.course_id,
            survey_type: newSurvey.survey_type,
            status: "active",
            closes_at: closesAt.toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Add default questions based on survey type
      const defaultQuestions = getDefaultQuestions(survey.id, newSurvey.survey_type)

      const { error: questionsError } = await supabase.from("survey_questions").insert(defaultQuestions)

      if (questionsError) throw questionsError

      setNewSurvey({ title: "", description: "", course_id: "", survey_type: "weekly", closes_in_days: 7 })
      setIsCreateDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error creating survey:", error)
      alert("Error creating survey")
    }
  }

  const getDefaultQuestions = (surveyId: string, surveyType: string) => {
    const baseQuestions = [
      {
        survey_id: surveyId,
        question_text: "How well did you understand the material covered?",
        question_type: "rating",
        order_number: 1,
      },
      {
        survey_id: surveyId,
        question_text: "How would you rate the teaching style and clarity?",
        question_type: "rating",
        order_number: 2,
      },
      {
        survey_id: surveyId,
        question_text: "How engaging was the lesson?",
        question_type: "rating",
        order_number: 3,
      },
    ]

    if (surveyType === "term" || surveyType === "semester") {
      baseQuestions.push(
        {
          survey_id: surveyId,
          question_text: "How much did you learn in this course overall?",
          question_type: "rating",
          order_number: 4,
        },
        {
          survey_id: surveyId,
          question_text: "Would you recommend this course to other students?",
          question_type: "multiple_choice",
          order_number: 5,
        },
      )
    }

    baseQuestions.push({
      survey_id: surveyId,
      question_text: "Any additional feedback or suggestions for improvement?",
      question_type: "text",
      order_number: baseQuestions.length + 1,
    })

    return baseQuestions
  }

  const fetchQuestions = async (surveyId: string) => {
    try {
      const { data, error } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", surveyId)
        .order("order_number")

      if (error) throw error
      setQuestions(data || [])
      setSelectedSurvey(surveyId)
      setIsQuestionsDialogOpen(true)
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  const addQuestion = async () => {
    if (!selectedSurvey || !newQuestion.question_text) return

    try {
      const { error } = await supabase.from("survey_questions").insert([
        {
          survey_id: selectedSurvey,
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          options: newQuestion.question_type === "multiple_choice" ? newQuestion.options : null,
          order_number: questions.length + 1,
        },
      ])

      if (error) throw error

      setNewQuestion({ question_text: "", question_type: "rating", options: [] })
      fetchQuestions(selectedSurvey)
    } catch (error) {
      console.error("Error adding question:", error)
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm("Are you sure you want to delete this survey? This will also delete all responses.")) {
      return
    }

    try {
      const { error } = await supabase.from("surveys").delete().eq("id", surveyId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error deleting survey:", error)
    }
  }

  const toggleSurveyStatus = async (surveyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active"

    try {
      const { error } = await supabase.from("surveys").update({ status: newStatus }).eq("id", surveyId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error("Error updating survey status:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Closed</Badge>
    )
  }

  if (loading) {
    return <div>Loading surveys...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Survey Management</CardTitle>
              <CardDescription>Create and manage student feedback surveys</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={courses.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Survey</DialogTitle>
                  <DialogDescription>Create a feedback survey for students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="survey-title">Survey Title</Label>
                    <Input
                      id="survey-title"
                      value={newSurvey.title}
                      onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                      placeholder="e.g., Weekly Teaching Evaluation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="survey-description">Description</Label>
                    <Textarea
                      id="survey-description"
                      value={newSurvey.description}
                      onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                      placeholder="Brief description of the survey purpose"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
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
                            {course.name} - {course.class_number} ({course.subjects.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="survey-type">Type</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="closes-in">Closes in (days)</Label>
                      <Input
                        id="closes-in"
                        type="number"
                        min="1"
                        value={newSurvey.closes_in_days}
                        onChange={(e) =>
                          setNewSurvey({ ...newSurvey, closes_in_days: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={createSurvey} className="w-full" disabled={!newSurvey.title || !newSurvey.course_id}>
                    Create Survey
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No courses available. Please create courses first before adding surveys.</p>
            </div>
          )}
          {courses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Survey Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closes</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.title}</TableCell>
                    <TableCell>
                      {survey.courses.name} - {survey.courses.class_number}
                      <br />
                      <span className="text-xs text-muted-foreground">{survey.courses.subjects.name}</span>
                    </TableCell>
                    <TableCell className="capitalize">{survey.survey_type}</TableCell>
                    <TableCell>{getStatusBadge(survey.status)}</TableCell>
                    <TableCell>{new Date(survey.closes_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>0</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchQuestions(survey.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSurveyStatus(survey.id, survey.status)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSurvey(survey.id)}
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
          {surveys.length === 0 && courses.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No surveys created yet. Click "Create Survey" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Dialog */}
      <Dialog open={isQuestionsDialogOpen} onOpenChange={setIsQuestionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Survey Questions</DialogTitle>
            <DialogDescription>View and manage questions for this survey</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((question, index) => (
              <div key={question.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">
                      {index + 1}. {question.question_text}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">Type: {question.question_type}</p>
                    {question.options && (
                      <div className="text-xs text-muted-foreground mt-1">Options: {question.options.join(", ")}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add new question form */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add New Question</h4>
              <div className="space-y-3">
                <Input
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Enter question text"
                />
                <Select
                  value={newQuestion.question_type}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating (1-5)</SelectItem>
                    <SelectItem value="text">Text Response</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addQuestion} disabled={!newQuestion.question_text}>
                  Add Question
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

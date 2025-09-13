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
import { DatabaseService } from "@/lib/database-client"
import { Plus, Trash2, Eye, Play, Pause } from "lucide-react"

interface Survey {
  _id: string
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
  _id: string
  name: string
  class_number: string
  subjects: { name: string }
  users: { full_name: string }
}

interface SurveyQuestion {
  _id: string
  question_text: string
  question_type: string
  options: any
  order_number: number
}

export function EnhancedSurveyCreator() {
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
    auto_activate: true,
  })

  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "rating",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
  })

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

      // Fetch surveys and courses using MongoDB
      const [surveysData, coursesData] = await Promise.all([
        DatabaseService.getSurveysBySchool(schoolId),
        DatabaseService.getCoursesBySchool(schoolId)
      ])

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
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const closesAt = new Date()
      closesAt.setDate(closesAt.getDate() + newSurvey.closes_in_days)

      const survey = await DatabaseService.createSurvey({
        school_id: schoolId,
        created_by: currentUser._id,
        title: newSurvey.title,
        description: newSurvey.description,
        course_id: newSurvey.course_id,
        survey_type: newSurvey.survey_type,
        status: newSurvey.auto_activate ? "active" : "draft",
        closes_at: closesAt.toISOString(),
      })

      // Add comprehensive default questions
      const defaultQuestions = getComprehensiveQuestions(survey._id, newSurvey.survey_type)
      await DatabaseService.createSurveyQuestions(defaultQuestions)

      setNewSurvey({
        title: "",
        description: "",
        course_id: "",
        survey_type: "weekly",
        closes_in_days: 7,
        auto_activate: true,
      })
      setIsCreateDialogOpen(false)
      fetchData()
      alert(`Survey "${survey.title}" created successfully and is now ${newSurvey.auto_activate ? "active" : "draft"}!`)
    } catch (error) {
      console.error("Error creating survey:", error)
      alert("Error creating survey: " + error.message)
    }
  }

  const getComprehensiveQuestions = (surveyId: string, surveyType: string) => {
    const questions = [
      {
        survey_id: surveyId,
        question_text: "How clearly did the teacher explain the concepts?",
        question_type: "rating",
        order_number: 1,
      },
      {
        survey_id: surveyId,
        question_text: "How well did you understand the material covered?",
        question_type: "rating",
        order_number: 2,
      },
      {
        survey_id: surveyId,
        question_text: "How engaging was the teaching style?",
        question_type: "rating",
        order_number: 3,
      },
      {
        survey_id: surveyId,
        question_text: "How would you rate the pace of the lesson?",
        question_type: "multiple_choice",
        order_number: 4,
        options: JSON.stringify(["Too slow", "Just right", "Too fast"]),
      },
      {
        survey_id: surveyId,
        question_text: "How helpful were the examples and demonstrations?",
        question_type: "rating",
        order_number: 5,
      },
    ]

    if (surveyType === "term" || surveyType === "semester") {
      questions.push(
        {
          survey_id: surveyId,
          question_text: "How much did you learn overall in this course?",
          question_type: "rating",
          order_number: 6,
        },
        {
          survey_id: surveyId,
          question_text: "Would you recommend this course to other students?",
          question_type: "multiple_choice",
          order_number: 7,
          options: JSON.stringify(["Definitely yes", "Probably yes", "Unsure", "Probably no", "Definitely no"]),
        },
        {
          survey_id: surveyId,
          question_text: "What did you like most about this course?",
          question_type: "text",
          order_number: 8,
        },
      )
    }

    questions.push({
      survey_id: surveyId,
      question_text: "Any additional feedback or suggestions for improvement?",
      question_type: "text",
      order_number: questions.length + 1,
    })

    return questions
  }

  const createQuickSurvey = async (courseId: string, courseName: string) => {
    try {
      // Get current user's school_id and user_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const closesAt = new Date()
      closesAt.setDate(closesAt.getDate() + 7) // 7 days from now

      const survey = await DatabaseService.createSurvey({
        school_id: schoolId,
        created_by: currentUser._id,
        title: `Weekly Feedback - ${courseName}`,
        description: "Please rate your learning experience this week",
        course_id: courseId,
        survey_type: "weekly",
        status: "active",
        closes_at: closesAt.toISOString(),
      })

      // Add quick questions
      const quickQuestions = [
        {
          survey_id: survey._id,
          question_text: "How well did you understand this week's material?",
          question_type: "rating",
          order_number: 1,
        },
        {
          survey_id: survey.id,
          question_text: "How engaging were the lessons this week?",
          question_type: "rating",
          order_number: 2,
        },
        {
          survey_id: survey.id,
          question_text: "Any feedback for this week?",
          question_type: "text",
          order_number: 3,
        },
      ]

      await DatabaseService.createSurveyQuestions(quickQuestions)

      fetchData()
      alert("Quick survey created and activated!")
    } catch (error) {
      console.error("Error creating quick survey:", error)
      alert("Error creating quick survey")
    }
  }

  const fetchQuestions = async (surveyId: string) => {
    try {
      const data = await DatabaseService.getSurveyQuestions(surveyId)
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
      await DatabaseService.createSurveyQuestions([{
        survey_id: selectedSurvey,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: newQuestion.question_type === "multiple_choice" ? JSON.stringify(newQuestion.options) : null,
        order_number: questions.length + 1,
      }])

      setNewQuestion({
        question_text: "",
        question_type: "rating",
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
      })
      fetchQuestions(selectedSurvey)
    } catch (error) {
      console.error("Error adding question:", error)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return

    try {
      await DatabaseService.deleteSurveyQuestion(questionId)
      if (selectedSurvey) {
        fetchQuestions(selectedSurvey)
      }
    } catch (error) {
      console.error("Error deleting question:", error)
    }
  }

  const toggleSurveyStatus = async (surveyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active"

    try {
      await DatabaseService.updateSurvey(surveyId, { status: newStatus })
      fetchData()
      alert(`Survey ${newStatus === "active" ? "activated" : "closed"} successfully!`)
    } catch (error) {
      console.error("Error updating survey status:", error)
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm("Are you sure you want to delete this survey? This will also delete all responses.")) {
      return
    }

    try {
      await DatabaseService.deleteSurvey(surveyId)
      fetchData()
    } catch (error) {
      console.error("Error deleting survey:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return <div>Loading surveys...</div>
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>SchoolSurvey Quick Creation</CardTitle>
          <CardDescription>Create surveys instantly for any course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{course.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Class {course.class_number} • {course.subjects.name}
                    <br />
                    Teacher: {course.users.full_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button size="sm" className="w-full" onClick={() => createQuickSurvey(course.id, course.name)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Quick Survey
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Survey Creator */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>SchoolSurvey Advanced Management</CardTitle>
              <CardDescription>Create detailed surveys with custom questions and settings</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={courses.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Detailed Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Survey</DialogTitle>
                  <DialogDescription>Create a detailed feedback survey for students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="survey-title">Survey Title</Label>
                    <Input
                      id="survey-title"
                      value={newSurvey.title}
                      onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                      placeholder="e.g., Mid-term Teaching Evaluation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="survey-description">Description</Label>
                    <Textarea
                      id="survey-description"
                      value={newSurvey.description}
                      onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                      placeholder="Brief description of the survey purpose"
                      rows={3}
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-activate"
                      checked={newSurvey.auto_activate}
                      onCheckedChange={(checked) => setNewSurvey({ ...newSurvey, auto_activate: checked as boolean })}
                    />
                    <Label htmlFor="auto-activate" className="text-sm">
                      Activate survey immediately (students can see it right away)
                    </Label>
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
                  <TableHead>Questions</TableHead>
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
                      <Button variant="outline" size="sm" onClick={() => fetchQuestions(survey.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSurveyStatus(survey.id, survey.status)}
                          className="h-8 w-8 p-0"
                        >
                          {survey.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
              No surveys created yet. Use the quick survey buttons above or create a detailed survey.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Dialog */}
      <Dialog open={isQuestionsDialogOpen} onOpenChange={setIsQuestionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Questions</DialogTitle>
            <DialogDescription>View and manage questions for this survey</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {question.question_text}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        Type: {question.question_type.replace("_", " ")}
                      </p>
                      {question.options && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <strong>Options:</strong> {JSON.parse(question.options).join(", ")}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

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
                    <SelectItem value="rating">Rating (1-5 scale)</SelectItem>
                    <SelectItem value="text">Text Response</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
                {newQuestion.question_type === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Options (one per line)</Label>
                    <Textarea
                      value={newQuestion.options.join("\n")}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          options: e.target.value.split("\n").filter((o) => o.trim()),
                        })
                      }
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      rows={4}
                    />
                  </div>
                )}
                <Button onClick={addQuestion} disabled={!newQuestion.question_text}>
                  <Plus className="h-4 w-4 mr-2" />
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

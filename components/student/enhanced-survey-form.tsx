"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import type { Survey, SurveyQuestion } from "@/lib/types"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"

interface EnhancedSurveyFormProps {
  survey: Survey
  studentId: string
  onComplete: () => void
}

export function EnhancedSurveyForm({ survey, studentId, onComplete }: EnhancedSurveyFormProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [survey.id])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", survey.id)
        .order("order_number")

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const responseData = Object.entries(responses).map(([questionId, value]) => ({
        school_id: schoolId,
        survey_id: survey.id,
        student_id: studentId,
        question_id: questionId,
        response_value: value,
      }))

      const { error } = await supabase.from("survey_responses").insert(responseData)

      if (error) throw error

      setSubmitted(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (error) {
      console.error("Error submitting survey:", error)
      alert("Error submitting survey. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully. Your input helps improve the learning experience.
              </p>
              <div className="text-sm text-muted-foreground">Redirecting to dashboard...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const canProceed = currentQuestion && responses[currentQuestion.id]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const allQuestionsAnswered = questions.every((q) => responses[q.id])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{survey.title}</CardTitle>
              <CardDescription>{survey.description}</CardDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardHeader>
            <CardContent>
              {currentQuestion && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-medium">{currentQuestion.question_text}</Label>
                  </div>

                  {currentQuestion.question_type === "rating" && (
                    <RadioGroup
                      value={responses[currentQuestion.id] || ""}
                      onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="flex items-center space-x-3">
                          <RadioGroupItem value={rating.toString()} id={`${currentQuestion.id}-${rating}`} />
                          <Label htmlFor={`${currentQuestion.id}-${rating}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span>{rating}</span>
                              <span className="text-sm text-muted-foreground">
                                {rating === 1
                                  ? "Poor"
                                  : rating === 2
                                    ? "Fair"
                                    : rating === 3
                                      ? "Good"
                                      : rating === 4
                                        ? "Very Good"
                                        : "Excellent"}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.question_type === "text" && (
                    <Textarea
                      value={responses[currentQuestion.id] || ""}
                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                      placeholder="Enter your response..."
                      rows={4}
                      className="w-full"
                    />
                  )}

                  {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
                    <RadioGroup
                      value={responses[currentQuestion.id] || ""}
                      onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {JSON.parse(currentQuestion.options).map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                          <Label htmlFor={`${currentQuestion.id}-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  <div className="flex justify-between pt-6 border-t">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    {isLastQuestion ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || !allQuestionsAnswered}
                        className="min-w-24"
                      >
                        {submitting ? "Submitting..." : "Submit Survey"}
                      </Button>
                    ) : (
                      <Button onClick={handleNext} disabled={!canProceed}>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

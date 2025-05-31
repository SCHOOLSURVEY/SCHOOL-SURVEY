"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import type { Survey, SurveyQuestion } from "@/lib/types"
import { ArrowLeft } from "lucide-react"

interface SurveyFormProps {
  survey: Survey
  studentId: string
  onComplete: () => void
}

export function SurveyForm({ survey, studentId, onComplete }: SurveyFormProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const responseData = Object.entries(responses).map(([questionId, value]) => ({
        survey_id: survey.id,
        student_id: studentId,
        question_id: questionId,
        response_value: value,
      }))

      const { error } = await supabase.from("survey_responses").insert(responseData)

      if (error) throw error
      onComplete()
    } catch (error) {
      console.error("Error submitting survey:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div>Loading survey...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          <CardDescription>{survey.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-medium">{question.question_text}</Label>

                {question.question_type === "rating" && (
                  <RadioGroup
                    value={responses[question.id] || ""}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                        <Label htmlFor={`${question.id}-${rating}`}>
                          {rating} -{" "}
                          {rating === 1
                            ? "Poor"
                            : rating === 2
                              ? "Fair"
                              : rating === 3
                                ? "Good"
                                : rating === 4
                                  ? "Very Good"
                                  : "Excellent"}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.question_type === "text" && (
                  <Textarea
                    value={responses[question.id] || ""}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Enter your response..."
                    rows={3}
                  />
                )}

                {question.question_type === "multiple_choice" && question.options && (
                  <RadioGroup
                    value={responses[question.id] || ""}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                  >
                    {question.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                        <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}

            <Button type="submit" disabled={submitting || Object.keys(responses).length !== questions.length}>
              {submitting ? "Submitting..." : "Submit Survey"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

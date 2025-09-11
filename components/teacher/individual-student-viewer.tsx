"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  MessageSquare,
  Target
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Student {
  id: string
  unique_id: string
  full_name: string
  email: string
  class_number: string
}

interface SurveyQuestion {
  id: string
  question_text: string
  question_type: string
  options: any
  order_number: number
}

interface SurveyResponse {
  id: string
  student_id: string
  question_id: string
  response_value: string
  submitted_at: string
  question: SurveyQuestion
}

interface StudentPerformance {
  student: Student
  averageScore: number
  responseCount: number
  lastResponse: string
  performance: 'excelling' | 'good' | 'struggling' | 'no_data'
  questionScores: {
    question: string
    score: number
    maxScore: number
    response: string
  }[]
  trends: {
    improving: boolean
    declining: boolean
    stable: boolean
  }
}

interface IndividualStudentViewerProps {
  studentId: string
  surveyId: string
  onClose: () => void
}

export function IndividualStudentViewer({ studentId, surveyId, onClose }: IndividualStudentViewerProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [performance, setPerformance] = useState<StudentPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    fetchStudentData()
  }, [studentId, surveyId])

  const fetchStudentData = async () => {
    try {
      
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id
      

      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from("users")
        .select("id, unique_id, full_name, email, class_number")
        .eq("id", studentId)
        .eq("school_id", schoolId)
        .single()

      
      if (studentError) {
        throw studentError
      }
      setStudent(studentData)

      // Fetch student's survey responses
      const { data: responsesData, error: responsesError } = await supabase
        .from("survey_responses")
        .select(`
          *,
          question:survey_questions!inner(
            id,
            question_text,
            question_type,
            options,
            order_number
          )
        `)
        .eq("student_id", studentId)
        .eq("survey_id", surveyId)
        .eq("school_id", schoolId)

      
      if (responsesError) {
        throw responsesError
      }
      setResponses(responsesData || [])

      // Calculate performance
      calculatePerformance(studentData, responsesData || [])
    } catch (error) {
      console.error("Error fetching student data:", error)
      console.error("Error type:", typeof error)
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      // Set default performance to prevent the "no data" message
      setPerformance({
        student: null,
        averageScore: 0,
        responseCount: 0,
        lastResponse: '',
        performance: "no_data",
        questionScores: [],
        trends: { improving: false, declining: false, stable: true }
      })
    } finally {
      setLoading(false)
    }
  }

  const calculatePerformance = (studentData: Student, responses: SurveyResponse[]) => {
    // Sort responses by question order number
    const sortedResponses = responses.sort((a, b) => {
      const orderA = a.question?.order_number || 0
      const orderB = b.question?.order_number || 0
      return orderA - orderB
    })
    
    const ratingResponses = sortedResponses.filter(r => r.question.question_type === 'rating')
    
    if (ratingResponses.length === 0) {
      setPerformance({
        student: studentData,
        averageScore: 0,
        responseCount: 0,
        lastResponse: '',
        performance: 'no_data',
        questionScores: [],
        trends: { improving: false, declining: false, stable: true }
      })
      return
    }

    const scores = ratingResponses.map(r => parseInt(r.response_value)).filter(s => !isNaN(s))
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const lastResponse = sortedResponses[sortedResponses.length - 1]?.submitted_at || ''

    let performanceLevel: 'excelling' | 'good' | 'struggling' | 'no_data' = 'no_data'
    if (averageScore >= 4.5) performanceLevel = 'excelling'
    else if (averageScore >= 3.5) performanceLevel = 'good'
    else if (averageScore >= 2.5) performanceLevel = 'struggling'

    // Calculate question scores
    const questionScores = sortedResponses.map(response => {
      const score = response.question.question_type === 'rating' ? parseInt(response.response_value) : 0
      const maxScore = response.question.question_type === 'rating' ? 5 : 1
      
      return {
        question: response.question.question_text,
        score: isNaN(score) ? 0 : score,
        maxScore,
        response: response.response_value
      }
    })

    setPerformance({
      student: studentData,
      averageScore: Math.round(averageScore * 10) / 10,
      responseCount: sortedResponses.length,
      lastResponse,
      performance: performanceLevel,
      questionScores,
      trends: { improving: false, declining: false, stable: true } // TODO: Implement trend analysis
    })
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excelling': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'struggling': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excelling': return <Star className="h-4 w-4" />
      case 'good': return <TrendingUp className="h-4 w-4" />
      case 'struggling': return <AlertTriangle className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleScheduleMeeting = () => {
    setShowScheduleModal(true)
  }

  const handleSendFeedback = () => {
    setShowFeedbackModal(true)
  }

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false)
  }

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Student not found. Please check if the student ID is correct and the student belongs to your school.
        </AlertDescription>
      </Alert>
    )
  }

  if (!performance || !performance.questionScores) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No survey responses found for this student. The student may not have completed any surveys yet.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{student.full_name}</h2>
          <p className="text-muted-foreground">
            ID: {student.unique_id} • Class: {student.class_number}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.averageScore}/5</div>
            <Badge className={`mt-2 ${getPerformanceColor(performance.performance)}`}>
              {getPerformanceIcon(performance.performance)}
              <span className="ml-1 capitalize">{performance.performance}</span>
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.responseCount}</div>
            <p className="text-xs text-muted-foreground">
              Questions answered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Response</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {performance.lastResponse ? new Date(performance.lastResponse).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {performance.lastResponse ? new Date(performance.lastResponse).toLocaleTimeString() : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((performance.averageScore / 5) * 100)}%
            </div>
            <Progress value={(performance.averageScore / 5) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="responses">Individual Responses</TabsTrigger>
          <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Individual Responses Tab */}
        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Responses</CardTitle>
              <CardDescription>Detailed view of student's responses to each survey question</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performance.questionScores && performance.questionScores.length > 0 ? (
                  performance.questionScores.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">{question.question}</h4>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Response:</span>
                            <Badge variant="outline">
                              {question.response}
                            </Badge>
                          </div>
                          {question.maxScore > 1 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">Score:</span>
                              <span className={`font-medium ${getScoreColor(question.score, question.maxScore)}`}>
                                {question.score}/{question.maxScore}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {question.maxScore > 1 && (
                          <div className="text-sm text-muted-foreground mb-1">
                            {Math.round((question.score / question.maxScore) * 100)}%
                          </div>
                        )}
                        {question.maxScore > 1 && (
                          <Progress 
                            value={(question.score / question.maxScore) * 100} 
                            className="w-20 h-2" 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No question responses available for this student.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>How the student scored across different questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance.questionScores.map((question, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{question.question}</span>
                        <span className={`font-medium ${getScoreColor(question.score, question.maxScore)}`}>
                          {question.score}/{question.maxScore}
                        </span>
                      </div>
                      {question.maxScore > 1 && (
                        <Progress 
                          value={(question.score / question.maxScore) * 100} 
                          className="h-2" 
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Performance</span>
                  <Badge className={getPerformanceColor(performance.performance)}>
                    {getPerformanceIcon(performance.performance)}
                    <span className="ml-1 capitalize">{performance.performance}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Score</span>
                  <span className="font-bold">{performance.averageScore}/5</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="font-bold">100%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className="font-bold">
                    {performance.lastResponse ? 
                      new Date(performance.lastResponse).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
                <CardDescription>Areas where the student is performing well</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.performance === 'excelling' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Excellent Performance</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        This student is consistently scoring high across all questions
                      </p>
                    </div>
                  </div>
                ) : performance.performance === 'good' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Good Performance</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        This student is performing well with room for improvement
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Limited Data</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">
                        More responses needed to assess performance
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>Suggestions for supporting this student</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.performance === 'struggling' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Needs Support</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Consider reaching out to provide additional support and resources
                      </p>
                    </div>
                  </div>
                ) : performance.performance === 'good' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Room for Growth</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        This student could benefit from additional challenges or support
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">No Data Available</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">
                        Encourage participation in future surveys
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Next steps based on this student's performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performance.performance === 'struggling' && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Schedule One-on-One Meeting</p>
                      <p className="text-xs text-red-700">Discuss challenges and provide additional support</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleScheduleMeeting}>
                      Schedule
                    </Button>
                  </div>
                )}

                {performance.performance === 'excelling' && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Star className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Provide Advanced Challenges</p>
                      <p className="text-xs text-green-700">Offer additional resources or advanced topics</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Assign
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Send Feedback</p>
                    <p className="text-xs text-blue-700">Provide personalized feedback on their responses</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleSendFeedback}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule One-on-One Meeting</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule a meeting with {student?.full_name} to discuss their survey responses and provide additional support.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseScheduleModal}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  const currentUserData = localStorage.getItem("currentUser")
                  if (!currentUserData) {
                    alert("No current user found")
                    return
                  }
                  const currentUser = JSON.parse(currentUserData)
                  
                  
                  const { data, error } = await supabase
                    .from("scheduled_meetings")
                    .insert({
                      school_id: currentUser.school_id,
                      teacher_id: currentUser.id,
                      student_id: studentId,
                      survey_id: surveyId || null, // Handle potential null survey_id
                      title: `One-on-One Meeting with ${student?.full_name}`,
                      description: "Discuss survey responses and provide additional support",
                      meeting_type: "one_on_one",
                      status: "scheduled"
                    })
                    .select()
                  
                  if (error) {
                    console.error("Error scheduling meeting:", error)
                    console.error("Error details:", {
                      message: error.message,
                      details: error.details,
                      hint: error.hint,
                      code: error.code
                    })
                    alert(`Failed to schedule meeting: ${error.message}`)
                  } else {
                    alert(`Meeting scheduled with ${student?.full_name}! They will see it in their dashboard.`)
                    handleCloseScheduleModal()
                  }
                } catch (error) {
                  alert("An unexpected error occurred. Please try again.")
                }
              }}>
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Send Feedback</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Send personalized feedback to {student?.full_name} based on their survey responses.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseFeedbackModal}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  const currentUserData = localStorage.getItem("currentUser")
                  if (!currentUserData) {
                    alert("No current user found")
                    return
                  }
                  const currentUser = JSON.parse(currentUserData)
                  
                  const { error } = await supabase
                    .from("feedback_messages")
                    .insert({
                      school_id: currentUser.school_id,
                      teacher_id: currentUser.id,
                      student_id: studentId,
                      survey_id: surveyId,
                      title: `Feedback from ${currentUser.full_name}`,
                      message: `Based on your survey responses, I'd like to provide some personalized feedback to help you improve. Let's discuss your progress and any areas where you might need additional support.`,
                      message_type: "feedback"
                    })
                  
                  if (error) {
                    console.error("Error sending feedback:", error)
                    alert("Failed to send feedback. Please try again.")
                  } else {
                    alert(`Feedback sent to ${student?.full_name}! They will see it in their dashboard.`)
                    handleCloseFeedbackModal()
                  }
                } catch (error) {
                  console.error("Error:", error)
                  alert("An error occurred. Please try again.")
                }
              }}>
                Send Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

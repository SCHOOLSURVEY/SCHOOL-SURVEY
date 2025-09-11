"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { IndividualStudentViewer } from "./individual-student-viewer"
import { toast } from "sonner"
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Star,
  Search,
  Filter,
  Download,
  Eye,
  Target,
  Activity
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { StudentPerformanceTracker } from "./student-performance-tracker"

interface Survey {
  id: string
  title: string
  description: string
  course_id: string
  course: {
    name: string
    class_number: string
    subjects: { name: string }
  }
  status: string
  created_at: string
  closes_at: string
}

interface Student {
  id: string
  unique_id: string
  full_name: string
  email: string
  class_number: string
}

interface SurveyResponse {
  id: string
  student_id: string
  question_id: string
  response_value: string
  submitted_at: string
  student: Student
  question: {
    question_text: string
    question_type: string
    options: any
  }
}

interface StudentPerformance {
  student: Student
  averageScore: number
  responseCount: number
  lastResponse: string
  performance: 'excelling' | 'good' | 'struggling' | 'no_data'
  trends: {
    improving: boolean
    declining: boolean
    stable: boolean
  }
}

interface ClassAnalytics {
  totalResponses: number
  averageScore: number
  participationRate: number
  topPerformers: StudentPerformance[]
  strugglingStudents: StudentPerformance[]
  questionBreakdown: {
    question: string
    averageScore: number
    responseCount: number
  }[]
}

export function SurveyIntelligenceDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null)
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)

  useEffect(() => {
    // Try to fetch data, but don't fail if user isn't ready yet
    const tryFetchData = () => {
      const currentUserData = localStorage.getItem("currentUser")
      if (currentUserData) {
        fetchData()
      } else {
        // Retry after a short delay if user isn't ready
        setTimeout(tryFetchData, 500)
      }
    }
    
    tryFetchData()
  }, [])

  useEffect(() => {
    if (selectedSurvey) {
      fetchSurveyData(selectedSurvey)
    }
  }, [selectedSurvey])

  const fetchData = async () => {
    try {
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        return // Don't throw error, just return and wait
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id
      
      if (!schoolId) {
        return
      }

      // Fetch teacher's courses and surveys
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          class_number,
          subjects!inner(name)
        `)
        .eq("teacher_id", currentUser.id)
        .eq("school_id", schoolId)

      if (coursesError) throw coursesError

      const courseIds = coursesData?.map(c => c.id) || []

      if (courseIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch surveys for these courses
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
        .in("course_id", courseIds)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })

      if (surveysError) throw surveysError

      setSurveys(surveysData || [])
      
      if (surveysData && surveysData.length > 0) {
        setSelectedSurvey(surveysData[0].id)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSurveyData = async (surveyId: string) => {
    try {
      
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        return
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id
      

      // Fetch survey responses with student and question data
      const { data: responsesData, error: responsesError } = await supabase
        .from("survey_responses")
        .select(`
          *,
          student:users!inner(
            id,
            unique_id,
            full_name,
            email,
            class_number
          ),
          question:survey_questions!inner(
            question_text,
            question_type,
            options
          )
        `)
        .eq("survey_id", surveyId)
        .eq("school_id", schoolId)

      if (responsesError) throw responsesError


      setResponses(responsesData || [])

      // Get unique students from responses
      const uniqueStudents = responsesData?.reduce((acc, response) => {
        const student = response.student
        if (!acc.find(s => s.id === student.id)) {
          acc.push(student)
        }
        return acc
      }, [] as Student[]) || []


      setStudents(uniqueStudents)

      // Calculate analytics
      calculateAnalytics(responsesData || [], uniqueStudents)
    } catch (error) {
      console.error("Error fetching survey data:", error)
    }
  }

  const calculateAnalytics = (responses: SurveyResponse[], students: Student[]) => {
    // Group responses by student
    const studentResponses = responses.reduce((acc, response) => {
      if (!acc[response.student_id]) {
        acc[response.student_id] = []
      }
      acc[response.student_id].push(response)
      return acc
    }, {} as Record<string, SurveyResponse[]>)

    // Calculate student performance
    const performance: StudentPerformance[] = students.map(student => {
      const studentResponseList = studentResponses[student.id] || []
      const ratingResponses = studentResponseList.filter(r => r.question.question_type === 'rating')
      
      if (ratingResponses.length === 0) {
        return {
          student,
          averageScore: 0,
          responseCount: 0,
          lastResponse: '',
          performance: 'no_data' as const,
          trends: { improving: false, declining: false, stable: true }
        }
      }

      const scores = ratingResponses.map(r => parseInt(r.response_value)).filter(s => !isNaN(s))
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const lastResponse = studentResponseList[studentResponseList.length - 1]?.submitted_at || ''

      let performanceLevel: 'excelling' | 'good' | 'struggling' | 'no_data' = 'no_data'
      if (averageScore >= 4.5) performanceLevel = 'excelling'
      else if (averageScore >= 3.5) performanceLevel = 'good'
      else if (averageScore >= 2.5) performanceLevel = 'struggling'

      return {
        student,
        averageScore: Math.round(averageScore * 10) / 10,
        responseCount: studentResponseList.length,
        lastResponse,
        performance: performanceLevel,
        trends: { improving: false, declining: false, stable: true } // TODO: Implement trend analysis
      }
    })

    setStudentPerformance(performance)

    // Calculate class analytics
    const allScores = responses
      .filter(r => r.question.question_type === 'rating')
      .map(r => parseInt(r.response_value))
      .filter(s => !isNaN(s))

    const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0
    const participationRate = students.length > 0 ? (responses.length / students.length) * 100 : 0

    const topPerformers = performance
      .filter(p => p.performance === 'excelling')
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5)

    const strugglingStudents = performance
      .filter(p => p.performance === 'struggling')
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5)

    // Question breakdown
    const questionBreakdown = responses.reduce((acc, response) => {
      const questionText = response.question.question_text
      if (!acc[questionText]) {
        acc[questionText] = {
          question: questionText,
          scores: [],
          count: 0
        }
      }
      if (response.question.question_type === 'rating') {
        const score = parseInt(response.response_value)
        if (!isNaN(score)) {
          acc[questionText].scores.push(score)
        }
      }
      acc[questionText].count++
      return acc
    }, {} as Record<string, { question: string; scores: number[]; count: number }>)

    const questionBreakdownArray = Object.values(questionBreakdown).map(q => ({
      question: q.question,
      averageScore: q.scores.length > 0 ? Math.round((q.scores.reduce((a, b) => a + b, 0) / q.scores.length) * 10) / 10 : 0,
      responseCount: q.count
    }))

    setClassAnalytics({
      totalResponses: responses.length,
      averageScore: Math.round(averageScore * 10) / 10,
      participationRate: Math.round(participationRate * 10) / 10,
      topPerformers,
      strugglingStudents,
      questionBreakdown: questionBreakdownArray
    })
  }

  const filteredStudents = studentPerformance.filter(student => {
    const matchesSearch = student.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student.unique_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = performanceFilter === "all" || 
                         (performanceFilter === "excelling" && student.performance === "excelling") ||
                         (performanceFilter === "struggling" && student.performance === "struggling") ||
                         (performanceFilter === "good" && student.performance === "good") ||
                         (performanceFilter === "no_data" && student.performance === "no_data")
    
    return matchesSearch && matchesFilter
  })

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

  const handleViewDetails = (student: StudentPerformance) => {
    if (!selectedSurvey) {
      toast.error("Please select a survey first to view student details.")
      return
    }
    setSelectedStudent(student)
    setShowStudentDetails(true)
  }

  const handleCloseStudentDetails = () => {
    setShowStudentDetails(false)
    setSelectedStudent(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (surveys.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No surveys found. Create surveys for your courses to view analytics.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Survey Intelligence Dashboard</h2>
          <p className="text-muted-foreground">Analyze student performance and engagement through survey data</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Survey Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Survey</CardTitle>
          <CardDescription>Choose a survey to analyze student responses</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
            <SelectTrigger>
              <SelectValue placeholder="Select a survey" />
            </SelectTrigger>
            <SelectContent>
              {surveys.map((survey) => (
                <SelectItem key={survey.id} value={survey.id}>
                  {survey.title} - {survey.course?.name || 'Unknown Course'} ({survey.course?.class_number || 'N/A'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSurvey && classAnalytics && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Individual Students</TabsTrigger>
            <TabsTrigger value="performance">Performance Tracker</TabsTrigger>
            <TabsTrigger value="analytics">Class Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAnalytics.totalResponses}</div>
                  <p className="text-xs text-muted-foreground">
                    {classAnalytics.participationRate}% participation rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAnalytics.averageScore}/5</div>
                  <p className="text-xs text-muted-foreground">
                    Class performance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAnalytics.topPerformers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Students excelling
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Need Support</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAnalytics.strugglingStudents.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Students struggling
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest survey scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {classAnalytics.topPerformers.map((student, index) => (
                      <div key={student.student.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium">{student.student.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{student.averageScore}/5</span>
                          <Badge className={getPerformanceColor(student.performance)}>
                            {getPerformanceIcon(student.performance)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Students Needing Support</CardTitle>
                  <CardDescription>Students who may need additional help</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {classAnalytics.strugglingStudents.map((student, index) => (
                      <div key={student.student.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium">{student.student.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{student.averageScore}/5</span>
                          <Badge className={getPerformanceColor(student.performance)}>
                            {getPerformanceIcon(student.performance)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Individual Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="excelling">Excelling</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="struggling">Struggling</SelectItem>
                    <SelectItem value="no_data">No Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.student.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{student.student.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {student.student.unique_id} • Class: {student.student.class_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{student.averageScore}/5</div>
                          <p className="text-xs text-muted-foreground">
                            {student.responseCount} responses
                          </p>
                        </div>
                        <Badge className={getPerformanceColor(student.performance)}>
                          {getPerformanceIcon(student.performance)}
                          <span className="ml-1 capitalize">{student.performance}</span>
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(student)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                    {student.averageScore > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Performance</span>
                          <span>{Math.round((student.averageScore / 5) * 100)}%</span>
                        </div>
                        <Progress value={(student.averageScore / 5) * 100} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tracker Tab */}
          <TabsContent value="performance" className="space-y-6">
            <StudentPerformanceTracker />
          </TabsContent>

          {/* Class Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Performance Breakdown</CardTitle>
                <CardDescription>How students performed on each survey question</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classAnalytics.questionBreakdown.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{question.question}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {question.responseCount} responses
                          </span>
                          <Badge variant="outline">
                            {question.averageScore}/5
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(question.averageScore / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>Automated insights from survey data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Strong Performance</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {classAnalytics.topPerformers.length} students are excelling with scores above 4.5/5
                    </p>
                  </div>
                  
                  {classAnalytics.strugglingStudents.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">Attention Needed</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        {classAnalytics.strugglingStudents.length} students may need additional support
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Participation</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {classAnalytics.participationRate}% of students have responded to surveys
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Suggested actions based on survey data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {classAnalytics.strugglingStudents.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Support Struggling Students</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Consider reaching out to students with low scores for additional support
                      </p>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  )}

                  {classAnalytics.participationRate < 80 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Improve Participation</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Consider sending reminders to increase survey participation
                      </p>
                      <Button size="sm" variant="outline">
                        Send Reminders
                      </Button>
                    </div>
                  )}

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Celebrate Success</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Acknowledge top performers to maintain engagement
                    </p>
                    <Button size="sm" variant="outline">
                      Send Recognition
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Individual Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <IndividualStudentViewer
              studentId={selectedStudent.student.id}
              surveyId={selectedSurvey}
              onClose={handleCloseStudentDetails}
            />
          </div>
        </div>
      )}
    </div>
  )
}

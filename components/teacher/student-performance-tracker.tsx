"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  TrendingDown, 
  Star,
  AlertTriangle,
  Target,
  Users,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Student {
  id: string
  unique_id: string
  full_name: string
  email: string
  class_number: string
}

interface Survey {
  id: string
  title: string
  course_id: string
  course: {
    name: string
    class_number: string
  }
  created_at: string
}

interface StudentPerformance {
  student: Student
  overallScore: number
  responseCount: number
  lastResponse: string
  performance: 'excelling' | 'good' | 'struggling' | 'no_data'
  trends: {
    improving: boolean
    declining: boolean
    stable: boolean
  }
  surveyScores: {
    survey: Survey
    score: number
    responseCount: number
    lastResponse: string
  }[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

interface PerformanceInsights {
  topPerformers: StudentPerformance[]
  strugglingStudents: StudentPerformance[]
  improvingStudents: StudentPerformance[]
  decliningStudents: StudentPerformance[]
  classAverage: number
  participationRate: number
  overallTrend: 'improving' | 'declining' | 'stable'
}

export function StudentPerformanceTracker() {
  const [students, setStudents] = useState<Student[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [performance, setPerformance] = useState<StudentPerformance[]>([])
  const [insights, setInsights] = useState<PerformanceInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Fetch teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, name, class_number")
        .eq("teacher_id", currentUser.id)
        .eq("school_id", schoolId)

      if (coursesError) throw coursesError

      const courseIds = coursesData?.map(c => c.id) || []

      if (courseIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch students enrolled in these courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select(`
          student_id,
          student:users!inner(
            id,
            unique_id,
            full_name,
            email,
            class_number
          )
        `)
        .in("course_id", courseIds)
        .eq("school_id", schoolId)

      if (enrollmentsError) throw enrollmentsError

      const uniqueStudents = enrollmentsData?.reduce((acc, enrollment) => {
        const student = enrollment.student
        if (!acc.find(s => s.id === student.id)) {
          acc.push(student)
        }
        return acc
      }, [] as Student[]) || []

      setStudents(uniqueStudents)

      // Fetch surveys for these courses
      const { data: surveysData, error: surveysError } = await supabase
        .from("surveys")
        .select(`
          *,
          courses!inner(
            name,
            class_number
          )
        `)
        .in("course_id", courseIds)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })

      if (surveysError) throw surveysError

      setSurveys(surveysData || [])

      // Calculate performance for each student
      await calculateStudentPerformance(uniqueStudents, surveysData || [], schoolId)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStudentPerformance = async (students: Student[], surveys: Survey[], schoolId: string) => {
    const performanceData: StudentPerformance[] = []

    for (const student of students) {
      const surveyScores = []
      let totalScore = 0
      let totalResponses = 0

      for (const survey of surveys) {
        // Fetch student's responses for this survey
        const { data: responses, error } = await supabase
          .from("survey_responses")
          .select(`
            *,
            question:survey_questions!inner(
              question_type
            )
          `)
          .eq("student_id", student.id)
          .eq("survey_id", survey.id)
          .eq("school_id", schoolId)

        if (error) {
          console.error(`Error fetching responses for student ${student.id}, survey ${survey.id}:`, error)
          continue
        }

        const ratingResponses = responses?.filter(r => r.question.question_type === 'rating') || []
        const scores = ratingResponses.map(r => parseInt(r.response_value)).filter(s => !isNaN(s))
        const surveyScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

        if (surveyScore > 0) {
          surveyScores.push({
            survey,
            score: Math.round(surveyScore * 10) / 10,
            responseCount: responses?.length || 0,
            lastResponse: responses?.[responses.length - 1]?.submitted_at || ''
          })

          totalScore += surveyScore
          totalResponses++
        }
      }

      const overallScore = totalResponses > 0 ? totalScore / totalResponses : 0
      const lastResponse = surveyScores.length > 0 ? 
        surveyScores.sort((a, b) => new Date(b.lastResponse).getTime() - new Date(a.lastResponse).getTime())[0].lastResponse : ''

      let performanceLevel: 'excelling' | 'good' | 'struggling' | 'no_data' = 'no_data'
      if (overallScore >= 4.5) performanceLevel = 'excelling'
      else if (overallScore >= 3.5) performanceLevel = 'good'
      else if (overallScore >= 2.5) performanceLevel = 'struggling'

      // Calculate trends (simplified - in production you'd analyze historical data)
      const trends = {
        improving: false,
        declining: false,
        stable: true
      }

      // Generate strengths and weaknesses based on performance
      const strengths = []
      const weaknesses = []
      const recommendations = []

      if (performanceLevel === 'excelling') {
        strengths.push("Consistently high performance across surveys")
        strengths.push("Strong engagement and participation")
        recommendations.push("Provide advanced challenges")
        recommendations.push("Consider leadership opportunities")
      } else if (performanceLevel === 'good') {
        strengths.push("Above average performance")
        recommendations.push("Continue current support level")
        recommendations.push("Identify areas for growth")
      } else if (performanceLevel === 'struggling') {
        weaknesses.push("Below average performance")
        weaknesses.push("May need additional support")
        recommendations.push("Schedule one-on-one meeting")
        recommendations.push("Provide additional resources")
        recommendations.push("Consider peer support")
      } else {
        weaknesses.push("No survey responses")
        recommendations.push("Encourage participation")
        recommendations.push("Check for technical issues")
      }

      performanceData.push({
        student,
        overallScore: Math.round(overallScore * 10) / 10,
        responseCount: surveyScores.reduce((acc, s) => acc + s.responseCount, 0),
        lastResponse,
        performance: performanceLevel,
        trends,
        surveyScores,
        strengths,
        weaknesses,
        recommendations
      })
    }

    setPerformance(performanceData)
    calculateInsights(performanceData)
  }

  const calculateInsights = (performanceData: StudentPerformance[]) => {
    const topPerformers = performanceData
      .filter(p => p.performance === 'excelling')
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)

    const strugglingStudents = performanceData
      .filter(p => p.performance === 'struggling')
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 5)

    const improvingStudents = performanceData
      .filter(p => p.trends.improving)
      .sort((a, b) => b.overallScore - a.overallScore)

    const decliningStudents = performanceData
      .filter(p => p.trends.declining)
      .sort((a, b) => a.overallScore - b.overallScore)

    const classAverage = performanceData.length > 0 ? 
      performanceData.reduce((acc, p) => acc + p.overallScore, 0) / performanceData.length : 0

    const participationRate = performanceData.length > 0 ? 
      (performanceData.filter(p => p.responseCount > 0).length / performanceData.length) * 100 : 0

    setInsights({
      topPerformers,
      strugglingStudents,
      improvingStudents,
      decliningStudents,
      classAverage: Math.round(classAverage * 10) / 10,
      participationRate: Math.round(participationRate * 10) / 10,
      overallTrend: 'stable' // TODO: Implement trend analysis
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (performance.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No student performance data available. Students need to complete surveys first.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Student Performance Tracker</h2>
          <p className="text-muted-foreground">Monitor student progress and identify those who need support</p>
        </div>
      </div>

      {/* Performance Overview */}
      {insights && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Class Average</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.classAverage}/5</div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participation</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.participationRate}%</div>
              <p className="text-xs text-muted-foreground">
                Students responding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.topPerformers.length}</div>
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
              <div className="text-2xl font-bold">{insights.strugglingStudents.length}</div>
              <p className="text-xs text-muted-foreground">
                Students struggling
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="excelling">Top Performers</TabsTrigger>
          <TabsTrigger value="struggling">Need Support</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* All Students Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {performance.map((student) => (
              <Card key={student.student.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{student.student.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {student.student.unique_id} • Class: {student.student.class_number}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {student.responseCount} responses
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Last: {student.lastResponse ? new Date(student.lastResponse).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{student.overallScore}/5</div>
                        <Badge className={getPerformanceColor(student.performance)}>
                          {getPerformanceIcon(student.performance)}
                          <span className="ml-1 capitalize">{student.performance}</span>
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                  {student.overallScore > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Performance</span>
                        <span>{Math.round((student.overallScore / 5) * 100)}%</span>
                      </div>
                      <Progress value={(student.overallScore / 5) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="excelling" className="space-y-4">
          <div className="grid gap-4">
            {insights?.topPerformers.map((student, index) => (
              <Card key={student.student.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{student.student.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {student.student.unique_id} • Class: {student.student.class_number}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.strengths.slice(0, 2).map((strength, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{student.overallScore}/5</div>
                        <Badge className={getPerformanceColor(student.performance)}>
                          {getPerformanceIcon(student.performance)}
                          <span className="ml-1 capitalize">{student.performance}</span>
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Struggling Students Tab */}
        <TabsContent value="struggling" className="space-y-4">
          <div className="grid gap-4">
            {insights?.strugglingStudents.map((student, index) => (
              <Card key={student.student.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{student.student.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {student.student.unique_id} • Class: {student.student.class_number}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.weaknesses.slice(0, 2).map((weakness, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {weakness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{student.overallScore}/5</div>
                        <Badge className={getPerformanceColor(student.performance)}>
                          {getPerformanceIcon(student.performance)}
                          <span className="ml-1 capitalize">{student.performance}</span>
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Support
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Automated insights from performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Strong Performance</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {insights?.topPerformers.length} students are excelling with scores above 4.5/5
                  </p>
                </div>
                
                {insights && insights.strugglingStudents.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Attention Needed</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {insights.strugglingStudents.length} students may need additional support
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Participation</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {insights?.participationRate}% of students are actively participating in surveys
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>Suggested next steps based on performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights && insights.strugglingStudents.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Support Struggling Students</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Consider reaching out to {insights.strugglingStudents.length} students with low scores
                    </p>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                )}

                {insights && insights.participationRate < 80 && (
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
    </div>
  )
}

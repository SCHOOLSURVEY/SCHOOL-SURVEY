"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { DatabaseService } from "@/lib/database-client"
import { TrendingUp, Users, BookOpen, Calendar, AlertTriangle } from "lucide-react"

export function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState("30")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, selectedCourse])

  const fetchAnalyticsData = async () => {
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(timeRange))

      // Fetch comprehensive analytics data
      const [gradesData, attendanceData, surveysData, assignmentsData, coursesData, usersData] = await Promise.all([
        // Grades analytics
        supabase
          .from("grades")
          .select(`
            points_earned,
            letter_grade,
            graded_at,
            assignments!inner(
              points_possible,
              assignment_type,
              courses!inner(name, class_number)
            )
          `)
          .gte("graded_at", startDate.toISOString()),

        // Attendance analytics
        supabase
          .from("attendance")
          .select(`
            status,
            date,
            courses!inner(name, class_number)
          `)
          .gte("date", startDate.toISOString().split("T")[0]),

        // Survey analytics
        supabase
          .from("survey_responses")
          .select(`
            response_value,
            submitted_at,
            surveys!inner(
              title,
              survey_type,
              courses!inner(name, class_number)
            ),
            survey_questions!inner(question_type)
          `)
          .gte("submitted_at", startDate.toISOString()),

        // Assignments analytics
        supabase
          .from("assignments")
          .select(`
            assignment_type,
            points_possible,
            created_at,
            is_published,
            courses!inner(name, class_number)
          `)
          .gte("created_at", startDate.toISOString()),

        // Courses data
        supabase
          .from("courses")
          .select(`
            id,
            name,
            class_number,
            subjects!inner(name)
          `),

        // Users data
        supabase
          .from("users")
          .select("role, created_at"),
      ])

      // Process the data
      const processedData = {
        overview: {
          totalStudents: usersData.data?.filter((u) => u.role === "student").length || 0,
          totalTeachers: usersData.data?.filter((u) => u.role === "teacher").length || 0,
          totalCourses: coursesData.data?.length || 0,
          totalAssignments: assignmentsData.data?.length || 0,
        },
        gradeDistribution: processGradeDistribution(gradesData.data || []),
        attendanceTrends: processAttendanceTrends(attendanceData.data || []),
        surveyInsights: processSurveyInsights(surveysData.data || []),
        assignmentTypes: processAssignmentTypes(assignmentsData.data || []),
        coursePerformance: processCoursePerformance(gradesData.data || []),
        weeklyActivity: processWeeklyActivity(gradesData.data || [], assignmentsData.data || []),
        riskStudents: identifyRiskStudents(gradesData.data || [], attendanceData.data || []),
      }

      setAnalyticsData(processedData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const processGradeDistribution = (grades: any[]) => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    grades.forEach((grade) => {
      if (grade.letter_grade && distribution.hasOwnProperty(grade.letter_grade)) {
        distribution[grade.letter_grade]++
      }
    })
    return Object.entries(distribution).map(([grade, count]) => ({ grade, count }))
  }

  const processAttendanceTrends = (attendance: any[]) => {
    const trends = {}
    attendance.forEach((record) => {
      const date = record.date
      if (!trends[date]) {
        trends[date] = { date, present: 0, absent: 0, late: 0 }
      }
      trends[date][record.status]++
    })
    return Object.values(trends).slice(-14) // Last 14 days
  }

  const processSurveyInsights = (responses: any[]) => {
    const ratingResponses = responses.filter((r) => r.survey_questions.question_type === "rating")
    const avgRating =
      ratingResponses.length > 0
        ? ratingResponses.reduce((sum, r) => sum + Number.parseInt(r.response_value), 0) / ratingResponses.length
        : 0

    const surveyTypes = {}
    responses.forEach((r) => {
      const type = r.surveys.survey_type
      if (!surveyTypes[type]) surveyTypes[type] = 0
      surveyTypes[type]++
    })

    return {
      averageRating: Math.round(avgRating * 100) / 100,
      totalResponses: responses.length,
      byType: Object.entries(surveyTypes).map(([type, count]) => ({ type, count })),
    }
  }

  const processAssignmentTypes = (assignments: any[]) => {
    const types = {}
    assignments.forEach((assignment) => {
      const type = assignment.assignment_type
      if (!types[type]) types[type] = 0
      types[type]++
    })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  }

  const processCoursePerformance = (grades: any[]) => {
    const courseGrades = {}
    grades.forEach((grade) => {
      const courseName = grade.assignments.courses.name
      if (!courseGrades[courseName]) {
        courseGrades[courseName] = { totalPoints: 0, totalPossible: 0, count: 0 }
      }
      courseGrades[courseName].totalPoints += grade.points_earned || 0
      courseGrades[courseName].totalPossible += grade.assignments.points_possible || 0
      courseGrades[courseName].count++
    })

    return Object.entries(courseGrades).map(([course, data]: [string, any]) => ({
      course,
      average: data.totalPossible > 0 ? Math.round((data.totalPoints / data.totalPossible) * 100) : 0,
      assignments: data.count,
    }))
  }

  const processWeeklyActivity = (grades: any[], assignments: any[]) => {
    const weeks = {}
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekKey = `Week ${7 - i}`
      weeks[weekKey] = { week: weekKey, grades: 0, assignments: 0 }

      grades.forEach((grade) => {
        const gradeDate = new Date(grade.graded_at)
        if (gradeDate >= weekStart && gradeDate <= weekEnd) {
          weeks[weekKey].grades++
        }
      })

      assignments.forEach((assignment) => {
        const assignmentDate = new Date(assignment.created_at)
        if (assignmentDate >= weekStart && assignmentDate <= weekEnd) {
          weeks[weekKey].assignments++
        }
      })
    }

    return Object.values(weeks)
  }

  const identifyRiskStudents = (grades: any[], attendance: any[]) => {
    // This would identify students with low grades or poor attendance
    // For demo purposes, return mock data
    return [
      { name: "Student A", risk: "Low Grades", score: 45 },
      { name: "Student B", risk: "Poor Attendance", score: 60 },
      { name: "Student C", risk: "Missing Assignments", score: 55 },
    ]
  }

  if (loading) {
    return <div>Loading advanced analytics...</div>
  }

  if (!analyticsData) {
    return <div>No data available</div>
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Advanced Analytics Dashboard</span>
          </CardTitle>
          <CardDescription>Comprehensive insights into school performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Faculty members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalCourses}</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Created recently</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Overall grade distribution across all courses</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Number of Grades",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={analyticsData.gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Average performance by course</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    average: {
                      label: "Average %",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={analyticsData.coursePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="average" fill="var(--color-average)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Grades posted and assignments created over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  grades: {
                    label: "Grades Posted",
                    color: "hsl(var(--chart-1))",
                  },
                  assignments: {
                    label: "Assignments Created",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="grades" stroke="var(--color-grades)" strokeWidth={2} />
                  <Line type="monotone" dataKey="assignments" stroke="var(--color-assignments)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Daily attendance patterns over the last two weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  present: {
                    label: "Present",
                    color: "hsl(var(--chart-1))",
                  },
                  absent: {
                    label: "Absent",
                    color: "hsl(var(--chart-3))",
                  },
                  late: {
                    label: "Late",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[400px]"
              >
                <AreaChart data={analyticsData.attendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stackId="1"
                    stroke="var(--color-present)"
                    fill="var(--color-present)"
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stackId="1"
                    stroke="var(--color-late)"
                    fill="var(--color-late)"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stackId="1"
                    stroke="var(--color-absent)"
                    fill="var(--color-absent)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Survey Insights</CardTitle>
                <CardDescription>Overall feedback metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Rating</span>
                    <Badge variant="outline">{analyticsData.surveyInsights.averageRating}/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Responses</span>
                    <Badge variant="outline">{analyticsData.surveyInsights.totalResponses}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Types</CardTitle>
                <CardDescription>Distribution of survey responses by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Responses",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <PieChart>
                    <Pie
                      data={analyticsData.surveyInsights.byType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ type, count }) => `${type}: ${count}`}
                    >
                      {analyticsData.surveyInsights.byType.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Types</CardTitle>
              <CardDescription>Distribution of assignment types created</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Number of Assignments",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={analyticsData.assignmentTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>At-Risk Students</span>
              </CardTitle>
              <CardDescription>Students who may need additional support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.riskStudents.map((student: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.risk}</div>
                    </div>
                    <Badge variant={student.score < 50 ? "destructive" : "secondary"}>{student.score}% Risk</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

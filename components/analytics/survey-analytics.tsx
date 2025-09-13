"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { DatabaseService } from "@/lib/database-client"

interface AnalyticsData {
  averageRating: number
  responseCount: number
  ratingDistribution: { rating: string; count: number }[]
  coursePerformance: { course: string; average: number }[]
}

export function SurveyAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Fetch survey responses with course and rating data
      const responses = await DatabaseService.getSurveyResponsesBySchool(schoolId)

      // Process the data
      const ratings = responses?.map((r) => Number.parseInt(r.response_value)).filter((r) => !isNaN(r)) || []
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

      // Rating distribution
      const ratingCounts = [1, 2, 3, 4, 5].map((rating) => ({
        rating: rating.toString(),
        count: ratings.filter((r) => r === rating).length,
      }))

      // Course performance (mock data for demo)
      const coursePerformance = [
        { course: "Mathematics", average: 4.2 },
        { course: "Science", average: 3.8 },
        { course: "English", average: 4.0 },
        { course: "History", average: 3.9 },
        { course: "Physics", average: 4.1 },
      ]

      setData({
        averageRating,
        responseCount: ratings.length,
        ratingDistribution: ratingCounts,
        coursePerformance,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
          <CardDescription>Average ratings across all surveys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-blue-600">{data.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Average Rating (out of 5)</div>
            <div className="text-sm text-muted-foreground">Based on {data.responseCount} responses</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
          <CardDescription>How students rate their learning experience</CardDescription>
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
                data={data.ratingDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ rating, count }) => `${rating}: ${count}`}
              >
                {data.ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>Average ratings by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              average: {
                label: "Average Rating",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <BarChart data={data.coursePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis domain={[0, 5]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="average" fill="var(--color-average)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

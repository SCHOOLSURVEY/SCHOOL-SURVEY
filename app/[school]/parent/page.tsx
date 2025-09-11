"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Users, BookOpen, TrendingUp, Calendar, MessageCircle } from "lucide-react"

interface School {
  id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

export default function SchoolSpecificParentDashboard() {
  const params = useParams()
  const schoolSlug = params.school as string
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (schoolSlug) {
      fetchSchoolInfo()
    }
  }, [schoolSlug])

  const fetchSchoolInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug, abbreviation, primary_color, secondary_color, logo_url")
        .eq("slug", schoolSlug)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setSchool(data)
    } catch (error) {
      console.error("Error fetching school info:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h1>
          <p className="text-gray-600">The school you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const primaryColor = school.primary_color || '#3B82F6'

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)`
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {school.logo_url && (
            <img 
              src={school.logo_url} 
              alt={`${school.name} Logo`}
              className="w-16 h-16 object-contain mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {school.name}
          </h1>
          <p className="text-gray-600">Parent Dashboard</p>
        </div>

        {/* Children Overview */}
        <Card className="mb-8" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}05` }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
              Your Children
            </CardTitle>
            <CardDescription>
              Monitor your children's academic progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Emma Johnson</h3>
                <p className="text-sm text-gray-600">Grade 10 - Class A</p>
                <div className="mt-2">
                  <span className="text-sm font-medium text-green-600">Average: A-</span>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Alex Johnson</h3>
                <p className="text-sm text-gray-600">Grade 8 - Class B</p>
                <div className="mt-2">
                  <span className="text-sm font-medium text-blue-600">Average: B+</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assignments Due</p>
                  <p className="text-2xl font-bold text-gray-900">7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                  <p className="text-2xl font-bold text-gray-900">A-</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Messages</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Updates */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Latest updates about your children's progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Emma - Math Assignment</h3>
                    <p className="text-sm text-gray-600">Scored 95% - Great job!</p>
                  </div>
                  <Button 
                    size="sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    View
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Alex - Science Project</h3>
                    <p className="text-sm text-gray-600">Due tomorrow - Reminder sent</p>
                  </div>
                  <Button 
                    size="sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common parent tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                View Grades
              </Button>
              <Button 
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Check Attendance
              </Button>
              <Button 
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Message Teachers
              </Button>
              <Button 
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



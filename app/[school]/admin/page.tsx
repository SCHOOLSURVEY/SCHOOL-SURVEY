"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { OnboardingForm } from "@/components/admin/onboarding-form"
import { UsersTable } from "@/components/admin/users-table"
import { SurveyAnalytics } from "@/components/analytics/survey-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { SetupGuide } from "@/components/admin/setup-guide"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminCodesManager } from "@/components/admin/admin-codes-manager"
import { TeacherCodesManager } from "@/components/admin/teacher-codes-manager"
import { SubjectsManager } from "@/components/admin/subjects-manager"
import { CoursesManager } from "@/components/admin/courses-manager"
import { EnhancedSurveyCreator } from "@/components/admin/enhanced-survey-creator"
import { StudentEnrollmentManager } from "@/components/admin/student-enrollment-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface School {
  id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

export default function SchoolSpecificAdminDashboard() {
  const params = useParams()
  const schoolSlug = params.school as string
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleUserCreated = () => {
    setRefreshKey((prev) => prev + 1)
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

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome to {school.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">School Management Dashboard</p>
          </div>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="onboarding">Users</TabsTrigger>
            <TabsTrigger value="users">Manage</TabsTrigger>
            <TabsTrigger value="codes">Admin Codes</TabsTrigger>
            <TabsTrigger value="teacher-codes">Teacher Codes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <SetupGuide />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectsManager />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesManager />
          </TabsContent>

          <TabsContent value="enrollments">
            <StudentEnrollmentManager />
          </TabsContent>

          <TabsContent value="surveys">
            <EnhancedSurveyCreator />
          </TabsContent>

          <TabsContent value="onboarding">
            <OnboardingForm onSuccess={handleUserCreated} />
          </TabsContent>

          <TabsContent value="users" key={refreshKey}>
            <UsersTable />
          </TabsContent>

          <TabsContent value="codes">
            <AdminCodesManager />
          </TabsContent>

          <TabsContent value="teacher-codes">
            <TeacherCodesManager />
          </TabsContent>

          <TabsContent value="analytics">
            <SurveyAnalytics />
          </TabsContent>
        </Tabs>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks for {school.name}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <p className="text-sm text-muted-foreground">Use the profile menu in the header to logout</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

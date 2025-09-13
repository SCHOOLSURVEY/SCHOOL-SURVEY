"use client"

import { useState } from "react"
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

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUserCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-almost-black">SchoolSurvey Admin Dashboard</h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Manage surveys, users, courses, and view analytics</p>
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
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <p className="text-sm text-muted-foreground">Use the profile menu in the header to logout</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

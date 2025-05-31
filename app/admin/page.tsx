"use client"

import { useState } from "react"
import { OnboardingForm } from "@/components/admin/onboarding-form"
import { UsersTable } from "@/components/admin/users-table"
import { SurveyAnalytics } from "@/components/analytics/survey-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetupGuide } from "@/components/admin/setup-guide"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminCodesManager } from "@/components/admin/admin-codes-manager"
import { SubjectsManager } from "@/components/admin/subjects-manager"
import { CoursesManager } from "@/components/admin/courses-manager"
import { EnhancedSurveyCreator } from "@/components/admin/enhanced-survey-creator"
import { StudentEnrollmentManager } from "@/components/admin/student-enrollment-manager"
import { LogoutButton } from "@/components/auth/logout-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUserCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">School Management Dashboard</h1>
            <p className="text-muted-foreground">Manage users, courses, and view analytics</p>
          </div>
          <LogoutButton variant="destructive" />
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="onboarding">Users</TabsTrigger>
            <TabsTrigger value="users">Manage</TabsTrigger>
            <TabsTrigger value="codes">Codes</TabsTrigger>
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
            <LogoutButton variant="outline" size="sm" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

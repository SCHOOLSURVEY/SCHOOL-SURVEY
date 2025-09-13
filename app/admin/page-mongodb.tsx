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
import { SchoolManagement } from "@/components/admin/school-management-mongodb"
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
            <p className="text-almost-black/70 mt-1">
              Manage your school's survey system, users, and analytics
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-almost-black">Quick Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-almost-black">Get Started</div>
                  <p className="text-xs text-almost-black/70 mt-1">
                    Complete the setup process to configure your school
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-almost-black">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-green">Online</div>
                  <p className="text-xs text-almost-black/70 mt-1">
                    MongoDB connection active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-almost-black">Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-royal-blue">MongoDB</div>
                  <p className="text-xs text-almost-black/70 mt-1">
                    Migration completed successfully
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SetupGuide />
              <SurveyAnalytics />
            </div>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <SchoolManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OnboardingForm onUserCreated={handleUserCreated} />
              <UsersTable key={refreshKey} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminCodesManager />
              <TeacherCodesManager />
            </div>
          </TabsContent>

          <TabsContent value="surveys" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedSurveyCreator />
              <SubjectsManager />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CoursesManager />
              <StudentEnrollmentManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}


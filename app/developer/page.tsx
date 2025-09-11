"use client"

import { useState, useEffect } from "react"
import { SchoolManagement } from "@/components/admin/school-management"
import { SchoolSpecificAdminCodesManager } from "@/components/admin/school-specific-admin-codes-manager"
import { DeveloperAuth } from "@/components/auth/developer-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Key, AlertTriangle, Info, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DeveloperPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if developer is already authenticated
    const authStatus = sessionStorage.getItem("developer_authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("developer_authenticated")
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <DeveloperAuth onAuthenticated={handleAuthenticated} />
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-4">Developer Setup</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Create schools and manage school-specific administrators for the multi-tenant system.
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Developer Access Only:</strong> This page is for system developers to create schools and initial administrators. 
            Each school operates independently with complete data isolation.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Tabs defaultValue="schools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schools" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>School Management</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Admin Codes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schools">
            <SchoolManagement />
          </TabsContent>

          <TabsContent value="admins">
            <SchoolSpecificAdminCodesManager />
          </TabsContent>
        </Tabs>

        {/* Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>School Management</span>
              </CardTitle>
              <CardDescription>
                Create and manage schools in the multi-tenant system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">What you can do:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create new schools with complete details</li>
                  <li>• Set school-specific information (name, address, contact)</li>
                  <li>• Create school-specific administrators</li>
                  <li>• View school statistics and user counts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Process:</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Create a new school</li>
                  <li>Create an admin for that school</li>
                  <li>Share the admin code with the school</li>
                  <li>School admin can then manage their teachers</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Admin Code Management</span>
              </CardTitle>
              <CardDescription>
                View and manage administrator access codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">What you can do:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View all admin codes across schools</li>
                  <li>• Regenerate admin codes if lost</li>
                  <li>• Toggle code visibility for security</li>
                  <li>• Copy codes to share with schools</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Security:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Admin codes are unique across all schools</li>
                  <li>• Codes are generated using secure UUID format</li>
                  <li>• Only developers can regenerate admin codes</li>
                  <li>• School admins can regenerate teacher codes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Tenant Information */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="h-5 w-5" />
              <span>Multi-Tenant Architecture</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Understanding the school isolation system
            </CardDescription>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Data Isolation:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Each school has completely separate data</li>
                  <li>• Users can only see data from their school</li>
                  <li>• No data mixing between schools</li>
                  <li>• Row Level Security (RLS) enforced</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Access Control:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Developers: Create schools and admins</li>
                  <li>• School Admins: Manage their school only</li>
                  <li>• Teachers: Access their school's data only</li>
                  <li>• Students: Access their own data only</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

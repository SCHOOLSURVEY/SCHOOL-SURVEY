"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DeveloperSetup } from "@/components/admin/developer-setup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  // Simple password protection for setup page
  const SETUP_PASSWORD = "SCHOOL_SETUP_2024" // Change this to your preferred password

  useEffect(() => {
    // Check if already authenticated in this session
    const setupAuth = sessionStorage.getItem("setup_authenticated")
    if (setupAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SETUP_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem("setup_authenticated", "true")
      setError("")
    } else {
      setError("Invalid setup password")
    }
  }

  const handleBackToHome = () => {
    sessionStorage.removeItem("setup_authenticated")
    router.push("/")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Developer Setup Access</CardTitle>
            <CardDescription>Enter the setup password to access the administrator creation interface</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Restricted Access</AlertTitle>
              <AlertDescription>
                This page is for initial system setup only. Contact your developer for the setup password.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-password">Setup Password</Label>
                <Input
                  id="setup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter setup password"
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <Button type="submit" className="w-full">
                Access Setup Interface
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button variant="link" onClick={handleBackToHome}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">School Management Setup</h1>
                <p className="text-muted-foreground">Developer interface for initial system configuration</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBackToHome}>
              Exit Setup
            </Button>
          </div>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Setup Instructions</AlertTitle>
          <AlertDescription className="text-blue-700">
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Create administrator accounts using the form below</li>
              <li>Each admin will receive a unique access code (ADM-XXXXXXXX format)</li>
              <li>Share the codes securely with the respective administrators</li>
              <li>Admins will use their codes (not email) to log into the system</li>
              <li>After setup, restrict access to this page in production</li>
            </ol>
          </AlertDescription>
        </Alert>

        <DeveloperSetup />
      </div>
    </div>
  )
}

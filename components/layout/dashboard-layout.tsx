"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "./header"
import { Breadcrumb } from "./breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, LogOut } from "lucide-react"
import type { User } from "@/lib/types"
import { SessionManager } from "@/lib/session-manager"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "teacher" | "student" | "parent"
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, requiredRole }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Initialize session manager first
    SessionManager.initialize()
    
    // Use SessionManager to get and validate user
    const user = SessionManager.getCurrentUser()
    
    if (user) {
      // Validate session against current URL
      const validation = SessionManager.validateSession(window.location.pathname)
      
      if (!validation.isValid) {
        // Check if it's a role mismatch (user exists but wrong role)
        if (validation.error?.includes("Role mismatch")) {
          setCurrentUser(user) // Keep the user, just redirect them
        } else {
          // Other validation failures (no user, expired session, etc.)
          SessionManager.clearSession()
          setCurrentUser(null)
          setShouldRedirect(true)
          setRedirectPath("/school-select")
        }
      } else {
        setCurrentUser(user)
      }
    } else {
      setCurrentUser(null)
      setShouldRedirect(true)
      // Extract school slug from current path
      const pathParts = window.location.pathname.split("/")
      const schoolSlug = pathParts[1]
      
      if (schoolSlug && schoolSlug !== "auth") {
        setRedirectPath(`/${schoolSlug}/auth/login`)
      } else {
        setRedirectPath("/school-select")
      }
    }
    setLoading(false)
  }, [])

  // Handle redirects
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath)
    }
  }, [shouldRedirect, redirectPath, router])

  // Handle role-based redirects
  useEffect(() => {
    if (currentUser && requiredRole && currentUser.role !== requiredRole) {
      const pathParts = window.location.pathname.split("/")
      const schoolSlug = pathParts[1]
      
      if (schoolSlug && schoolSlug !== "auth") {
        router.push(`/${schoolSlug}/${currentUser.role}`)
      } else {
        router.push("/school-select")
      }
    }
  }, [currentUser, requiredRole, router])

  const handleLogout = () => {
    // Extract school slug from current path before clearing session
    const pathParts = window.location.pathname.split("/")
    const schoolSlug = pathParts[1]
    
    SessionManager.clearSession()
    
    // Redirect to the school-specific login page
    if (schoolSlug && schoolSlug !== "auth") {
      router.push(`/${schoolSlug}/auth/login`)
    } else {
      router.push("/school-select")
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting state
  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Show redirecting state for role mismatch
  if (currentUser && requiredRole && currentUser.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <Breadcrumb />
        <div className="space-y-6 sm:space-y-8">
          {children}
        </div>
      </main>
    </div>
  )
}

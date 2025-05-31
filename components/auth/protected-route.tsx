"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("admin" | "teacher" | "student")[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/" }: ProtectedRouteProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("currentUser")

    if (!userData) {
      router.push(redirectTo)
      return
    }

    const user = JSON.parse(userData)
    setCurrentUser(user)

    // Check if user has allowed role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      switch (user.role) {
        case "admin":
          router.push("/admin")
          break
        case "teacher":
          router.push("/teacher")
          break
        case "student":
          router.push("/student")
          break
        default:
          router.push(redirectTo)
      }
      return
    }

    setLoading(false)
  }, [allowedRoles, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return <>{children}</>
}

"use client"

import { useState, useEffect } from "react"
import { StudentAssignmentsList } from "@/components/student/assignments-list"
import { DatabaseService } from "@/lib/database-client"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function StudentAssignmentsPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError("Authentication error. Please log in again.")
          return
        }

        if (!session) {
          // Not logged in, redirect to login
          router.push("/auth/login")
          return
        }

        // Get user profile from your users table
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, role")
          .eq("email", session.user.email)
          .single()

        if (userError) {
          console.error("Error fetching user:", userError)
          setError("Could not retrieve your user profile.")
          return
        }

        if (!user) {
          setError("User profile not found.")
          return
        }

        if (user.role !== "student") {
          setError("This page is only accessible to students.")
          return
        }

        setStudentId(user.id)
      } catch (error) {
        console.error("Error getting current user:", error)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center p-8">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!studentId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center p-8">
          <div className="text-center">
            <p>Please log in to view your assignments.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>
      <StudentAssignmentsList studentId={studentId} />
    </div>
  )
}

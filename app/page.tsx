"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { WelcomeFlow } from "@/components/onboarding/welcome-flow"
import type { User } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem("currentUser")
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome")

    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)

      // Show welcome flow for new users who haven't seen it
      if (!hasSeenWelcome) {
        setShowWelcome(true)
      } else {
        // Redirect to appropriate dashboard
        redirectToDashboard(user.role)
      }
    }
    setLoading(false)
  }, [])

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case "admin":
        router.push("/admin")
        break
      case "teacher":
        router.push("/teacher")
        break
      case "student":
        router.push("/student")
        break
    }
  }

  const handleWelcomeComplete = () => {
    localStorage.setItem("hasSeenWelcome", "true")
    setShowWelcome(false)
    if (currentUser) {
      redirectToDashboard(currentUser.role)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (currentUser && showWelcome) {
    return <WelcomeFlow user={currentUser} onComplete={handleWelcomeComplete} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}

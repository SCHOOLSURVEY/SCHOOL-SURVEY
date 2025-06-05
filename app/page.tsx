"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
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
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)

        // Show welcome flow for new users who haven't seen it
        if (!hasSeenWelcome) {
          setShowWelcome(true)
        } else {
          // Redirect to appropriate dashboard
          redirectToDashboard(user.role)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("currentUser")
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gray-150 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle animation-delay-4000"></div>
        </div>

        {/* Geometric Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Subtle Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (currentUser && showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gray-150 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle animation-delay-4000"></div>
        </div>

        {/* Geometric Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Subtle Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md relative z-10 border border-gray-200">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {currentUser.full_name}!</h1>
            <p className="text-gray-600">
              Your account has been created successfully. You're now ready to access the School Management System.
            </p>
          </div>
          <button
            onClick={handleWelcomeComplete}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium transform hover:scale-[1.02]"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gray-150 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob-subtle animation-delay-4000"></div>
      </div>

      {/* Geometric Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Subtle Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Rotating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/6 right-1/6 w-4 h-4 border border-gray-300 opacity-20 animate-spin-slow"></div>
        <div
          className="absolute bottom-1/6 left-1/6 w-3 h-3 border border-gray-400 opacity-20 animate-spin-slow animation-delay-3000"
          style={{ animationDirection: "reverse" }}
        ></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-gray-300 opacity-30 animate-pulse animation-delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}

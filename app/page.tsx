"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"

export default function HomePage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const handleRedirect = () => {
      // Check if user is already logged in
      const currentUser = SessionManager.getCurrentUser()
      
      if (currentUser) {
        // User is logged in, redirect to their dashboard
        router.push(`/tech-academy/${currentUser.role}`)
      } else {
        // User is not logged in, redirect to login
        router.push("/tech-academy/auth/login")
      }
    }

    // Add a small delay to prevent rapid redirects
    const timer = setTimeout(() => {
      setIsRedirecting(true)
      handleRedirect()
    }, 500) // Increased delay to 500ms

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">
          {isRedirecting ? "Redirecting..." : "Loading..."}
        </p>
      </div>
    </div>
  )
}

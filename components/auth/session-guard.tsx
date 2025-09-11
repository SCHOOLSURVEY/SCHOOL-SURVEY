"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"

interface SessionGuardProps {
  children: React.ReactNode
}

export function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Skip validation for login/register pages, root, and school-select
    if (pathname.includes("/auth/") || pathname === "/" || pathname.includes("/school-select")) {
      return
    }

    // Only validate for dashboard pages (admin, teacher, student, parent)
    if (!pathname.includes("/admin") && !pathname.includes("/teacher") && 
        !pathname.includes("/student") && !pathname.includes("/parent")) {
      return
    }

    // Extract school slug from pathname for proper redirect
    const pathParts = pathname.split("/")
    const schoolSlug = pathParts[1] // Should be the school slug

    // Validate current session
    const user = SessionManager.getCurrentUser()
    if (!user) {
      console.log("No user session found, redirecting to school login")
      if (schoolSlug && schoolSlug !== "auth") {
        router.push(`/${schoolSlug}/auth/login`)
      } else {
        router.push("/")
      }
      return
    }

    // Validate session against current path
    const validation = SessionManager.validateSession(pathname)
    if (!validation.isValid) {
      console.error("Session validation failed:", validation.error)
      SessionManager.clearSession()
      if (schoolSlug && schoolSlug !== "auth") {
        router.push(`/${schoolSlug}/auth/login`)
      } else {
        router.push("/")
      }
      return
    }

    console.log("Session validated successfully for:", user.email, "Role:", user.role)
  }, [pathname, router])

  return <>{children}</>
}

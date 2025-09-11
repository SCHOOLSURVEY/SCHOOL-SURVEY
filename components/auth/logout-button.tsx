"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  className?: string
}

export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = true,
  className = "",
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = () => {
    // Extract school slug from current path before clearing session
    const pathParts = window.location.pathname.split("/")
    const schoolSlug = pathParts[1]
    
    // Clear all user data
    localStorage.removeItem("currentUser")
    localStorage.removeItem("hasSeenWelcome")

    // Redirect to the school-specific login page
    if (schoolSlug && schoolSlug !== "auth") {
      router.push(`/${schoolSlug}/auth/login`)
    } else {
      router.push("/school-select")
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className={className}>
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      Logout
    </Button>
  )
}

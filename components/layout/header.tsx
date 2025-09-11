"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/auth/logout-button"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { MobileNavigation } from "./mobile-navigation"
import type { User as UserType } from "@/lib/types"
import { SessionManager } from "@/lib/session-manager"

export function Header() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const router = useRouter()

  useEffect(() => {
    const user = SessionManager.getCurrentUser()
    setCurrentUser(user)
  }, [])

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700"
      case "teacher":
        return "bg-blue-100 text-blue-700"
      case "student":
        return "bg-green-100 text-green-700"
      case "parent":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!currentUser) {
    return null
  }

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <MobileNavigation currentUser={currentUser} />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold truncate">School Management System</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {currentUser.role === "admin" && "Administrator Dashboard"}
                {currentUser.role === "teacher" && "Teacher Dashboard"}
                {currentUser.role === "student" && "Student Dashboard"}
                {currentUser.role === "parent" && "Parent Portal"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop: Show user info */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{currentUser.full_name}</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">ID: {currentUser.unique_id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(currentUser.role)}`}>
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </span>
              </div>
            </div>

            {/* Mobile: Show role badge */}
            <div className="sm:hidden">
              <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(currentUser.role)}`}>
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </span>
            </div>

            {/* Notification Center */}
            <NotificationCenter userId={currentUser.id} />

            {/* Quick Logout Button - Hidden on mobile */}
            <div className="hidden sm:block">
              <LogoutButton variant="ghost" size="sm" />
            </div>

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs sm:text-sm">
                      {getInitials(currentUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{currentUser.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  <p className="text-xs leading-none text-muted-foreground sm:hidden">ID: {currentUser.unique_id}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

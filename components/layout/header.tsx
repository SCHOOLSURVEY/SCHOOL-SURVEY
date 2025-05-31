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
import type { User as UserType } from "@/lib/types"

export function Header() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("hasSeenWelcome")
    router.push("/")
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
    <header className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">School Management System</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser.role === "admin" && "Administrator Dashboard"}
              {currentUser.role === "teacher" && "Teacher Dashboard"}
              {currentUser.role === "student" && "Student Dashboard"}
              {currentUser.role === "parent" && "Parent Portal"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser.full_name}</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">ID: {currentUser.unique_id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(currentUser.role)}`}>
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </span>
              </div>
            </div>

            {/* Notification Center */}
            <NotificationCenter userId={currentUser.id} />

            {/* Quick Logout Button */}
            <LogoutButton variant="ghost" size="sm" />

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(currentUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{currentUser.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
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

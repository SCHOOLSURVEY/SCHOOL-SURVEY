"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessagingSystem } from "@/components/shared/messaging-system"
import { CalendarSystem } from "@/components/shared/calendar-system"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { DatabaseService } from "@/lib/database-client"
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  Settings, 
  LogOut, 
  User, 
  Menu,
  X,
  Home,
  BookOpen,
  Users,
  FileText,
  BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { User as UserType } from "@/lib/types"

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "teacher" | "student" | "parent"
  currentTab?: string
  onTabChange?: (tab: string) => void
}

export function EnhancedDashboardLayout({ 
  children, 
  requiredRole, 
  currentTab = "dashboard",
  onTabChange 
}: EnhancedDashboardLayoutProps) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(currentTab)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      
      // Check role access
      if (requiredRole && user.role !== requiredRole) {
        router.push("/")
        return
      }
    } else {
      router.push("/")
    }
  }, [requiredRole, router])

  useEffect(() => {
    setActiveTab(currentTab)
  }, [currentTab])

  const handleLogout = () => {
    // Extract school slug from current path before clearing session
    const pathParts = window.location.pathname.split("/")
    const schoolSlug = pathParts[1]
    
    localStorage.removeItem("currentUser")
    localStorage.removeItem("hasSeenWelcome")
    
    // Redirect to the school-specific login page
    if (schoolSlug && schoolSlug !== "auth") {
      router.push(`/${schoolSlug}/auth/login`)
    } else {
      router.push("/school-select")
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const getNavigationItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: Home, href: `/${currentUser?.role}` },
    ]

    if (currentUser?.role === "admin") {
      return [
        ...baseItems,
        { id: "users", label: "Users", icon: Users, href: "/admin" },
        { id: "courses", label: "Courses", icon: BookOpen, href: "/admin" },
        { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin" },
      ]
    }

    if (currentUser?.role === "teacher") {
      return [
        ...baseItems,
        { id: "assignments", label: "Assignments", icon: FileText, href: "/teacher" },
        { id: "gradebook", label: "Gradebook", icon: BarChart3, href: "/teacher" },
        { id: "attendance", label: "Attendance", icon: Users, href: "/teacher" },
        { id: "courses", label: "Courses", icon: BookOpen, href: "/teacher" },
      ]
    }

    if (currentUser?.role === "student") {
      return [
        ...baseItems,
        { id: "assignments", label: "Assignments", icon: FileText, href: "/student/assignments" },
        { id: "attendance", label: "Attendance", icon: Users, href: "/student" },
        { id: "courses", label: "Courses", icon: BookOpen, href: "/student" },
      ]
    }

    if (currentUser?.role === "parent") {
      return [
        ...baseItems,
        { id: "children", label: "My Children", icon: Users, href: "/parent" },
        { id: "attendance", label: "Attendance", icon: Users, href: "/parent" },
      ]
    }

    return baseItems
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">School System</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {getNavigationItems().map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    handleTabChange(item.id)
                    setSidebarOpen(false)
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(currentUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {currentUser.role} Dashboard
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="hidden md:block">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="messages" className="text-xs">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs">
                    <Calendar className="h-4 w-4 mr-1" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="text-xs">
                    <Bell className="h-4 w-4 mr-1" />
                    Alerts
                  </TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-xs">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(currentUser.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{currentUser.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-6">
          {activeTab === "dashboard" && children}
          
          {activeTab === "messages" && currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Messages</span>
                </CardTitle>
                <CardDescription>Communicate with other users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <MessagingSystem currentUserId={currentUser.id} userRole={currentUser.role} />
              </CardContent>
            </Card>
          )}

          {activeTab === "calendar" && currentUser && (
            <CalendarSystem currentUserId={currentUser.id} userRole={currentUser.role} />
          )}

          {activeTab === "notifications" && currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>Stay updated with important announcements and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationCenter userId={currentUser.id} />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}


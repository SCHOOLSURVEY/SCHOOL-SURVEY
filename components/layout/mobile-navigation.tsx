"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu, Home, Users, BookOpen, Settings, LogOut, BarChart3, FileText, GraduationCap, UserCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User as UserType } from "@/lib/types"

interface MobileNavigationProps {
  currentUser: UserType | null
}

export function MobileNavigation({ currentUser }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  if (!currentUser) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("hasSeenWelcome")
    setIsOpen(false)
    router.push("/")
  }

  const getNavigationItems = () => {
    switch (currentUser.role) {
      case "admin":
        return [
          { href: "/admin", label: "Dashboard", icon: Home },
          { href: "/admin", label: "Users", icon: Users },
          { href: "/admin", label: "Courses", icon: BookOpen },
          { href: "/admin", label: "Settings", icon: Settings },
        ]
      case "teacher":
        return [
          { href: "/teacher", label: "Dashboard", icon: Home },
          { href: "/teacher", label: "Assignments", icon: FileText },
          { href: "/teacher", label: "Gradebook", icon: BookOpen },
          { href: "/teacher", label: "Surveys", icon: UserCheck },
          { href: "/teacher", label: "Analytics", icon: BarChart3 },
          { href: "/teacher", label: "My Courses", icon: GraduationCap },
        ]
      case "student":
        return [
          { href: "/student", label: "Dashboard", icon: Home },
          { href: "/student/assignments", label: "Assignments", icon: FileText },
        ]
      case "parent":
        return [
          { href: "/parent", label: "Dashboard", icon: Home },
        ]
      default:
        return [
          { href: "/", label: "Home", icon: Home },
        ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Use this menu to navigate through the application
        </SheetDescription>
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-medium text-sm">
                  {currentUser.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{currentUser.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                <p className="text-xs text-muted-foreground">ID: {currentUser.unique_id}</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={`${item.href}-${item.label}-${index}`}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Log out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

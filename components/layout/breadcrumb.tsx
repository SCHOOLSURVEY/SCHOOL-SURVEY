"use client"

import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const getBreadcrumbName = (segment: string) => {
    switch (segment) {
      case "admin":
        return "Administration"
      case "teacher":
        return "Teacher Dashboard"
      case "student":
        return "Student Dashboard"
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
  }

  if (pathname === "/") {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 overflow-x-auto">
      <Link href="/" className="flex items-center hover:text-foreground flex-shrink-0">
        <Home className="h-3 w-3 sm:h-4 sm:w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/")
        const isLast = index === segments.length - 1

        return (
          <div key={segment} className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-none">
                {getBreadcrumbName(segment)}
              </span>
            ) : (
              <Link href={href} className="hover:text-foreground truncate max-w-[100px] sm:max-w-none">
                {getBreadcrumbName(segment)}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

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
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link href="/" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/")
        const isLast = index === segments.length - 1

        return (
          <div key={segment} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="text-foreground font-medium">{getBreadcrumbName(segment)}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {getBreadcrumbName(segment)}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

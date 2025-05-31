import type React from "react"
import { Header } from "./header"
import { Breadcrumb } from "./breadcrumb"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "teacher" | "student"
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, requiredRole }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-6">
        <Breadcrumb />
        {children}
      </main>
    </div>
  )
}

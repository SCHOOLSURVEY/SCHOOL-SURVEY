"use client"

import { useState, useEffect } from "react"
import { ParentDashboard } from "@/components/parent/parent-dashboard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import type { User } from "@/lib/types"

export default function ParentPortal() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current user from localStorage (in a real app, use proper auth)
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    return <div>Please log in to access the parent portal.</div>
  }

  return (
    <DashboardLayout requiredRole="parent">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Parent Portal</h1>
            <p className="text-muted-foreground">Welcome, {currentUser.full_name}</p>
            <p className="text-sm text-muted-foreground">ID: {currentUser.unique_id}</p>
          </div>
        </div>

        <ParentDashboard parentId={currentUser.id} />
      </div>
    </DashboardLayout>
  )
}

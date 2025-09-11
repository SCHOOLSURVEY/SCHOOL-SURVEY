"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertTriangle, User, School } from "lucide-react"
import type { User as UserType } from "@/lib/types"

export function UserContextDebugger() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [localStorageData, setLocalStorageData] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const refreshData = () => {
    const userData = localStorage.getItem("currentUser")
    setLocalStorageData(userData)
    
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        setDebugInfo({
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          localStorageKeys: Object.keys(localStorage),
        })
      } catch (error) {
        console.error("Error parsing user data:", error)
        setCurrentUser(null)
      }
    } else {
      setCurrentUser(null)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  if (process.env.NODE_ENV === "production") {
    return null // Don't show in production
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          <span>User Context Debugger</span>
        </CardTitle>
        <CardDescription className="text-orange-700">
          Development tool to debug user session issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button onClick={refreshData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="outline" className="text-xs">
            {currentUser ? "User Found" : "No User"}
          </Badge>
        </div>

        {currentUser ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {currentUser.full_name}
              </div>
              <div>
                <strong>Email:</strong> {currentUser.email}
              </div>
              <div>
                <strong>Role:</strong> 
                <Badge className="ml-2" variant={
                  currentUser.role === "admin" ? "destructive" :
                  currentUser.role === "teacher" ? "default" :
                  currentUser.role === "student" ? "secondary" : "outline"
                }>
                  {currentUser.role}
                </Badge>
              </div>
              <div>
                <strong>ID:</strong> {currentUser.unique_id}
              </div>
              <div>
                <strong>School ID:</strong> {currentUser.school_id}
              </div>
              <div>
                <strong>Active:</strong> {currentUser.is_active ? "Yes" : "No"}
              </div>
            </div>

            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                <strong>Current URL:</strong> {window.location.href}<br />
                <strong>Expected Role:</strong> {window.location.pathname.includes("/admin") ? "admin" : 
                                                window.location.pathname.includes("/teacher") ? "teacher" : 
                                                window.location.pathname.includes("/student") ? "student" : "unknown"}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No user data found in localStorage. User needs to log in.
            </AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="text-xs text-muted-foreground">
            <strong>Debug Info:</strong><br />
            Timestamp: {debugInfo.timestamp}<br />
            LocalStorage Keys: {debugInfo.localStorageKeys.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

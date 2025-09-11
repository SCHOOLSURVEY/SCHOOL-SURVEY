"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Trash2 } from "lucide-react"
import { SessionManager } from "@/lib/session-manager"

export function LocalStorageDebugger() {
  const [localStorageData, setLocalStorageData] = useState<any>({})

  const refreshData = () => {
    if (typeof window === "undefined") return
    
    const data: any = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "{}")
        } catch {
          data[key] = localStorage.getItem(key)
        }
      }
    }
    setLocalStorageData(data)
  }

  const clearAll = () => {
    if (typeof window === "undefined") return
    localStorage.clear()
    refreshData()
  }

  const clearSession = () => {
    SessionManager.forceClearSession()
    refreshData()
  }

  useEffect(() => {
    refreshData()
  }, [])

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800">
          <RefreshCw className="h-5 w-5" />
          <span>LocalStorage Debugger</span>
        </CardTitle>
        <CardDescription className="text-red-700">
          Development tool to inspect localStorage contents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button onClick={refreshData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearSession} size="sm" variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Session
          </Button>
          <Button onClick={clearAll} size="sm" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Badge variant="outline" className="text-xs">
            {Object.keys(localStorageData).length} items
          </Badge>
        </div>

        <div className="space-y-2">
          {Object.keys(localStorageData).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data in localStorage</p>
          ) : (
            Object.entries(localStorageData).map(([key, value]) => (
              <div key={key} className="border rounded p-2 text-xs">
                <div className="font-medium text-red-800">{key}</div>
                <pre className="text-xs text-red-700 mt-1 overflow-auto max-h-32">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

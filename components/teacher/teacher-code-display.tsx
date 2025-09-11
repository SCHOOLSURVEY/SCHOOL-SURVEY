"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Key, Eye, EyeOff, Copy, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@/lib/types"

interface TeacherCodeDisplayProps {
  user: User
}

export function TeacherCodeDisplay({ user }: TeacherCodeDisplayProps) {
  const [showCode, setShowCode] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  const copyToClipboard = async () => {
    if (user.teacher_code) {
      try {
        await navigator.clipboard.writeText(user.teacher_code)
        setHasCopied(true)
        toast.success("Teacher code copied to clipboard!")
        
        // Reset the copied state after 2 seconds
        setTimeout(() => setHasCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
        toast.error("Failed to copy code")
      }
    }
  }

  if (!user.teacher_code) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span>No Teacher Code</span>
          </CardTitle>
          <CardDescription className="text-yellow-700">
            You don't have a teacher code yet. Please contact your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-300 bg-yellow-100">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Action Required:</strong> Contact your school administrator to get your teacher code. 
              You'll need this code to log in to the system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Key className="h-5 w-5" />
          <span>Your Teacher Code</span>
        </CardTitle>
        <CardDescription className="text-blue-700">
          Use this code to log in to the system. Keep it safe and don't share it with others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-blue-800 mb-2 block">
              Teacher Code
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 rounded-lg border border-blue-300 bg-white p-3 font-mono text-lg font-bold text-gray-900">
                {showCode ? user.teacher_code : "••••••••"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="border-blue-300 hover:bg-blue-100"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className={`border-blue-300 hover:bg-blue-100 ${
                  hasCopied ? "bg-green-100 border-green-300" : ""
                }`}
              >
                {hasCopied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {user.role}
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {user.full_name}
            </Badge>
          </div>
        </div>

        <Alert className="border-blue-300 bg-blue-100">
          <Key className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important:</strong> Save this code in a secure place. You'll use it every time you log in. 
            If you lose your code, contact your administrator to get a new one.
          </AlertDescription>
        </Alert>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Login Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to the login page</li>
            <li>Select "Teacher" mode</li>
            <li>Enter your teacher code (not your email)</li>
            <li>Click "Sign In"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}


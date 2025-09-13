"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, BookOpen, Users, BarChart3 } from "lucide-react"
import { DatabaseService } from "@/lib/database-client"

export function SetupGuide() {
  const [setupStatus, setSetupStatus] = useState({
    hasSubjects: false,
    hasTeachers: false,
    hasStudents: false,
    hasCourses: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Check for subjects, teachers, students, and courses using MongoDB
      const [subjects, teachers, students, courses] = await Promise.all([
        DatabaseService.getSubjectsBySchool(schoolId),
        DatabaseService.getUsersByRole(schoolId, 'teacher'),
        DatabaseService.getUsersByRole(schoolId, 'student'),
        DatabaseService.getCoursesBySchool(schoolId)
      ])

      setSetupStatus({
        hasSubjects: (subjects?.length || 0) > 0,
        hasTeachers: (teachers?.length || 0) > 0,
        hasStudents: (students?.length || 0) > 0,
        hasCourses: (courses?.length || 0) > 0,
      })
    } catch (error) {
      console.error("Error checking setup status:", error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return <div>Loading setup guide...</div>
  }

  const setupSteps = [
    {
      title: "Create Subjects",
      description: "Add subjects that will be taught in your school",
      completed: setupStatus.hasSubjects,
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Onboard Teachers",
      description: "Add teachers who will manage courses and create surveys",
      completed: setupStatus.hasTeachers,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Onboard Students",
      description: "Add students who will participate in surveys",
      completed: setupStatus.hasStudents,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Create Courses",
      description: "Assign teachers to subjects and create course schedules",
      completed: setupStatus.hasCourses,
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ]

  const completedSteps = setupSteps.filter((step) => step.completed).length
  const isSetupComplete = completedSteps === setupSteps.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Setup Guide</CardTitle>
        <CardDescription>
          Complete these steps to get your school management system ready ({completedSteps}/{setupSteps.length}{" "}
          completed)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {setupSteps.map((step, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 mt-0.5">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {step.icon}
                <h3 className={`font-medium ${step.completed ? "text-green-700" : "text-gray-900"}`}>{step.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            </div>
          </div>
        ))}


        {isSetupComplete && (
          <div className="pt-4 border-t bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">Setup Complete!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Your school management system is ready to use. Teachers can now create surveys and students can
              participate.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Users, BookOpen, BarChart3, Settings } from "lucide-react"
import type { User } from "@/lib/types"

interface WelcomeFlowProps {
  user: User
  onComplete: () => void
}

export function WelcomeFlow({ user, onComplete }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const getStepsForRole = (role: string) => {
    switch (role) {
      case "admin":
        return [
          {
            title: "Welcome to School Management",
            description: "As an administrator, you have full access to manage the school system.",
            icon: <Settings className="h-8 w-8 text-blue-600" />,
            features: [
              "Onboard new teachers and students",
              "View comprehensive analytics",
              "Manage courses and subjects",
              "Monitor system-wide performance",
            ],
          },
          {
            title: "Getting Started",
            description: "Here's what you can do first:",
            icon: <Users className="h-8 w-8 text-green-600" />,
            features: [
              "Add teachers and students to the system",
              "Create subjects and courses",
              "Set up class schedules",
              "Configure survey templates",
            ],
          },
        ]
      case "teacher":
        return [
          {
            title: "Welcome, Educator!",
            description: "You now have access to manage your courses and track student feedback.",
            icon: <BookOpen className="h-8 w-8 text-purple-600" />,
            features: [
              "View your assigned courses",
              "Create weekly/term surveys",
              "Monitor student feedback",
              "Access teaching analytics",
            ],
          },
          {
            title: "Next Steps",
            description: "To get started with your teaching dashboard:",
            icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
            features: [
              "Wait for course assignments from admin",
              "Create your first student survey",
              "Review feedback analytics",
              "Engage with student responses",
            ],
          },
        ]
      case "student":
        return [
          {
            title: "Welcome, Student!",
            description: "Help improve your learning experience by participating in surveys.",
            icon: <CheckCircle className="h-8 w-8 text-green-600" />,
            features: [
              "Complete weekly course surveys",
              "Rate teaching effectiveness",
              "Provide constructive feedback",
              "Help improve education quality",
            ],
          },
          {
            title: "How It Works",
            description: "Your participation makes a difference:",
            icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
            features: [
              "Surveys appear when available",
              "Your responses are anonymous",
              "Feedback helps improve teaching",
              "Complete surveys regularly",
            ],
          },
        ]
      default:
        return []
    }
  }

  const steps = getStepsForRole(user.role)
  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  if (!currentStepData) {
    onComplete()
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{currentStepData.icon}</div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Your Account Details:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {user.full_name}
              </div>
              <div>
                <span className="font-medium">ID:</span> {user.unique_id}
              </div>
              <div>
                <span className="font-medium">Role:</span> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
              {user.class_number && (
                <div>
                  <span className="font-medium">Class:</span> {user.class_number}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">What you can do:</h3>
            <ul className="space-y-2">
              {currentStepData.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full ${index <= currentStep ? "bg-blue-600" : "bg-gray-200"}`}
                />
              ))}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>{currentStep < steps.length - 1 ? "Next" : "Get Started"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { DatabaseService } from "@/lib/database-client"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  School,
  Globe,
  Phone,
  Mail,
} from "lucide-react"

interface OnboardingData {
  schoolName: string
  schoolType: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  website: string
  principalName: string
  principalEmail: string
  totalStudents: string
  totalTeachers: string
  academicYear: string
  terms: string[]
  subjects: string[]
  features: string[]
}

const defaultSubjects = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Literature",
  "Art",
  "Music",
  "Physical Education",
  "Computer Science",
  "Foreign Languages",
]

const defaultFeatures = [
  "Student Management",
  "Teacher Management",
  "Course Management",
  "Assignment Management",
  "Grade Management",
  "Survey System",
  "Attendance Tracking",
  "Parent Portal",
  "Reporting & Analytics",
  "Mobile Access",
]

export function WelcomeFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    schoolName: "",
    schoolType: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    principalName: "",
    principalEmail: "",
    totalStudents: "",
    totalTeachers: "",
    academicYear: "",
    terms: ["Fall", "Spring"],
    subjects: defaultSubjects,
    features: defaultFeatures,
  })

  const router = useRouter()
  const totalSteps = 5

  const updateOnboardingData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Store onboarding data in localStorage for now
      // In a real app, you'd send this to your backend
      localStorage.setItem("onboardingData", JSON.stringify(onboardingData))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to admin setup
      router.push("/admin")
    } catch (error) {
      console.error("Error saving onboarding data:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <School className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Welcome to Your School Management System</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's get your school set up with a comprehensive management system. This will only take a few minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name *</Label>
                <Input
                  id="school-name"
                  value={onboardingData.schoolName}
                  onChange={(e) => updateOnboardingData("schoolName", e.target.value)}
                  placeholder="e.g., Lincoln High School"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-type">School Type *</Label>
                <Select
                  value={onboardingData.schoolType}
                  onValueChange={(value) => updateOnboardingData("schoolType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary School</SelectItem>
                    <SelectItem value="middle">Middle School</SelectItem>
                    <SelectItem value="high">High School</SelectItem>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                    <SelectItem value="college">College/University</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academic-year">Academic Year *</Label>
                <Input
                  id="academic-year"
                  value={onboardingData.academicYear}
                  onChange={(e) => updateOnboardingData("academicYear", e.target.value)}
                  placeholder="e.g., 2024-2025"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">School Location & Contact</h2>
              <p className="text-muted-foreground">
                Help us set up your school's contact information and location details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={onboardingData.address}
                  onChange={(e) => updateOnboardingData("address", e.target.value)}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={onboardingData.city}
                  onChange={(e) => updateOnboardingData("city", e.target.value)}
                  placeholder="City"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  value={onboardingData.state}
                  onChange={(e) => updateOnboardingData("state", e.target.value)}
                  placeholder="State or province"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={onboardingData.country}
                  onChange={(e) => updateOnboardingData("country", e.target.value)}
                  placeholder="Country"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={onboardingData.phone}
                  onChange={(e) => updateOnboardingData("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={onboardingData.email}
                  onChange={(e) => updateOnboardingData("email", e.target.value)}
                  placeholder="info@school.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={onboardingData.website}
                  onChange={(e) => updateOnboardingData("website", e.target.value)}
                  placeholder="https://www.school.edu"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">School Leadership</h2>
              <p className="text-muted-foreground">
                Tell us about your school's principal or main administrator.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal-name">Principal/Administrator Name *</Label>
                <Input
                  id="principal-name"
                  value={onboardingData.principalName}
                  onChange={(e) => updateOnboardingData("principalName", e.target.value)}
                  placeholder="Full name of principal or administrator"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principal-email">Principal/Administrator Email *</Label>
                <Input
                  id="principal-email"
                  type="email"
                  value={onboardingData.principalEmail}
                  onChange={(e) => updateOnboardingData("principalEmail", e.target.value)}
                  placeholder="principal@school.edu"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total-students">Total Students (Approximate)</Label>
                  <Input
                    id="total-students"
                    type="number"
                    value={onboardingData.totalStudents}
                    onChange={(e) => updateOnboardingData("totalStudents", e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-teachers">Total Teachers (Approximate)</Label>
                  <Input
                    id="total-teachers"
                    type="number"
                    value={onboardingData.totalTeachers}
                    onChange={(e) => updateOnboardingData("totalTeachers", e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold">Academic Structure</h2>
              <p className="text-muted-foreground">
                Configure your school's academic terms and subjects.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Academic Terms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Fall", "Spring", "Summer", "Winter", "Semester 1", "Semester 2", "Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"].map((term) => (
                    <div key={term} className="flex items-center space-x-2">
                      <Checkbox
                        id={term}
                        checked={onboardingData.terms.includes(term)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateOnboardingData("terms", [...onboardingData.terms, term])
                          } else {
                            updateOnboardingData("terms", onboardingData.terms.filter(t => t !== term))
                          }
                        }}
                      />
                      <Label htmlFor={term} className="text-sm">{term}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subjects Offered</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {defaultSubjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={onboardingData.subjects.includes(subject)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateOnboardingData("subjects", [...onboardingData.subjects, subject])
                          } else {
                            updateOnboardingData("subjects", onboardingData.subjects.filter(s => s !== subject))
                          }
                        }}
                      />
                      <Label htmlFor={subject} className="text-sm">{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">System Features</h2>
              <p className="text-muted-foreground">
                Select the features you'd like to enable for your school.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Available Features</Label>
                <div className="grid grid-cols-1 gap-2">
                  {defaultFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={onboardingData.features.includes(feature)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateOnboardingData("features", [...onboardingData.features, feature])
                          } else {
                            updateOnboardingData("features", onboardingData.features.filter(f => f !== feature))
                          }
                        }}
                      />
                      <Label htmlFor={feature} className="text-sm">{feature}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Ready to Complete Setup</span>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  You're almost done! Click "Complete Setup" to finish configuring your school management system.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.schoolName && onboardingData.schoolType && onboardingData.academicYear
      case 2:
        return onboardingData.address && onboardingData.city && onboardingData.state && onboardingData.country
      case 3:
        return onboardingData.principalName && onboardingData.principalEmail
      case 4:
        return onboardingData.terms.length > 0 && onboardingData.subjects.length > 0
      case 5:
        return onboardingData.features.length > 0
      default:
        return false
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "School Information"
      case 2:
        return "Location & Contact"
      case 3:
        return "Leadership"
      case 4:
        return "Academic Structure"
      case 5:
        return "System Features"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{getStepTitle()}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        </div>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              School Setup Wizard
            </CardTitle>
            <CardDescription className="text-lg">
              Let's configure your school management system step by step
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center space-x-2">
                {currentStep < totalSteps ? (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || loading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Setting up...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Complete Setup</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

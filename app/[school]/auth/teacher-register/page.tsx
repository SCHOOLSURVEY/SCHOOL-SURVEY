"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { createTeacherUser } from "@/lib/admin-setup"
import { CheckCircle, Key, UserPlus, AlertCircle, Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface School {
  id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

export default function SchoolSpecificTeacherRegistration() {
  const params = useParams()
  const schoolSlug = params.school as string
  const router = useRouter()
  
  const [school, setSchool] = useState<School | null>(null)
  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)
  const [showTeacherCode, setShowTeacherCode] = useState(false)
  const [generatedTeacherCode, setGeneratedTeacherCode] = useState("")
  const [createdTeacher, setCreatedTeacher] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    class_number: "",
    department: ""
  })

  // Fetch school information based on slug
  useEffect(() => {
    if (schoolSlug) {
      fetchSchoolInfo()
    }
  }, [schoolSlug])

  const fetchSchoolInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug, abbreviation, primary_color, secondary_color, logo_url")
        .eq("slug", schoolSlug)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setSchool(data)
    } catch (error) {
      console.error("Error fetching school info:", error)
      // Redirect to main page if school not found
      router.push("/")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!school) return
    
    if (!formData.email || !formData.full_name) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      // Create teacher user with generated code for this specific school
      const result = await createTeacherUser({
        email: formData.email,
        full_name: formData.full_name,
        school_id: school.id, // Use the specific school ID
        class_number: formData.class_number,
        department: formData.department
      })

      if (result.success) {
        setCreatedTeacher(result.teacher)
        setGeneratedTeacherCode(result.teacherCode)
        setStep("success")
        toast.success("Teacher account created successfully!")
      } else {
        toast.error(result.error || "Failed to create teacher account")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create teacher account")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const primaryColor = school.primary_color || '#3B82F6'
  const secondaryColor = school.secondary_color || '#1E40AF'

  if (step === "success") {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`
        }}
      >
        <Card className="w-full max-w-2xl border-0 shadow-xl">
          <CardHeader className="text-center" style={{ backgroundColor: `${primaryColor}05` }}>
            {school.logo_url && (
              <div className="mx-auto mb-4">
                <img 
                  src={school.logo_url} 
                  alt={`${school.name} Logo`}
                  className="w-16 h-16 object-contain"
                />
              </div>
            )}
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Welcome to {school.name}, {createdTeacher?.full_name}!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div 
              className="p-4 rounded-lg border-2 border-dashed"
              style={{ 
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium" style={{ color: primaryColor }}>
                  Your Teacher Login Code
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTeacherCode(!showTeacherCode)}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  {showTeacherCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="flex-1 p-3 rounded-md font-mono text-lg font-bold text-center"
                  style={{ 
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor
                  }}
                >
                  {showTeacherCode ? generatedTeacherCode : "••••••••"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedTeacherCode)}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs mt-2" style={{ color: secondaryColor }}>
                ⚠️ Save this code! You'll use it to log in to your teacher dashboard.
              </p>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <Key className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Use this code (not your email) to log in to the system. 
                If you lose this code, contact your school administrator.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => router.push(`/${schoolSlug}/teacher`)}
              >
                Go to Teacher Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                style={{ borderColor: primaryColor, color: primaryColor }}
                onClick={() => router.push(`/${schoolSlug}/auth/login`)}
              >
                Go to Login Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`
      }}
    >
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardHeader className="text-center" style={{ backgroundColor: `${primaryColor}05` }}>
          {school.logo_url && (
            <div className="mx-auto mb-4">
              <img 
                src={school.logo_url} 
                alt={`${school.name} Logo`}
                className="w-16 h-16 object-contain"
              />
            </div>
          )}
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <UserPlus className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <CardTitle className="text-2xl font-bold">Teacher Registration</CardTitle>
          <CardDescription className="text-lg">
            Join {school.name} as a teacher. A unique login code will be generated automatically.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <p className="text-sm font-medium" style={{ color: primaryColor }}>
                  🏫 Registering for: <span className="font-bold">{school.name}</span>
                </p>
                <p className="text-xs mt-1" style={{ color: secondaryColor }}>
                  Your account will be created for {school.name} automatically
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_number">Class/Subject</Label>
                  <Input
                    id="class_number"
                    type="text"
                    value={formData.class_number}
                    onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                    placeholder="e.g., Mathematics, Science"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., STEM, Humanities"
                  />
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Key className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Note:</strong> A unique teacher code will be generated automatically. 
                You'll use this code (not your email) to log in to the system.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full text-white"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Create Teacher Account for ${school.name}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


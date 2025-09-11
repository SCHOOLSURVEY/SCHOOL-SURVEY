"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { createTeacherUser } from "@/lib/admin-setup"
import { CheckCircle, Key, UserPlus, AlertCircle, Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface School {
  id: string
  name: string
  slug: string
  abbreviation: string
}

export function StreamlinedTeacherSignup() {
  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [showTeacherCode, setShowTeacherCode] = useState(false)
  const [generatedTeacherCode, setGeneratedTeacherCode] = useState("")
  const [createdTeacher, setCreatedTeacher] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    school_id: "",
    email: "",
    full_name: "",
    class_number: "",
    department: ""
  })

  const router = useRouter()

  // Fetch schools on component mount
  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      // For regular users (teachers), only show the default school
      // This maintains multi-tenancy while hiding other schools
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug, abbreviation")
        .eq("is_active", true)
        .eq("id", "00000000-0000-0000-0000-000000000001") // Default school only
        .order("name")

      if (error) throw error
      setSchools(data || [])
    } catch (error) {
      console.error("Error fetching schools:", error)
      toast.error("Failed to load schools")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.school_id || !formData.email || !formData.full_name) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      // Create teacher user with generated code
      const result = await createTeacherUser({
        email: formData.email,
        full_name: formData.full_name,
        class_number: formData.class_number || undefined,
        school_id: formData.school_id
      })

      if (result.success) {
        setGeneratedTeacherCode(result.teacherCode || "")
        setCreatedTeacher(result.teacher)
        setStep("success")
        toast.success("Teacher account created successfully!")
      } else {
        toast.error(result.error || "Failed to create teacher account")
      }
    } catch (error) {
      console.error("Error creating teacher:", error)
      toast.error("Failed to create teacher account")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const goToTeacherDashboard = () => {
    if (createdTeacher) {
      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(createdTeacher))
      router.push("/teacher")
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Teacher Account Created Successfully!
            </CardTitle>
            <CardDescription className="text-lg">
              Welcome to the school management system, {createdTeacher?.full_name}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <Key className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Your teacher code has been generated. You'll use this code to log in for all future sessions.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Your Teacher Code</Label>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-lg font-bold">
                    {showTeacherCode ? generatedTeacherCode : "••••••••"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTeacherCode(!showTeacherCode)}
                  >
                    {showTeacherCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedTeacherCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• <strong>Save your teacher code</strong> - You'll need it for future logins</li>
                  <li>• <strong>Contact your admin</strong> if you lose your code</li>
                  <li>• <strong>Access your dashboard</strong> to start managing your classes</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button onClick={goToTeacherDashboard} className="flex-1">
                  Go to Teacher Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep("form")
                    setFormData({ school_id: "", email: "", full_name: "", class_number: "", department: "" })
                    setGeneratedTeacherCode("")
                    setCreatedTeacher(null)
                  }}
                >
                  Create Another Teacher
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Teacher Registration</CardTitle>
          <CardDescription className="text-lg">
            Create a new teacher account. A unique login code will be generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="school_id" className="text-sm font-medium">
                  School *
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select the school you will be teaching at
                </p>
                <Select
                  value={formData.school_id}
                  onValueChange={(value) => setFormData({ ...formData, school_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        <div className="flex items-center space-x-2">
                          <span>{school.name}</span>
                          {school.abbreviation && (
                            <Badge variant="outline" className="text-xs">
                              {school.abbreviation}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., john.smith@school.edu"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class_number" className="text-sm font-medium">
                    Department/Class
                  </Label>
                  <Input
                    id="class_number"
                    type="text"
                    value={formData.class_number}
                    onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                    placeholder="e.g., Mathematics, Science"
                  />
                </div>

                <div>
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
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
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Note:</strong> A unique teacher code will be generated automatically. 
                You'll use this code (not your email) to log in to the system.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !formData.school_id || !formData.email || !formData.full_name}
            >
              {loading ? "Creating Teacher Account..." : "Create Teacher Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

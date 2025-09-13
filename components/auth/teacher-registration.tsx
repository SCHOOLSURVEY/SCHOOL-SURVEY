"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatabaseService } from "@/lib/database-client"
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface RegistrationResult {
  success: boolean
  teacher_code?: string
  teacher_name?: string
  class_identifier?: string
  subject_specialty?: string
  message?: string
  error?: string
}

export function TeacherRegistration() {
  const [step, setStep] = useState<"code" | "details" | "success">("code")
  const [loading, setLoading] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [formData, setFormData] = useState({
    teacher_code: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null)

  const validateTeacherCode = async () => {
    if (!formData.teacher_code.trim()) {
      toast.error("Please enter your teacher code")
      return
    }

    setLoading(true)
    try {
      // Check if the teacher code exists and is valid
      const { data, error } = await supabase
        .from("teacher_codes")
        .select(`
          *,
          schools!inner(name, abbreviation)
        `)
        .eq("code", formData.teacher_code)
        .eq("is_active", true)
        .eq("is_used", false)
        .single()

      if (error || !data) {
        toast.error("Invalid or expired teacher code")
        return
      }

      // Check if code is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("This teacher code has expired")
        return
      }

      // Store the code data and move to next step
      setRegistrationResult({
        success: true,
        teacher_code: data.code,
        teacher_name: data.teacher_name,
        class_identifier: data.class_identifier,
        subject_specialty: data.subject_specialty,
      })
      setStep("details")
      toast.success("Teacher code validated successfully!")
    } catch (error) {
      console.error("Error validating teacher code:", error)
      toast.error("Error validating teacher code")
    } finally {
      setLoading(false)
    }
  }

  const completeRegistration = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setLoading(true)
    try {
      // Use the teacher code to create the account
      const { data, error } = await supabase.rpc("use_teacher_code", {
        p_code: formData.teacher_code,
        p_teacher_email: formData.email,
        p_teacher_phone: formData.phone || null,
      })

      if (error) {
        throw error
      }

      if (!data.success) {
        toast.error(data.error || "Registration failed")
        return
      }

      // Set up authentication
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_id: data.user_id,
            teacher_code: data.teacher_code,
            school_id: data.school_id,
          },
        },
      })

      if (authError) {
        throw authError
      }

      setStep("success")
      toast.success("Registration completed successfully!")
    } catch (error) {
      console.error("Error completing registration:", error)
      toast.error("Error completing registration")
    } finally {
      setLoading(false)
    }
  }

  const recoverTeacherCode = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("recover_teacher_code", {
        p_teacher_email: formData.email,
        p_teacher_name: "", // We'll need the teacher to provide this
      })

      if (error) {
        throw error
      }

      if (data.success) {
        toast.success(`Your teacher code: ${data.teacher_code}`)
        setFormData(prev => ({ ...prev, teacher_code: data.teacher_code }))
      } else {
        toast.error(data.error || "Could not recover teacher code")
      }
    } catch (error) {
      console.error("Error recovering teacher code:", error)
      toast.error("Error recovering teacher code")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Your teacher account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Account Details:</h3>
              <p><strong>Name:</strong> {registrationResult?.teacher_name}</p>
              <p><strong>Class:</strong> {registrationResult?.class_identifier}</p>
              <p><strong>Subject:</strong> {registrationResult?.subject_specialty || "Not specified"}</p>
              <p><strong>Teacher Code:</strong> {registrationResult?.teacher_code}</p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please check your email for a verification link to complete your account setup.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => window.location.href = "/auth/login"}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Teacher Registration</CardTitle>
          <CardDescription>
            {step === "code" 
              ? "Enter your teacher code to get started"
              : "Complete your account setup"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "code" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="teacher-code">Teacher Code *</Label>
                <div className="relative">
                  <Input
                    id="teacher-code"
                    type={showCode ? "text" : "password"}
                    value={formData.teacher_code}
                    onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value })}
                    placeholder="Enter your teacher code"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCode(!showCode)}
                  >
                    {showCode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Your teacher code should look like: DEF-JS-A7B9C2D4
                </p>
              </div>

              <Button
                onClick={validateTeacherCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Validating..." : "Validate Code"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Don't have your teacher code?</p>
                <Button
                  variant="link"
                  onClick={recoverTeacherCode}
                  disabled={loading}
                  className="text-sm"
                >
                  Recover Teacher Code
                </Button>
              </div>
            </>
          )}

          {step === "details" && registrationResult && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Teacher Information:</h3>
                <p><strong>Name:</strong> {registrationResult.teacher_name}</p>
                <p><strong>Class:</strong> {registrationResult.class_identifier}</p>
                <p><strong>Subject:</strong> {registrationResult.subject_specialty || "Not specified"}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@school.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a strong password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password *</Label>
                  <PasswordInput
                    id="confirm-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("code")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={completeRegistration}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



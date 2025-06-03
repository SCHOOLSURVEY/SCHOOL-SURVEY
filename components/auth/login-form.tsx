"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateAdminCode } from "@/lib/admin-setup"
import { createUser, loginUser } from "@/lib/auth-flow"
import { useRouter } from "next/navigation"
import { Info, Key, Mail, Phone } from "lucide-react"

export function LoginForm() {
  const [loginData, setLoginData] = useState({
    email: "",
    adminCode: "",
    loginType: "regular", // "regular" or "admin"
  })
  const [signupData, setSignupData] = useState({
    email: "",
    full_name: "",
    role: "",
    class_number: "",
    parent_email: "",
    parent_phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleAdminLogin = async (adminCode: string) => {
    const validation = await validateAdminCode(adminCode)
    if (!validation.valid) {
      setMessage(validation.message ?? "Invalid admin code")
      return false
    }

    // Set user in localStorage and redirect
    localStorage.setItem("currentUser", JSON.stringify(validation.admin))
    router.push("/admin")
    return true
  }

  const handleRegularLogin = async (email: string) => {
    const result = await loginUser(email)

    if (!result.success) {
      setMessage(result.message ?? "Login failed")
      return false
    }

    // Set user in localStorage and redirect
    localStorage.setItem("currentUser", JSON.stringify(result.user))

    switch (result.user.role) {
      case "teacher":
        router.push("/teacher")
        break
      case "student":
        router.push("/student")
        break
      default:
        setMessage("Invalid user role.")
        return false
    }
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (loginData.loginType === "admin") {
        await handleAdminLogin(loginData.adminCode)
      } else {
        await handleRegularLogin(loginData.email)
      }
    } catch (error) {
      setMessage("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      // Validate required fields
      if (!signupData.email || !signupData.full_name || !signupData.role) {
        setMessage("Please fill in all required fields")
        setLoading(false)
        return
      }

      // For students, require at least one parent contact
      if (signupData.role === "student" && !signupData.parent_email && !signupData.parent_phone) {
        setMessage("Please provide at least one parent contact (email or phone)")
        setLoading(false)
        return
      }

      const result = await createUser({
        email: signupData.email,
        full_name: signupData.full_name,
        role: signupData.role as "teacher" | "student",
        class_number: signupData.class_number,
        parent_email: signupData.parent_email,
        parent_phone: signupData.parent_phone,
      })

      if (!result.success) {
        setMessage(result.error ?? "Failed to create account")
        setLoading(false)
        return
      }

      setMessage(result.message ?? "Account created successfully!")

      if (!result.needsVerification) {
        // Auto-login for students
        localStorage.setItem("currentUser", JSON.stringify(result.user))

        setTimeout(() => {
          switch (result.user.role) {
            case "student":
              router.push("/student")
              break
            default:
              break
          }
        }, 3000)
      }
      // For teachers, they need to verify email before they can login
    } catch (error) {
      setMessage("An error occurred during signup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>School Management System</CardTitle>
        <CardDescription>Sign in or create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="space-y-4">
              {/* Login Type Selector */}
              <div className="space-y-2">
                <Label>Login As</Label>
                <Select
                  value={loginData.loginType}
                  onValueChange={(value) =>
                    setLoginData({ ...loginData, loginType: value ?? "regular", email: "", adminCode: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Teacher/Student</SelectItem>
                    <SelectItem value="admin">School Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginData.loginType === "regular" ? (
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="admin-code">
                      <Key className="inline w-4 h-4 mr-1" />
                      Admin Access Code
                    </Label>
                    <Input
                      id="admin-code"
                      type="password"
                      value={loginData.adminCode}
                      onChange={(e) => setLoginData({ ...loginData, adminCode: e.target.value.toUpperCase() })}
                      placeholder="Enter your unique admin code"
                      required
                    />
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Use your unique admin code to access the administrator dashboard.
                        <br />
                        Contact school administration if you've forgotten your code.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : loginData.loginType === "admin" ? "Admin Sign In" : "Sign In"}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  value={signupData.full_name}
                  onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-role">I am a...</Label>
                <Select
                  value={signupData.role}
                  onValueChange={(value) => setSignupData({ ...signupData, role: value ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {signupData.role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="class-number">Class Number</Label>
                    <Input
                      id="class-number"
                      value={signupData.class_number}
                      onChange={(e) => setSignupData({ ...signupData, class_number: e.target.value })}
                      placeholder="e.g., 10A, 12B"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Parent/Guardian Contact (At least one required)</Label>

                    <div className="space-y-2">
                      <Label htmlFor="parent-email" className="text-sm flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        Parent Email
                      </Label>
                      <Input
                        id="parent-email"
                        type="email"
                        value={signupData.parent_email}
                        onChange={(e) => setSignupData({ ...signupData, parent_email: e.target.value })}
                        placeholder="parent@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parent-phone" className="text-sm flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        Parent Phone
                      </Label>
                      <Input
                        id="parent-phone"
                        type="tel"
                        value={signupData.parent_phone}
                        onChange={(e) => setSignupData({ ...signupData, parent_phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Your parent/guardian will receive a notification about your registration and can use this
                        contact info to access the parent portal.
                      </AlertDescription>
                    </Alert>
                  </div>
                </>
              )}

              {signupData.role === "teacher" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-dept">Department (Optional)</Label>
                    <Input
                      id="teacher-dept"
                      value={signupData.class_number}
                      onChange={(e) => setSignupData({ ...signupData, class_number: e.target.value })}
                      placeholder="e.g., Mathematics, Science"
                    />
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Email Verification Required:</strong> You'll need to verify your email address before you
                      can log in. Check your inbox after registration.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading || !signupData.role}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {message && (
          <div
            className={`mt-4 text-sm ${
              message.includes("Error") ||
              message.includes("Invalid") ||
              message.includes("not found") ||
              message.includes("expired") ||
              message.includes("verify your email")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Info, Key } from "lucide-react"

export function LoginForm() {
  const [loginData, setLoginData] = useState({ 
    email: "", 
    adminCode: "",
    loginType: "regular" // "regular" or "admin"
  })
  const [signupData, setSignupData] = useState({
    email: "",
    full_name: "",
    role: "",
    class_number: "",
    admin_code: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const generateUniqueId = (role: string) => {
    const prefix = role === "teacher" ? "T" : role === "student" ? "S" : "A"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}${timestamp}${random}`
  }

  const validateAdminCode = async (code: string) => {
    try {
      // Try to validate against database
      const { data: adminCode, error } = await supabase
        .from("admin_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single()

      if (error) {
        // If database validation fails, allow the hardcoded codes for now
        console.warn("Database validation failed, using fallback validation:", error)
        const validCodes = ["SCHOOL2024", "PRINCIPAL2024", "SETUP2024"]
        if (validCodes.includes(code)) {
          return { valid: true, adminCodeId: null }
        }
        return { valid: false, message: "Invalid admin code. Please contact school administration." }
      }

      if (!adminCode) {
        return { valid: false, message: "Invalid admin code. Please contact school administration." }
      }

      // Check if code has expired
      if (adminCode.expires_at) {
        const now = new Date()
        const expiresAt = new Date(adminCode.expires_at)
        if (expiresAt < now) {
          return { valid: false, message: "This admin code has expired. Please request a new one." }
        }
      }

      // Check if code has reached max uses (only if max_uses is set)
      if (adminCode.max_uses && adminCode.current_uses >= adminCode.max_uses) {
        return { valid: false, message: "This admin code has reached its maximum usage limit." }
      }

      return { valid: true, adminCodeId: adminCode.id, adminCode }
    } catch (error) {
      console.error("Error validating admin code:", error)
      return { valid: false, message: "Error validating admin code. Please try again." }
    }
  }

  const recordAdminCodeUsage = async (adminCodeId: string, userId: string) => {
    try {
      // Record the usage
      await supabase.from("admin_code_usage").insert([
        {
          admin_code_id: adminCodeId,
          user_id: userId,
          ip_address: null, // Could be populated with actual IP
          user_agent: navigator.userAgent,
        },
      ])

      // Increment usage count
      const { error } = await supabase
        .from("admin_codes")
        .update({ 
          current_uses: supabase.raw('current_uses + 1'),
          updated_at: new Date().toISOString()
        })
        .eq("id", adminCodeId)

      if (error) {
        console.error("Error incrementing usage count:", error)
      }
    } catch (error) {
      console.error("Error recording admin code usage:", error)
    }
  }

  const handleAdminLogin = async (adminCode: string) => {
    // Validate the admin code
    const validation = await validateAdminCode(adminCode)
    if (!validation.valid) {
      setMessage(validation.message)
      return false
    }

    // For database codes, find the associated admin user
    if (validation.adminCodeId) {
      try {
        // Find admin user associated with this code (if created_by is set)
        let adminUser = null
        
        if (validation.adminCode.created_by) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", validation.adminCode.created_by)
            .eq("role", "admin")
            .single()

          if (!userError && userData) {
            adminUser = userData
          }
        }

        // If no specific user associated, find any admin (for shared codes)
        if (!adminUser) {
          const { data: adminUsers, error: adminError } = await supabase
            .from("users")
            .select("*")
            .eq("role", "admin")
            .limit(1)

          if (!adminError && adminUsers && adminUsers.length > 0) {
            adminUser = adminUsers[0]
          }
        }

        if (!adminUser) {
          setMessage("No admin user found for this code. Please contact administration.")
          return false
        }

        // Record usage
        await recordAdminCodeUsage(validation.adminCodeId, adminUser.id)

        // Set user in localStorage
        localStorage.setItem("currentUser", JSON.stringify(adminUser))
        router.push("/admin")
        return true

      } catch (error) {
        console.error("Error during admin login:", error)
        setMessage("Error during login. Please try again.")
        return false
      }
    } else {
      // For hardcoded codes, find any admin user
      try {
        const { data: adminUsers, error: adminError } = await supabase
          .from("users")
          .select("*")
          .eq("role", "admin")
          .limit(1)

        if (adminError || !adminUsers || adminUsers.length === 0) {
          setMessage("No admin user found. Please contact administration.")
          return false
        }

        const adminUser = adminUsers[0]
        localStorage.setItem("currentUser", JSON.stringify(adminUser))
        router.push("/admin")
        return true

      } catch (error) {
        console.error("Error during admin login:", error)
        setMessage("Error during login. Please try again.")
        return false
      }
    }
  }

  const handleRegularLogin = async (email: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (userError || !userData) {
        setMessage("User not found. Please sign up or contact administration.")
        return false
      }

      // Don't allow admins to login with email
      if (userData.role === "admin") {
        setMessage("Admin users must use their admin code to login. Please use the 'Admin Login' option.")
        return false
      }

      localStorage.setItem("currentUser", JSON.stringify(userData))

      switch (userData.role) {
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

    } catch (error) {
      console.error("Error during regular login:", error)
      setMessage("An error occurred during login")
      return false
    }
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
      // Validate admin code if signing up as admin
      if (signupData.role === "admin") {
        const validation = await validateAdminCode(signupData.admin_code)
        if (!validation.valid) {
          setMessage(validation.message)
          setLoading(false)
          return
        }
      }

      // Check if email already exists
      const { data: existingUser } = await supabase.from("users").select("email").eq("email", signupData.email).single()

      if (existingUser) {
        setMessage("Email already exists. Please use the login tab.")
        setLoading(false)
        return
      }

      const uniqueId = generateUniqueId(signupData.role)

      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            unique_id: uniqueId,
            email: signupData.email,
            full_name: signupData.full_name,
            role: signupData.role,
            class_number: signupData.class_number || null,
          },
        ])
        .select()
        .single()

      if (error) {
        setMessage("Error creating account: " + error.message)
      } else {
        // Record admin code usage if applicable
        if (signupData.role === "admin") {
          const validation = await validateAdminCode(signupData.admin_code)
          if (validation.valid && validation.adminCodeId) {
            await recordAdminCodeUsage(validation.adminCodeId, newUser.id)
          }
        }

        // Auto-login after successful signup
        localStorage.setItem("currentUser", JSON.stringify(newUser))
        setMessage(`Account created successfully! Your ID is: ${uniqueId}`)

        // Show different messages for different roles
        if (signupData.role === "admin") {
          setMessage(`Admin account created! Your ID is: ${uniqueId}. Remember to use your admin code for future logins.`)
        } else {
          setMessage(`Account created successfully! Your ID is: ${uniqueId}`)
        }

        // Redirect after a short delay to show the ID
        setTimeout(() => {
          switch (signupData.role) {
            case "admin":
              router.push("/admin")
              break
            case "teacher":
              router.push("/teacher")
              break
            case "student":
              router.push("/student")
              break
          }
        }, 3000)
      }
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
                  onValueChange={(value) => setLoginData({ ...loginData, loginType: value, email: "", adminCode: "" })}
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
                  {loading ? "Signing in..." : 
                   loginData.loginType === "admin" ? "Admin Sign In" : "Sign In"}
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
                  onValueChange={(value) => setSignupData({ ...signupData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">School Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {signupData.role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="admin-code">Admin Access Code</Label>
                  <Input
                    id="admin-code"
                    type="password"
                    value={signupData.admin_code}
                    onChange={(e) => setSignupData({ ...signupData, admin_code: e.target.value.toUpperCase() })}
                    placeholder="Enter admin verification code"
                    required
                  />
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Important:</strong> After creating your admin account, you'll need to use this admin code (not your email) for all future logins.
                      <br />
                      Contact school administration if you need an admin code.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {(signupData.role === "student" || signupData.role === "teacher") && (
                <div className="space-y-2">
                  <Label htmlFor="class-number">
                    {signupData.role === "student" ? "Class Number" : "Department/Class (Optional)"}
                  </Label>
                  <Input
                    id="class-number"
                    value={signupData.class_number}
                    onChange={(e) => setSignupData({ ...signupData, class_number: e.target.value })}
                    placeholder={signupData.role === "student" ? "e.g., 10A, 12B" : "e.g., Mathematics Dept"}
                    required={signupData.role === "student"}
                  />
                </div>
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
              message.includes("maximum")
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
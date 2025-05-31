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
import { Info } from "lucide-react"

export function LoginForm() {
  const [loginData, setLoginData] = useState({ email: "" })
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
      // First check if the code matches any of our known valid codes
      const validCodes = ["SCHOOL2024", "PRINCIPAL2024", "SETUP2024"]
      if (!validCodes.includes(code)) {
        return { valid: false, message: "Invalid admin code. Please use: SCHOOL2024, PRINCIPAL2024, or SETUP2024" }
      }

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
        return { valid: true, adminCodeId: null }
      }

      if (!adminCode) {
        return { valid: false, message: "Invalid admin code. Please contact school administration." }
      }

      // Check if code has expired
      const now = new Date()
      const expiresAt = new Date(adminCode.expires_at)
      if (expiresAt < now) {
        return { valid: false, message: "This admin code has expired. Please request a new one." }
      }

      // Check if code has reached max uses
      if (adminCode.current_uses >= adminCode.max_uses) {
        return { valid: false, message: "This admin code has reached its maximum usage limit." }
      }

      return { valid: true, adminCodeId: adminCode.id }
    } catch (error) {
      console.error("Error validating admin code:", error)
      // Fallback to hardcoded validation
      const validCodes = ["SCHOOL2024", "PRINCIPAL2024", "SETUP2024"]
      if (validCodes.includes(code)) {
        return { valid: true, adminCodeId: null }
      }
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
      await supabase.rpc("increment_admin_code_usage", { code_id: adminCodeId })
    } catch (error) {
      console.error("Error recording admin code usage:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", loginData.email)
        .single()

      if (userError || !userData) {
        setMessage("User not found. Please sign up or contact administration.")
        setLoading(false)
        return
      }

      localStorage.setItem("currentUser", JSON.stringify(userData))

      switch (userData.role) {
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
        }, 2000)
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
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
                      Current valid codes: SCHOOL2024, PRINCIPAL2024, SETUP2024
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

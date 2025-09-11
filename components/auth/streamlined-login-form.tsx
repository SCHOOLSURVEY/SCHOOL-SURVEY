"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authenticate } from "@/lib/auth-actions"
import { validateAdminCode, validateTeacherCode } from "@/lib/admin-setup"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Key, User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"

// Success Animation Component
const SuccessAnimation = ({ isVisible, type }: { isVisible: boolean; type: "login" | "admin" | "teacher" }) => {
  if (!isVisible) return null

  const getContent = () => {
    switch (type) {
      case "admin":
        return {
          title: "Admin Access Granted!",
          description: "Welcome to the admin dashboard.",
          bgColor: "from-purple-400 to-indigo-500",
          icon: "👑"
        }
      case "teacher":
        return {
          title: "Teacher Access Granted!",
          description: "Welcome to the teacher dashboard.",
          bgColor: "from-blue-400 to-cyan-500",
          icon: "👨‍🏫"
        }
      case "login":
        return {
          title: "Welcome Back!",
          description: "Successfully logged in. Redirecting...",
          bgColor: "from-green-400 to-emerald-500",
          icon: "✅"
        }
    }
  }

  const content = getContent()

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scale-up-bounce max-w-sm mx-4 text-center border">
        <div className={`bg-gradient-to-r ${content.bgColor} rounded-full p-4 mx-auto mb-4 w-20 h-20 flex items-center justify-center animate-pulse-glow`}>
          <span className="text-3xl">{content.icon}</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h3>
        <p className="text-gray-600 text-sm">{content.description}</p>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            <div className={`w-2 h-2 ${type === "admin" ? "bg-purple-500" : type === "teacher" ? "bg-blue-500" : "bg-green-500"} rounded-full animate-bounce`}></div>
            <div className={`w-2 h-2 ${type === "admin" ? "bg-purple-500" : type === "teacher" ? "bg-blue-500" : "bg-green-500"} rounded-full animate-bounce animation-delay-150`}></div>
            <div className={`w-2 h-2 ${type === "admin" ? "bg-purple-500" : type === "teacher" ? "bg-blue-500" : "bg-green-500"} rounded-full animate-bounce animation-delay-300`}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StreamlinedLoginForm({ className }: { className?: string }) {
  const [mode, setMode] = useState<"student" | "teacher" | "admin">("student")
  const [message, setMessage] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successType, setSuccessType] = useState<"login" | "admin" | "teacher">("login")
  const { toast } = useToast()
  const router = useRouter()

  // Student login schema (email-based)
  const studentLoginSchema = z.object({
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
  })

  // Teacher/Admin login schema (code-based)
  const codeLoginSchema = z.object({
    code: z.string().min(8, {
      message: "Code must be at least 8 characters.",
    }),
  })

  type StudentLoginSchemaType = z.infer<typeof studentLoginSchema>
  type CodeLoginSchemaType = z.infer<typeof codeLoginSchema>

  const studentForm = useForm<StudentLoginSchemaType>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: "",
    },
  })

  const codeForm = useForm<CodeLoginSchemaType>({
    resolver: zodResolver(codeLoginSchema),
    defaultValues: {
      code: "",
    },
  })

  const switchMode = (newMode: "student" | "teacher" | "admin") => {
    setMode(newMode)
    setMessage("")
    setShowSuccess(false)
    studentForm.reset()
    codeForm.reset()
  }

  async function handleStudentLogin(values: StudentLoginSchemaType) {
    setLoading(true)
    setMessage("")

    try {

      const result = await authenticate({
        email: values.email,
      })


      if (!result?.success) {
        setMessage(result?.error ?? "Invalid email or password.")
        setLoading(false)
        return
      }

      // Show success animation
      setSuccessType("login")
      setShowSuccess(true)

      toast({
        title: "Success!",
        description: "Successfully logged in.",
      })

      // Store user data and redirect after animation
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(result.user))
      }

      setTimeout(() => {
        switch (result.user.role) {
          case "student":
            router.push("/student")
            break
          case "parent":
            router.push("/parent")
            break
          default:
            router.push("/dashboard")
        }
      }, 1500)
    } catch (error) {
      console.error("Login error details:", error)
      setMessage("Failed to authenticate. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCodeLogin(values: CodeLoginSchemaType) {
    setLoading(true)
    setMessage("")

    try {

      let result
      if (mode === "admin") {
        result = await validateAdminCode(values.code)
        if (result.valid) {
          setSuccessType("admin")
          // Store admin data
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUser", JSON.stringify(result.admin))
          }
        }
      } else if (mode === "teacher") {
        result = await validateTeacherCode(values.code)
        if (result.valid) {
          setSuccessType("teacher")
          // Store teacher data
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUser", JSON.stringify(result.teacher))
          }
        }
      }

      if (!result?.valid) {
        const errorMessage = mode === "teacher" 
          ? "Invalid teacher code."
          : "Invalid admin code."
        setMessage(result?.message ?? errorMessage)
        setLoading(false)
        return
      }

      // Show success animation
      setShowSuccess(true)

      toast({
        title: "Success!",
        description: `Successfully logged in as ${mode}.`,
      })

      setTimeout(() => {
        if (mode === "admin") {
          router.push("/admin")
        } else if (mode === "teacher") {
          router.push("/teacher")
        }
      }, 1500)
    } catch (error) {
      console.error("Code login error details:", error)
      setMessage("Unable to connect to the server. Please check your internet connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={mode === "student" ? "default" : "ghost"}
              size="sm"
              onClick={() => switchMode("student")}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Student
            </Button>
            <Button
              variant={mode === "teacher" ? "default" : "ghost"}
              size="sm"
              onClick={() => switchMode("teacher")}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              Teacher
            </Button>
            <Button
              variant={mode === "admin" ? "default" : "ghost"}
              size="sm"
              onClick={() => switchMode("admin")}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>

          {/* Error Message */}
          {message && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{message}</AlertDescription>
            </Alert>
          )}

          {/* Student Login Form */}
          {mode === "student" && (
            <form onSubmit={studentForm.handleSubmit(handleStudentLogin)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...studentForm.register("email")}
                  />
                </div>
                {studentForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{studentForm.formState.errors.email.message}</p>
                )}
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Students and parents use their email address to sign in.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Teacher/Admin Login Form */}
          {(mode === "teacher" || mode === "admin") && (
            <form onSubmit={codeForm.handleSubmit(handleCodeLogin)} className="space-y-4">
              <div>
                <Label htmlFor="code" className="text-sm font-medium">
                  {mode === "admin" ? "Admin Code" : "Teacher Code"}
                </Label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder={`Enter your ${mode} code`}
                    className="pl-10 font-mono"
                    {...codeForm.register("code")}
                  />
                </div>
                {codeForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-red-600">{codeForm.formState.errors.code.message}</p>
                )}
              </div>

              <Alert className="border-yellow-200 bg-yellow-50">
                <Key className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>{mode === "admin" ? "Admins" : "Teachers"}</strong> use their unique code to sign in.
                  {mode === "admin" ? " Contact developers if you lose your code." : " Contact your admin if you lose your code."}
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Additional Options */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Don't have an account? Register as:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => router.push("/auth/teacher-register")}
              >
                Teacher
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => router.push("/auth/student-register")}
              >
                Student
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={() => router.push("/auth/parent-register")}
              >
                Parent
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Need help? Contact your school administrator
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Animation */}
      <SuccessAnimation isVisible={showSuccess} type={successType} />
    </div>
  )
}

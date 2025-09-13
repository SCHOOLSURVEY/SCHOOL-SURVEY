"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authenticate } from "@/lib/auth-actions"
import { validateAdminCode, validateTeacherCode } from "@/lib/admin-setup-client"
import { useToast } from "@/hooks/use-toast"
import { SessionManager } from "@/lib/session-manager"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Key, User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { DatabaseService } from "@/lib/database-client"
import { useEffect } from "react"
import { AnimatedBackground } from "@/components/ui/animated-background"

interface School {
  _id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-gradient-to-r ${content.bgColor} p-8 rounded-2xl text-white text-center animate-pulse`}>
        <div className="text-6xl mb-4">{content.icon}</div>
        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-lg opacity-90">{content.description}</p>
      </div>
    </div>
  )
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const codeSchema = z.object({
  code: z.string().min(1, "Please enter your login code"),
})

export default function SchoolSpecificLoginPage() {
  const params = useParams()
  const schoolSlug = params.school as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [school, setSchool] = useState<School | null>(null)
  const [loginMode, setLoginMode] = useState<"student" | "teacher" | "admin">("student")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successType, setSuccessType] = useState<"login" | "admin" | "teacher">("login")
  const [loginError, setLoginError] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Fetch school information based on slug
  useEffect(() => {
    if (schoolSlug) {
      fetchSchoolInfo()
    }
    // Initialize session manager to clear any conflicting data
    SessionManager.initialize()
  }, [schoolSlug])

  const fetchSchoolInfo = async () => {
    try {
      const schools = await DatabaseService.getAllSchools()
      const school = schools.find(s => s.slug === schoolSlug && s.is_active)
      
      if (!school) {
        setError("School not found. Please select a valid school.")
        return
      }
      setSchool(school)
      setError("")
    } catch (error) {
      console.error("Error fetching school info:", error)
      setError("Failed to load school information. Please try again.")
    }
  }

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
    },
  })

  const handleStudentLogin = async (data: z.infer<typeof loginSchema>) => {
    if (!school) return
    setLoading(true)
    setLoginError("") // Clear previous errors
    try {
      const result = await authenticate(data.email, data.password)
      
      if (result.success && result.user) {
        
        // Check if user belongs to this school
        if (result.user.school_id !== school.id) {
          toast({
            title: "Access Denied",
            description: "You don't have access to this school's system.",
            variant: "destructive",
          })
          return
        }

        SessionManager.setUser(result.user, schoolSlug)
        
        // Verify the session was stored
        const storedUser = SessionManager.getCurrentUser()
        
        setSuccessType("login")
        setShowSuccess(true)
        
        // Redirect based on user role
        setTimeout(() => {
          const redirectPath = `/${schoolSlug}/${result.user.role}`
          router.push(redirectPath)
        }, 1500)
      } else {
        const errorMessage = result.error || "Invalid email or password."
        setLoginError(errorMessage)
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMessage = "Unable to connect to the server. Please check your internet connection and try again."
      setLoginError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCodeLogin = async (data: z.infer<typeof codeSchema>) => {
    if (!school) return
    setLoading(true)
    setLoginError("") // Clear previous errors
    try {
      let result
      
      if (loginMode === "teacher") {
        result = await validateTeacherCode(data.code, school._id)
      } else {
        result = await validateAdminCode(data.code, school._id)
      }

      if (result.success && result.user) {
        SessionManager.setUser(result.user, schoolSlug)
        
        // Verify the session was stored
        const storedUser = SessionManager.getCurrentUser()
        
        setSuccessType(loginMode)
        setShowSuccess(true)
        
        setTimeout(() => {
          if (loginMode === "teacher") {
            router.push(`/${schoolSlug}/teacher`)
          } else {
            router.push(`/${schoolSlug}/admin`)
          }
        }, 1500)
      } else {
        const errorMessage = result.error || (loginMode === "teacher" 
          ? "Invalid teacher code."
          : "Invalid admin code.")
        
        setLoginError(errorMessage)
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Code login error:", error)
      const errorMessage = "Unable to connect to the server. Please check your internet connection and try again."
      setLoginError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  return (
    <AnimatedBackground>
      <div className="w-full max-w-md mx-2 sm:mx-0">
        <Card className="w-full border border-gray-200 shadow-xl bg-white">
        <CardHeader className="text-center p-4 sm:p-6" style={{ backgroundColor: `${primaryColor}05` }}>
          {school.logo_url && (
            <div className="mx-auto mb-3 sm:mb-4">
              <img 
                src={school.logo_url} 
                alt={`${school.name} Logo`}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
            </div>
          )}
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Welcome to {school.name}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Login Mode Selector */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={loginMode === "student" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              style={loginMode === "student" ? { backgroundColor: primaryColor } : {}}
              onClick={() => {
                setLoginMode("student")
                setLoginError("")
                setShowSuccess(false)
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Student
            </Button>
            <Button
              variant={loginMode === "teacher" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              style={loginMode === "teacher" ? { backgroundColor: primaryColor } : {}}
              onClick={() => {
                setLoginMode("teacher")
                setLoginError("")
                setShowSuccess(false)
              }}
            >
              <Key className="w-4 h-4 mr-2" />
              Teacher
            </Button>
            <Button
              variant={loginMode === "admin" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              style={loginMode === "admin" ? { backgroundColor: primaryColor } : {}}
              onClick={() => {
                setLoginMode("admin")
                setLoginError("")
                setShowSuccess(false)
              }}
            >
              <Key className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loginError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          {/* Student Login Form */}
          {loginMode === "student" && (
            <form onSubmit={loginForm.handleSubmit(handleStudentLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...loginForm.register("email")}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...loginForm.register("password")}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Teacher/Admin Code Login Form */}
          {(loginMode === "teacher" || loginMode === "admin") && (
            <form onSubmit={codeForm.handleSubmit(handleCodeLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  {loginMode === "teacher" ? "Teacher" : "Admin"} Code
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder={`Enter your ${loginMode} code`}
                    className="pl-10 font-mono"
                    {...codeForm.register("code")}
                  />
                </div>
                {codeForm.formState.errors.code && (
                  <p className="text-sm text-red-600">{codeForm.formState.errors.code.message}</p>
                )}
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Key className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Use your {loginMode} code to sign in. Contact your administrator if you don't have one.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Registration Links */}
          <div className="text-center space-y-3">
            <p className="text-sm text-almost-black/70">
              Don't have an account? Register as:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-royal-blue border-royal-blue/30 hover:bg-royal-blue hover:text-white hover:border-royal-blue btn-hover-lift transition-all duration-300 font-medium text-xs sm:text-sm py-2"
                onClick={() => router.push(`/${schoolSlug}/auth/teacher-register`)}
              >
                Teacher
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-green border-emerald-green/30 hover:bg-emerald-green hover:text-white hover:border-emerald-green btn-hover-lift transition-all duration-300 font-medium text-xs sm:text-sm py-2"
                onClick={() => router.push(`/${schoolSlug}/auth/student-register`)}
              >
                Student
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-vibrant-orange border-vibrant-orange/30 hover:bg-vibrant-orange hover:text-white hover:border-vibrant-orange btn-hover-lift transition-all duration-300 font-medium text-xs sm:text-sm py-2"
                onClick={() => router.push(`/${schoolSlug}/auth/parent-register`)}
              >
                Parent
              </Button>
            </div>
            <p className="text-xs text-almost-black/50">
              Need help? Contact your school administrator
            </p>
          </div>
        </CardContent>
        </Card>

        {/* Success Animation */}
        <SuccessAnimation isVisible={showSuccess} type={successType} />
      </div>
    </AnimatedBackground>
  )
}

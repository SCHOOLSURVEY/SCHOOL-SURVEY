"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authenticate, createUser } from "@/lib/auth-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

const signupSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  full_name: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  role: z.enum(["teacher", "student"]),
  class_number: z.string().optional(),
  parent_email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional()
    .or(z.literal("")),
  parent_phone: z.string().optional(),
})

type LoginSchemaType = z.infer<typeof loginSchema>
type SignupSchemaType = z.infer<typeof signupSchema>

type LoginFormProps = {
  className?: string
}

// Confetti Component
const Confetti = ({ isActive }: { isActive: boolean }) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number
    x: number
    y: number
    rotation: number
    color: string
    size: number
    velocityX: number
    velocityY: number
    rotationSpeed: number
  }>>([])

  useEffect(() => {
    if (!isActive) {
      setConfettiPieces([])
      return
    }

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f']
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: Math.random() * 3 + 2,
      rotationSpeed: (Math.random() - 0.5) * 10
    }))

    setConfettiPieces(pieces)

    // Animate confetti
    const animateConfetti = () => {
      setConfettiPieces(prevPieces => 
        prevPieces.map(piece => ({
          ...piece,
          x: piece.x + piece.velocityX,
          y: piece.y + piece.velocityY,
          rotation: piece.rotation + piece.rotationSpeed,
          velocityY: piece.velocityY + 0.1 // gravity
        })).filter(piece => piece.y < 120) // remove pieces that fall off screen
      )
    }

    const interval = setInterval(animateConfetti, 50)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setConfettiPieces([])
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isActive])

  if (!isActive || confettiPieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            transition: 'none'
          }}
        />
      ))}
    </div>
  )
}

// Success Animation Component
const SuccessAnimation = ({ isVisible, type }: { isVisible: boolean; type: 'login' | 'signup' }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scale-up-bounce max-w-sm mx-4 text-center border">
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-4 mx-auto mb-4 w-20 h-20 flex items-center justify-center animate-pulse-glow">
          <svg
            className="w-10 h-10 text-white animate-check-draw"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
              className="animate-check-path"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {type === 'login' ? 'Welcome Back!' : 'Sign Up Successful!'}
        </h3>
        <p className="text-gray-600 text-sm">
          {type === 'login' 
            ? 'Successfully logged in. Redirecting...' 
            : 'Account created successfully. Redirecting...'}
        </p>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce animation-delay-150"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce animation-delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginForm({ className }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [message, setMessage] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [showLoginSuccess, setShowLoginSuccess] = useState(false)
  const [showSignupConfetti, setShowSignupConfetti] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const loginForm = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  })

  const signupForm = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "student",
      class_number: "",
      parent_email: "",
      parent_phone: "",
    },
  })

  // Essential for form to work - DO NOT REMOVE
  const watchedValues = signupForm.watch()

  // Reset forms when switching modes
  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode)
    setMessage("")
    setShowLoginSuccess(false)
    setShowSignupConfetti(false)
    if (newMode === "login") {
      loginForm.reset()
    } else {
      signupForm.reset()
    }
  }

  async function handleLogin(values: LoginSchemaType) {
    setLoading(true)
    setMessage("")

    try {
      console.log("Attempting login with:", { email: values.email })

      const result = await authenticate({
        email: values.email,
      })

      console.log("Login result:", result)

      if (!result?.success) {
        setMessage(result?.error ?? "Failed to authenticate")
        setLoading(false)
        return
      }

      // Show success animation
      setShowLoginSuccess(true)

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
          case "admin":
            router.push("/admin")
            break
          case "teacher":
            router.push("/teacher")
            break
          case "student":
            router.push("/student")
            break
          default:
            router.push("/dashboard")
        }
      }, 1500) // Wait for animation to complete
    } catch (error) {
      console.error("Login error details:", error)
      setMessage("Failed to authenticate. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(values: SignupSchemaType) {
    setLoading(true)
    setMessage("")

    try {
      console.log("Attempting signup with:", {
        email: values.email,
        full_name: values.full_name,
        role: values.role,
        class_number: values.class_number || "N/A",
        parent_email: values.parent_email || "N/A",
        parent_phone: values.parent_phone || "N/A",
      })

      // Create a clean signup data object
      const signupData: {
        email: string
        full_name: string
        role: "teacher" | "student"
        class_number?: string
        parent_email?: string
        parent_phone?: string
      } = {
        email: values.email,
        full_name: values.full_name,
        role: values.role,
      }

      // Only add optional fields if they have values
      if (values.class_number && values.class_number.trim() !== "") {
        signupData.class_number = values.class_number
      }
      if (values.parent_email && values.parent_email.trim() !== "") {
        signupData.parent_email = values.parent_email
      }
      if (values.parent_phone && values.parent_phone.trim() !== "") {
        signupData.parent_phone = values.parent_phone
      }

      console.log("Cleaned signup data:", signupData)

      const result = await createUser(signupData)

      console.log("Create user result:", result)

      if (!result.success) {
        console.error("Signup failed with result:", result)

        // More specific error handling
        let errorMessage = "Failed to create account"
        if (result.error) {
          if (result.error.includes("fetch failed")) {
            errorMessage = "Connection error. Please check your internet connection and try again."
          } else if (result.error.includes("already exists")) {
            errorMessage = "An account with this email already exists. Please try logging in instead."
          } else {
            errorMessage = result.error
          }
        }

        setMessage(errorMessage)
        setLoading(false)
        return
      }

      // Show confetti animation AND success message
      setShowSignupConfetti(true)

      toast({
        title: "Success!",
        description: "Successfully created account.",
      })

      // Store user data and redirect after animation
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(result.data))
      }

      setTimeout(() => {
        switch (result.data.role) {
          case "teacher":
            router.push("/teacher")
            break
          case "student":
            router.push("/student")
            break
          default:
            router.push("/dashboard")
        }
      }, 2000) // Wait for confetti animation
    } catch (error) {
      console.error("Signup error details:", error)

      // Handle different types of errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setMessage("Connection error. Please check your internet connection and try again.")
      } else {
        setMessage("Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Success Animation for Login/Signup */}
      <SuccessAnimation isVisible={showLoginSuccess} type="login" />
      <SuccessAnimation isVisible={showSignupConfetti} type="signup" />
      
      {/* Confetti Animation for Signup */}
      <Confetti isActive={showSignupConfetti} />

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-8 w-[380px] animate-fade-in-subtle">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">School Management System</h1>
          <p className="text-sm text-gray-600">{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        {/* Error Message */}
        {message && (
          <div className="text-red-600 text-sm mb-6 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-lg animate-shake-subtle">
            {message}
          </div>
        )}

        {/* Forms */}
        {mode === "login" ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
            <div className="animate-slide-up-subtle">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5">
            <div className="animate-slide-up-subtle">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                {...signupForm.register("full_name")}
              />
              {signupForm.formState.errors.full_name && (
                <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                  {signupForm.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div className="animate-slide-up-subtle animation-delay-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                {...signupForm.register("email")}
              />
              {signupForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="animate-slide-up-subtle animation-delay-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                {...signupForm.register("role")}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {signupForm.formState.errors.role && (
                <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                  {signupForm.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* Student-specific fields */}
            {signupForm.watch("role") === "student" && (
              <div className="space-y-5 pt-2 border-t border-gray-100 animate-fade-in-subtle">
                <div className="animate-slide-up-subtle animation-delay-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 10A, Grade 5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    {...signupForm.register("class_number")}
                  />
                  {signupForm.formState.errors.class_number && (
                    <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                      {signupForm.formState.errors.class_number.message}
                    </p>
                  )}
                </div>

                <div className="animate-slide-up-subtle animation-delay-400">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Email <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    {...signupForm.register("parent_email")}
                  />
                  {signupForm.formState.errors.parent_email && (
                    <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                      {signupForm.formState.errors.parent_email.message}
                    </p>
                  )}
                </div>

                <div className="animate-slide-up-subtle animation-delay-500">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Phone <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    {...signupForm.register("parent_phone")}
                  />
                  {signupForm.formState.errors.parent_phone && (
                    <p className="text-red-500 text-xs mt-2 animate-fade-in-subtle">
                      {signupForm.formState.errors.parent_phone.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-6 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        )}

        {/* Mode Switch */}
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {mode === "login" ? (
              <>
                {"Don't have an account? "}
                <button
                  className="text-gray-900 hover:underline font-medium transition-all duration-200 hover:text-black"
                  onClick={() => switchMode("signup")}
                  type="button"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-gray-900 hover:underline font-medium transition-all duration-200 hover:text-black"
                  onClick={() => switchMode("login")}
                  type="button"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-up-bounce {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(-10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
          }
        }

        @keyframes check-path {
          0% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dasharray: 100 0;
            stroke-dashoffset: 0;
          }
        }

        .animate-scale-up-bounce {
          animation: scale-up-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: check-path 1s ease-out 0.3s forwards;
        }

        .animation-delay-150 {
          animation-delay: 0.15s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </>
  )
}
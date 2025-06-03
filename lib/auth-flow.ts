import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

/**
 * Generates a unique user ID based on role
 */
export function generateUniqueId(role: string): string {
  const prefix = role === "teacher" ? "T" : role === "student" ? "S" : "A"
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}${timestamp}${random}`
}

/**
 * Generates email verification token
 */
export function generateVerificationToken(): string {
  return uuidv4()
}

/**
 * Sends email verification for teachers
 */
export async function sendTeacherVerification(email: string, token: string, teacherName: string) {
  // In a real implementation, you would integrate with an email service
  // For now, we'll simulate this and log the verification link
  const verificationLink = `${window.location.origin}/auth/verify-email?token=${token}`

  console.log(`
    Email Verification for ${teacherName}
    To: ${email}
    Subject: Verify Your Teacher Account
    
    Please click the following link to verify your account:
    ${verificationLink}
    
    This link will expire in 24 hours.
  `)

  // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
  // For demo purposes, we'll return success
  return { success: true }
}

/**
 * Sends parent notification for student signup
 */
export async function sendParentNotification(
  studentName: string,
  studentId: string,
  parentContact: string,
  contactType: "email" | "phone",
) {
  try {
    const message = `Hello! Your child ${studentName} has successfully registered for the school management system. Student ID: ${studentId}. You can use this ${contactType} to access parent portal if needed.`

    // Store notification in database
    const { error } = await supabase.from("parent_notifications").insert([
      {
        student_id: studentId,
        parent_contact: parentContact,
        contact_type: contactType,
        message: message,
        notification_type: "signup_notification",
      },
    ])

    if (error) throw error

    // In a real implementation, send actual email/SMS
    console.log(`
      Parent Notification
      To: ${parentContact} (${contactType})
      Message: ${message}
    `)

    return { success: true }
  } catch (error) {
    console.error("Error sending parent notification:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to send notification" }
  }
}

/**
 * Creates a new user with appropriate verification flow
 */
export async function createUser(userData: {
  email: string
  full_name: string
  role: "teacher" | "student"
  class_number?: string
  parent_email?: string
  parent_phone?: string
}) {
  try {
    // Check if email already exists
    const { data: existingUser } = await supabase.from("users").select("email").eq("email", userData.email).single()

    if (existingUser) {
      throw new Error("Email already exists. Please use the login form.")
    }

    const uniqueId = generateUniqueId(userData.role)
    let verificationToken = null
    let verificationExpiresAt = null
    let emailVerified = false

    // Teachers need email verification
    if (userData.role === "teacher") {
      verificationToken = generateVerificationToken()
      verificationExpiresAt = new Date()
      verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24) // 24 hours
      emailVerified = false
    } else {
      // Students don't need email verification
      emailVerified = true
    }

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          unique_id: uniqueId,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          class_number: userData.class_number || null,
          parent_email: userData.parent_email || null,
          parent_phone: userData.parent_phone || null,
          email_verified: emailVerified,
          verification_token: verificationToken,
          verification_expires_at: verificationExpiresAt?.toISOString() || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Handle post-creation actions
    if (userData.role === "teacher" && verificationToken) {
      // Send verification email to teacher
      await sendTeacherVerification(userData.email, verificationToken, userData.full_name)

      return {
        success: true,
        user: newUser,
        needsVerification: true,
        message: "Account created! Please check your email to verify your account before logging in.",
      }
    } else if (userData.role === "student") {
      // Send notification to parent
      if (userData.parent_email) {
        await sendParentNotification(userData.full_name, newUser.id, userData.parent_email, "email")
      }
      if (userData.parent_phone) {
        await sendParentNotification(userData.full_name, newUser.id, userData.parent_phone, "phone")
      }

      return {
        success: true,
        user: newUser,
        needsVerification: false,
        message: `Student account created successfully! Your ID is: ${uniqueId}. Parent notification sent.`,
      }
    }

    return {
      success: true,
      user: newUser,
      needsVerification: false,
      message: `Account created successfully! Your ID is: ${uniqueId}`,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create account",
    }
  }
}

/**
 * Verifies email token for teachers
 */
export async function verifyEmailToken(token: string) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("verification_token", token)
      .eq("role", "teacher")
      .single()

    if (error || !user) {
      return {
        success: false,
        message: "Invalid or expired verification token.",
      }
    }

    // Check if token has expired
    if (user.verification_expires_at) {
      const expiresAt = new Date(user.verification_expires_at)
      const now = new Date()

      if (expiresAt < now) {
        return {
          success: false,
          message: "Verification token has expired. Please request a new one.",
        }
      }
    }

    // Verify the user
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) throw updateError

    return {
      success: true,
      user,
      message: "Email verified successfully! You can now log in.",
    }
  } catch (error) {
    console.error("Error verifying email:", error)
    return {
      success: false,
      message: "Error verifying email. Please try again.",
    }
  }
}

/**
 * Handles user login with different verification requirements
 */
export async function loginUser(email: string) {
  try {
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      return {
        success: false,
        message: "User not found. Please sign up or contact administration.",
      }
    }

    // Don't allow admins to login with email
    if (user.role === "admin") {
      return {
        success: false,
        message: "Admin users must use their admin code to login. Please use the 'Admin Login' option.",
      }
    }

    // Check if teacher has verified email
    if (user.role === "teacher" && !user.email_verified) {
      return {
        success: false,
        message: "Please verify your email address before logging in. Check your inbox for the verification link.",
      }
    }

    return {
      success: true,
      user,
      message: "Login successful!",
    }
  } catch (error) {
    console.error("Error during login:", error)
    return {
      success: false,
      message: "An error occurred during login. Please try again.",
    }
  }
}

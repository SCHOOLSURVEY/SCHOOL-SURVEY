"use server"

import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kpuauqntarndcyeqzmxi.supabase.co"
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdWF1cW50YXJuZGN5ZXF6bXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTAwMzMsImV4cCI6MjA2Mzc4NjAzM30.t9HtaJAFz0NaMxVDurhpEweNO-gy85KG0R4zSkFVoBU"
const supabase = createClient(supabaseUrl, supabaseKey)

interface RegistrationData {
  email: string
  full_name: string
  role: string
  class_number?: string | null
  parent_email?: string | null
  parent_phone?: string | null
}

interface NotificationResult {
  success: boolean
  error?: string
}

async function sendParentNotification(
  studentName: string,
  studentId: string,
  contact: string,
  type: "email" | "phone",
): Promise<NotificationResult> {
  // Placeholder for notification logic
  console.log(`Sending ${type} notification to ${contact} for student ${studentName} (ID: ${studentId})`)
  return { success: true }
}

export async function createUser(userData: RegistrationData) {
  const uniqueId = uuidv4()

  try {
    // Check if email already exists (case-insensitive)
    const { data: existingUser } = await supabase.from("users").select("*").ilike("email", userData.email).maybeSingle()

    if (existingUser) {
      throw new Error("An account with this email already exists. Please try logging in instead.")
    }

    // Create user (no email verification fields)
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
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error inserting new user:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
      })

      if (error.code === "23505") {
        throw new Error("An account with this email already exists. Please try logging in instead.")
      } else if (error.code === "23502") {
        throw new Error("Missing required information. Please fill in all required fields.")
      } else if (error.code === "42501") {
        throw new Error("Database permission error. Please contact support.")
      } else {
        throw new Error(`Failed to create account: ${error.message || "Unknown database error"}`)
      }
    }

    if (!newUser) {
      console.error("No user data returned after insert")
      throw new Error("Account creation failed - no user data returned.")
    }

    // Send notification to parent if student
    if (userData.role === "student") {
      if (userData.parent_email) {
        try {
          const notifyEmail = await sendParentNotification(
            userData.full_name,
            newUser.unique_id,
            userData.parent_email,
            "email",
          )
          if (!notifyEmail.success) {
            console.warn("Parent email notification failed:", notifyEmail.error)
          }
        } catch (notificationError) {
          console.warn("Error sending parent email notification:", notificationError)
        }
      }
      if (userData.parent_phone) {
        try {
          const notifyPhone = await sendParentNotification(
            userData.full_name,
            newUser.unique_id,
            userData.parent_phone,
            "phone",
          )
          if (!notifyPhone.success) {
            console.warn("Parent phone notification failed:", notifyPhone.error)
          }
        } catch (notificationError) {
          console.warn("Error sending parent phone notification:", notificationError)
        }
      }
    }

    return { success: true, data: newUser }
  } catch (err: any) {
    console.error("Registration failed:", err)
    return { success: false, error: err.message }
  }
}

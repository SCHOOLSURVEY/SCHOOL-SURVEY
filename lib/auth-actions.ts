"use server"

import { createUser as createUserFlow } from "@/lib/auth-flow"

interface AuthenticateParams {
  email: string
}

interface CreateUserParams {
  email: string
  full_name: string
  role: "teacher" | "student"
  class_number?: string
  parent_email?: string
  parent_phone?: string
}

export async function authenticate({ email }: AuthenticateParams) {
  try {
    // Import supabase client
    const { createClient } = await import("@supabase/supabase-js")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kpuauqntarndcyeqzmxi.supabase.co"
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdWF1cW50YXJuZGN5ZXF6bXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTAwMzMsImV4cCI6MjA2Mzc4NjAzM30.t9HtaJAFz0NaMxVDurhpEweNO-gy85KG0R4zSkFVoBU"

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find user by email
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error("Authentication error:", error)
      return {
        success: false,
        error: "User not found. Please check your email or sign up.",
      }
    }

    if (!user) {
      return {
        success: false,
        error: "User not found. Please check your email or sign up.",
      }
    }

    return {
      success: true,
      user,
    }
  } catch (error) {
    console.error("Authentication failed:", error)
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    }
  }
}

export async function createUser(userData: CreateUserParams) {
  try {
    const result = await createUserFlow({
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      class_number: userData.class_number || null, // Keep as string, don't convert to number
      parent_email: userData.parent_email || null,
      parent_phone: userData.parent_phone || null,
    })

    return result
  } catch (error) {
    console.error("User creation failed:", error)
    return {
      success: false,
      error: "Failed to create user. Please try again.",
    }
  }
}
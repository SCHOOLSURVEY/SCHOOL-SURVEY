import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

/**
 * Generates a unique admin code using UUID v4
 * Format: "ADM-" followed by first 8 characters of UUID
 */
export function generateAdminCode(): string {
  const uuid = uuidv4()
  return `ADM-${uuid.substring(0, 8)}`.toUpperCase()
}

/**
 * Creates a new admin user manually (for developer setup)
 * No email verification required
 */
export async function createAdminUser(adminData: {
  email: string
  full_name: string
  class_number?: string
}) {
  try {
    console.log("Starting admin user creation process...")

    // Generate unique admin code
    const adminCode = generateAdminCode()
    console.log("Generated admin code:", adminCode)

    // Generate unique ID
    const uniqueId = `A${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`
    console.log("Generated unique ID:", uniqueId)

    // Check if email already exists
    console.log("Checking if email exists:", adminData.email)
    const { data: existingUser, error: emailCheckError } = await supabase
      .from("users")
      .select("email")
      .eq("email", adminData.email)
      .maybeSingle()

    if (emailCheckError) {
      console.error("Error checking existing email:", emailCheckError)
      throw new Error(`Email check failed: ${emailCheckError.message}`)
    }

    if (existingUser) {
      console.log("Email already exists")
      throw new Error("Email already exists")
    }

    // Prepare admin user data - NO email verification
    const newAdminData = {
      unique_id: uniqueId,
      email: adminData.email,
      full_name: adminData.full_name,
      role: "admin",
      class_number: adminData.class_number || null,
      admin_code: adminCode,
      // No email_verified field
    }

    console.log("Creating admin user with data:", newAdminData)

    // Create admin user
    const { data: newAdmin, error } = await supabase.from("users").insert([newAdminData]).select().single()

    if (error) {
      console.error("Error inserting admin user:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Failed to create admin user: ${error.message}`)
    }

    if (!newAdmin) {
      throw new Error("Admin user was not returned after creation")
    }

    console.log("Admin user created successfully:", newAdmin)

    return {
      success: true,
      admin: newAdmin,
      adminCode,
      message: `Admin created successfully! Admin Code: ${adminCode}`,
    }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create admin user",
    }
  }
}

/**
 * Gets all admin users
 */
export async function getAllAdmins() {
  try {
    const { data: admins, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "admin")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching admins:", error)
      throw error
    }

    return { success: true, admins: admins || [] }
  } catch (error) {
    console.error("Error fetching admins:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch admins",
    }
  }
}

/**
 * Validates admin code for login - No email verification check
 */
export async function validateAdminCode(adminCode: string) {
  try {
    const { data: admin, error } = await supabase
      .from("users")
      .select("*")
      .eq("admin_code", adminCode)
      .eq("role", "admin")
      .single()

    if (error || !admin) {
      console.log("Admin code validation failed:", { adminCode, error })
      return {
        valid: false,
        message: "Invalid admin code. Please check your code and try again.",
      }
    }

    return {
      valid: true,
      admin,
      message: "Admin code validated successfully",
    }
  } catch (error) {
    console.error("Error validating admin code:", error)
    return {
      valid: false,
      message: "Error validating admin code. Please try again.",
    }
  }
}

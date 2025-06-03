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
 */
export async function createAdminUser(adminData: {
  email: string
  full_name: string
  class_number?: string
}) {
  try {
    // Generate unique admin code
    const adminCode = generateAdminCode()

    // Generate unique ID
    const uniqueId = `A${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    // Check if email already exists
    const { data: existingUser } = await supabase.from("users").select("email").eq("email", adminData.email).single()

    if (existingUser) {
      throw new Error("Email already exists")
    }

    // Check if admin code already exists (very unlikely but safety check)
    const { data: existingCode } = await supabase
      .from("users")
      .select("admin_code")
      .eq("admin_code", adminCode)
      .single()

    if (existingCode) {
      // Regenerate if collision (very rare)
      return createAdminUser(adminData)
    }

    // Create admin user
    const { data: newAdmin, error } = await supabase
      .from("users")
      .insert([
        {
          unique_id: uniqueId,
          email: adminData.email,
          full_name: adminData.full_name,
          role: "admin",
          class_number: adminData.class_number || null,
          admin_code: adminCode,
          email_verified: true, // Admins don't need email verification
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

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

    if (error) throw error

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
 * Validates admin code for login
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

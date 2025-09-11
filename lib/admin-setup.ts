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
 * Generates a unique teacher code using UUID v4
 * Format: "TCH-" followed by first 8 characters of UUID
 */
export function generateTeacherCode(): string {
  const uuid = uuidv4()
  return `TCH-${uuid.substring(0, 8)}`.toUpperCase()
}

/**
 * Creates a new admin user manually (for developer setup)
 * No email verification required
 */
export async function createAdminUser(adminData: {
  email: string
  full_name: string
  class_number?: string
  school_id: string
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

    // Check if email already exists in this school
    console.log("Checking if email exists:", adminData.email, "in school:", adminData.school_id)
    const { data: existingUser, error: emailCheckError } = await supabase
      .from("users")
      .select("email")
      .eq("email", adminData.email)
      .eq("school_id", adminData.school_id)
      .maybeSingle()

    if (emailCheckError) {
      console.error("Error checking existing email:", emailCheckError)
      throw new Error(`Email check failed: ${emailCheckError.message}`)
    }

    if (existingUser) {
      console.log("Email already exists in this school")
      throw new Error("Email already exists in this school")
    }

    // Prepare admin user data - NO email verification
    const newAdminData: any = {
      school_id: adminData.school_id,
      unique_id: uniqueId,
      email: adminData.email,
      full_name: adminData.full_name,
      role: "admin",
      admin_code: adminCode,
      email_verified: true,
      is_active: true
    }

    // Only add class_number if the column exists
    if (adminData.class_number) {
      newAdminData.class_number = adminData.class_number
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
 * Creates a new teacher user with teacher code
 */
export async function createTeacherUser(teacherData: {
  email: string
  full_name: string
  class_number?: string
  school_id: string
}) {
  try {
    console.log("Starting teacher user creation process...")

    // Generate unique teacher code
    const teacherCode = generateTeacherCode()
    console.log("Generated teacher code:", teacherCode)

    // Generate unique ID
    const uniqueId = `T${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`
    console.log("Generated unique ID:", uniqueId)

    // Check if email already exists in this school
    console.log("Checking if email exists:", teacherData.email, "in school:", teacherData.school_id)
    const { data: existingUser, error: emailCheckError } = await supabase
      .from("users")
      .select("email")
      .eq("email", teacherData.email)
      .eq("school_id", teacherData.school_id)
      .maybeSingle()

    if (emailCheckError) {
      console.error("Error checking existing email:", emailCheckError)
      throw new Error(`Email check failed: ${emailCheckError.message}`)
    }

    if (existingUser) {
      console.log("Email already exists in this school")
      throw new Error("Email already exists in this school")
    }

    // Prepare teacher user data
    const newTeacherData: any = {
      school_id: teacherData.school_id,
      unique_id: uniqueId,
      email: teacherData.email,
      full_name: teacherData.full_name,
      role: "teacher",
      teacher_code: teacherCode,
      email_verified: true,
      is_active: true
    }

    // Only add class_number if the column exists
    if (teacherData.class_number) {
      newTeacherData.class_number = teacherData.class_number
    }

    console.log("Creating teacher user with data:", newTeacherData)

    // Create teacher user
    const { data: newTeacher, error } = await supabase.from("users").insert([newTeacherData]).select().single()

    if (error) {
      console.error("Error inserting teacher user:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Failed to create teacher user: ${error.message}`)
    }

    if (!newTeacher) {
      throw new Error("Teacher user was not returned after creation")
    }

    console.log("Teacher user created successfully:", newTeacher)

    return {
      success: true,
      teacher: newTeacher,
      teacherCode,
      message: `Teacher created successfully! Teacher Code: ${teacherCode}`,
    }
  } catch (error) {
    console.error("Error creating teacher user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create teacher user",
    }
  }
}

/**
 * Gets all admin users for a specific school
 */
export async function getAllAdmins(schoolId?: string) {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .eq("role", "admin")
      .order("created_at", { ascending: false })

    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data: admins, error } = await query

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
export async function validateAdminCode(adminCode: string, schoolId?: string) {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .eq("admin_code", adminCode)
      .eq("role", "admin")

    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data: admin, error } = await query.single()

    if (error || !admin) {
      console.log("Admin code validation failed:", { adminCode, schoolId, error })
      return {
        success: false,
        error: "Invalid admin code.",
      }
    }

    console.log("Admin code validation successful:", admin.email, "Role:", admin.role, "School ID:", admin.school_id)
    return {
      success: true,
      user: admin,
    }
  } catch (error) {
    console.error("Error validating admin code:", error)
    return {
      success: false,
      error: "Failed to validate admin code. Please try again.",
    }
  }
}

/**
 * Validates teacher code for login
 */
export async function validateTeacherCode(teacherCode: string, schoolId?: string) {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .eq("teacher_code", teacherCode)
      .eq("role", "teacher")

    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data: teacher, error } = await query.single()

    if (error || !teacher) {
      console.log("Teacher code validation failed:", { teacherCode, schoolId, error })
      return {
        success: false,
        error: "Invalid teacher code.",
      }
    }

    console.log("Teacher code validation successful:", teacher.email, "Role:", teacher.role, "School ID:", teacher.school_id)
    return {
      success: true,
      user: teacher,
    }
  } catch (error) {
    console.error("Error validating teacher code:", error)
    return {
      success: false,
      error: "Failed to validate teacher code. Please try again.",
    }
  }
}

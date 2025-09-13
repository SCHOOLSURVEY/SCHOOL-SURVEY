import { DatabaseService } from "@/lib/database-server"
import { v4 as uuidv4 } from "uuid"

/**
 * Generates a unique admin code using UUID v4
 * Format: "ADM-" followed by first 8 characters of UUID
 */
export function generateAdminCode(schoolId?: string): string {
  const uuid = uuidv4()
  return `ADM-${uuid.substring(0, 8)}`.toUpperCase()
}

/**
 * Generates a unique teacher code using UUID v4
 * Format: "TCH-" followed by first 8 characters of UUID
 */
export function generateTeacherCode(schoolId?: string): string {
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
    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(adminData.email)
    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists"
      }
    }

    // Generate admin code
    const adminCode = generateAdminCode(adminData.school_id)

    // Create admin user
    const userData = {
      school_id: adminData.school_id,
      unique_id: `ADMIN${Date.now()}`,
      email: adminData.email,
      full_name: adminData.full_name,
      role: "admin" as const,
      class_number: adminData.class_number,
      admin_code: adminCode,
      is_active: true,
      email_verified: true, // Skip verification for admin setup
      created_at: new Date(),
      updated_at: new Date()
    }

    const user = await DatabaseService.createUser(userData)

    return {
      success: true,
      user,
      admin_code: adminCode
    }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return {
      success: false,
      error: "Failed to create admin user"
    }
  }
}

/**
 * Creates a new teacher user
 */
export async function createTeacherUser(teacherData: {
  email: string
  full_name: string
  class_number?: string
  school_id: string
}) {
  try {
    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(teacherData.email)
    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists"
      }
    }

    // Generate teacher code
    const teacherCode = generateTeacherCode(teacherData.school_id)

    // Create teacher user
    const userData = {
      school_id: teacherData.school_id,
      unique_id: `TCH${Date.now()}`,
      email: teacherData.email,
      full_name: teacherData.full_name,
      role: "teacher" as const,
      class_number: teacherData.class_number,
      teacher_code: teacherCode,
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }

    const user = await DatabaseService.createUser(userData)

    return {
      success: true,
      user,
      teacher_code: teacherCode
    }
  } catch (error) {
    console.error("Error creating teacher user:", error)
    return {
      success: false,
      error: "Failed to create teacher user"
    }
  }
}

/**
 * Creates a new student user
 */
export async function createStudentUser(studentData: {
  email: string
  full_name: string
  class_number?: string
  school_id: string
  parent_email?: string
  parent_phone?: string
}) {
  try {
    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(studentData.email)
    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists"
      }
    }

    // Create student user
    const userData = {
      school_id: studentData.school_id,
      unique_id: `STU${Date.now()}`,
      email: studentData.email,
      full_name: studentData.full_name,
      role: "student" as const,
      class_number: studentData.class_number,
      parent_email: studentData.parent_email,
      parent_phone: studentData.parent_phone,
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }

    const user = await DatabaseService.createUser(userData)

    return {
      success: true,
      user
    }
  } catch (error) {
    console.error("Error creating student user:", error)
    return {
      success: false,
      error: "Failed to create student user"
    }
  }
}

/**
 * Creates a new parent user
 */
export async function createParentUser(parentData: {
  email: string
  full_name: string
  school_id: string
  student_ids?: string[]
}) {
  try {
    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(parentData.email)
    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists"
      }
    }

    // Create parent user
    const userData = {
      school_id: parentData.school_id,
      unique_id: `PAR${Date.now()}`,
      email: parentData.email,
      full_name: parentData.full_name,
      role: "parent" as const,
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }

    const user = await DatabaseService.createUser(userData)

    return {
      success: true,
      user
    }
  } catch (error) {
    console.error("Error creating parent user:", error)
    return {
      success: false,
      error: "Failed to create parent user"
    }
  }
}

/**
 * Validates admin code and returns user if valid
 */
export async function validateAdminCode(adminCode: string, schoolId: string) {
  try {
    const users = await DatabaseService.getUsersByRole(schoolId, "admin")
    const admin = users.find(user => user.admin_code === adminCode)
    
    if (admin && admin.is_active) {
      return {
        success: true,
        user: admin
      }
    }
    
    return {
      success: false,
      error: "Invalid admin code"
    }
  } catch (error) {
    console.error("Error validating admin code:", error)
    return {
      success: false,
      error: "Failed to validate admin code"
    }
  }
}

/**
 * Validates teacher code and returns user if valid
 */
export async function validateTeacherCode(teacherCode: string, schoolId: string) {
  try {
    const users = await DatabaseService.getUsersByRole(schoolId, "teacher")
    const teacher = users.find(user => user.teacher_code === teacherCode)
    
    if (teacher && teacher.is_active) {
      return {
        success: true,
        user: teacher
      }
    }
    
    return {
      success: false,
      error: "Invalid teacher code"
    }
  } catch (error) {
    console.error("Error validating teacher code:", error)
    return {
      success: false,
      error: "Failed to validate teacher code"
    }
  }
}

"use server"

import { authenticate as mongoAuthenticate, createUser as mongoCreateUser, CreateUserParams } from "./auth-mongodb"

interface AuthenticateParams {
  email: string
  password: string
}

interface CreateUserParams {
  email: string
  full_name: string
  role: "teacher" | "student"
  class_number?: string
  parent_email?: string
  parent_phone?: string
}

export async function authenticate(email: string, password: string) {
  return await mongoAuthenticate(email, password)
}

export async function createUser(userData: CreateUserParams & { schoolId?: string }) {
  try {
    // Get school_id from the userData parameter or use a default
    const schoolId = userData.schoolId || "default-school"
    
    const mongoUserData = {
      school_id: schoolId,
      unique_id: `${userData.role.toUpperCase()}${Date.now()}`,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      class_number: userData.class_number,
      parent_email: userData.parent_email,
      parent_phone: userData.parent_phone,
      password: "defaultPassword123" // This should be generated or provided
    }

    const result = await mongoCreateUser(mongoUserData)
    return result
  } catch (error) {
    return {
      success: false,
      error: "Failed to create user. Please try again.",
    }
  }
}
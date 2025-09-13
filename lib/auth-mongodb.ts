import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { DatabaseService } from './database-server'
import { IUser } from './schemas'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthResult {
  success: boolean
  user?: IUser
  token?: string
  error?: string
}

export interface CreateUserParams {
  school_id: string
  unique_id: string
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'student' | 'parent'
  class_number?: string
  admin_code?: string
  teacher_code?: string
  parent_email?: string
  parent_phone?: string
  password?: string
}

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await DatabaseService.getUserByEmail(email)
    
    if (!user) {
      return {
        success: false,
        error: "Invalid email or password."
      }
    }

    // Check password if it exists
    if (user.password_hash && password) {
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid email or password."
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        schoolId: user.school_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return {
      success: true,
      user,
      token
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: "Authentication failed. Please try again."
    }
  }
}

export async function createUser(userData: CreateUserParams): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(userData.email)
    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists."
      }
    }

    // Hash password if provided
    let password_hash: string | undefined
    if (userData.password) {
      password_hash = await bcrypt.hash(userData.password, 12)
    }

    // Create user
    const user = await DatabaseService.createUser({
      ...userData,
      password_hash,
      email_verified: false,
      is_active: true
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        schoolId: user.school_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return {
      success: true,
      user,
      token
    }
  } catch (error) {
    console.error('User creation error:', error)
    return {
      success: false,
      error: "Failed to create user. Please try again."
    }
  }
}

export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await DatabaseService.getUserById(decoded.userId)
    
    if (!user || !user.is_active) {
      return {
        success: false,
        error: "Invalid token or user not found."
      }
    }

    return {
      success: true,
      user
    }
  } catch (error) {
    return {
      success: false,
      error: "Invalid token."
    }
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const password_hash = await bcrypt.hash(newPassword, 12)
    await DatabaseService.User.findByIdAndUpdate(userId, { password_hash })
    return true
  } catch (error) {
    console.error('Password update error:', error)
    return false
  }
}

export async function generateAdminCode(schoolId: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // Store admin code in database (you might want to create a separate collection for this)
  // For now, we'll just return the code
  return code
}

export async function generateTeacherCode(schoolId: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // Store teacher code in database
  return code
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

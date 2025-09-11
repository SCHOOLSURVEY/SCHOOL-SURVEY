"use client"

import type { User } from "@/lib/types"

interface SessionData {
  user: User
  timestamp: number
  schoolSlug: string
}

const SESSION_KEY = "sessionData"
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours
const TAB_ID_KEY = "activeTabId"

export class SessionManager {
  /**
   * Initialize session manager (clear any conflicting data)
   */
  static initialize(): void {
    try {
      // Generate a unique tab ID for this window/tab
      const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(TAB_ID_KEY, tabId)
      
      // Clear any old session data that might conflict
      const oldSessionData = localStorage.getItem("currentUser")
      if (oldSessionData) {
        try {
          const parsed = JSON.parse(oldSessionData)
          // If it's not a simple user object, it might be old session data
          if (parsed && (parsed.timestamp || parsed.schoolSlug)) {
            console.log("Found old session data format, clearing it")
            localStorage.removeItem("currentUser")
          }
        } catch (error) {
          console.log("Error parsing old session data, clearing it")
          localStorage.removeItem("currentUser")
        }
      }
      
      // Listen for storage changes to handle multi-tab conflicts
      window.addEventListener('storage', this.handleStorageChange)
    } catch (error) {
      console.error("Error initializing session manager:", error)
    }
  }

  /**
   * Handle storage changes from other tabs
   */
  private static handleStorageChange = (event: StorageEvent) => {
    // Only handle localStorage changes (not sessionStorage)
    if (event.storageArea !== localStorage) return
    
    if (event.key === "currentUser" && event.newValue === null) {
      // Another tab logged out, but we should check if this tab has its own session
      const currentTabUser = sessionStorage.getItem("currentUser")
      
      if (!currentTabUser) {
        // This tab doesn't have its own session, redirect to login
        const currentPath = window.location.pathname
        const pathParts = currentPath.split("/")
        const schoolSlug = pathParts[1]
        
        if (schoolSlug && schoolSlug !== "auth" && !currentPath.includes("/auth/")) {
          console.log("Another tab logged out and this tab has no session, redirecting to login")
          window.location.href = `/${schoolSlug}/auth/login`
        }
      } else {
        console.log("Another tab logged out but this tab has its own session, staying logged in")
      }
    }
  }

  /**
   * Store user session data with validation
   */
  static setUser(user: User, schoolSlug: string): void {
    try {
      // Validate user data before storing
      if (!user || !user.email || !user.role) {
        console.error("Invalid user data provided to setUser:", user)
        return
      }

      const sessionData: SessionData = {
        user,
        timestamp: Date.now(),
        schoolSlug,
      }
      
      console.log("About to store session data:", sessionData)
      const sessionDataString = JSON.stringify(sessionData)
      console.log("Session data JSON string:", sessionDataString)
      
      // Store in sessionStorage for tab isolation (primary storage)
      sessionStorage.setItem("currentUser", JSON.stringify(user))
      sessionStorage.setItem(SESSION_KEY, sessionDataString)
      
      // Also store in localStorage for cross-tab communication
      localStorage.setItem("currentUser", JSON.stringify(user))
      localStorage.setItem(SESSION_KEY, sessionDataString)
      
      console.log("Session stored for user:", user.email, "Role:", user.role, "School:", schoolSlug)
      
      // Verify the data was stored correctly
      const verification = localStorage.getItem(SESSION_KEY)
      console.log("Session storage verification:", verification ? "Success" : "Failed")
      console.log("Stored data matches input:", verification === sessionDataString)
    } catch (error) {
      console.error("Error storing session:", error)
    }
  }

  /**
   * Get current user with validation
   */
  static getCurrentUser(): User | null {
    try {
      console.log("SessionManager.getCurrentUser() called")
      
      // First try to get from sessionStorage (tab-specific)
      let sessionData = sessionStorage.getItem(SESSION_KEY)
      console.log("Session data from sessionStorage:", sessionData ? "Found" : "Not found")
      
      // Fallback to localStorage if sessionStorage is empty
      if (!sessionData) {
        sessionData = localStorage.getItem(SESSION_KEY)
        console.log("Session data from localStorage (fallback):", sessionData ? "Found" : "Not found")
      }
      
      if (sessionData) {
        console.log("Raw session data from localStorage:", sessionData)
        const parsed: SessionData = JSON.parse(sessionData)
        console.log("Parsed session data:", parsed)
        console.log("Parsed user:", parsed?.user)
        console.log("Parsed user type:", typeof parsed?.user)
        console.log("Parsed user email:", parsed?.user?.email)
        
        // Check if parsed data is valid
        if (!parsed || !parsed.user) {
          console.log("Invalid session data structure, clearing data")
          console.log("Parsed object keys:", parsed ? Object.keys(parsed) : "parsed is null/undefined")
          this.clearSession()
          return null
        }
        
        // Check if session is expired
        if (Date.now() - parsed.timestamp > SESSION_TIMEOUT) {
          console.log("Session expired, clearing data")
          this.clearSession()
          return null
        }
        
        console.log("Returning user from session data:", parsed.user.email, "Role:", parsed.user.role)
        return parsed.user
      }
      
      // Fallback to old format for backward compatibility
      let userData = sessionStorage.getItem("currentUser")
      console.log("Legacy user data from sessionStorage:", userData ? "Found" : "Not found")
      
      if (!userData) {
        userData = localStorage.getItem("currentUser")
        console.log("Legacy user data from localStorage (fallback):", userData ? "Found" : "Not found")
      }
      
      if (userData) {
        try {
          const user: User = JSON.parse(userData)
          if (!user || !user.email) {
            console.log("Invalid legacy user data structure, clearing data")
            this.clearSession()
            return null
          }
          console.log("Retrieved user from legacy storage:", user.email, "Role:", user.role)
          return user
        } catch (parseError) {
          console.log("Error parsing legacy user data, clearing data:", parseError)
          this.clearSession()
          return null
        }
      }
      
      console.log("No user data found in localStorage")
      return null
    } catch (error) {
      console.error("Error retrieving session:", error)
      this.clearSession()
      return null
    }
  }

  /**
   * Validate user session against current URL
   */
  static validateSession(currentPath: string): { isValid: boolean; user: User | null; error?: string } {
    const user = this.getCurrentUser()
    
    if (!user) {
      return { isValid: false, user: null, error: "No user session found" }
    }

    // Extract expected role from URL
    let expectedRole: string | null = null
    if (currentPath.includes("/admin")) {
      expectedRole = "admin"
    } else if (currentPath.includes("/teacher")) {
      expectedRole = "teacher"
    } else if (currentPath.includes("/student")) {
      expectedRole = "student"
    } else if (currentPath.includes("/parent")) {
      expectedRole = "parent"
    }

    // If we can determine expected role, validate it
    if (expectedRole && user.role !== expectedRole) {
      console.log("Role mismatch detected:", {
        userRole: user.role,
        expectedRole,
        currentPath,
        userEmail: user.email
      })
      return { 
        isValid: false, 
        user, 
        error: `Role mismatch: User is ${user.role} but trying to access ${expectedRole} dashboard` 
      }
    }

    return { isValid: true, user }
  }

  /**
   * Clear all session data
   */
  static clearSession(): void {
    try {
      // Clear localStorage
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem("currentUser")
      localStorage.removeItem("hasSeenWelcome")
      
      // Clear sessionStorage
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem("currentUser")
      sessionStorage.removeItem(TAB_ID_KEY)
      
      console.log("Session cleared from both localStorage and sessionStorage")
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  /**
   * Cleanup session manager (remove event listeners)
   */
  static cleanup(): void {
    try {
      window.removeEventListener('storage', this.handleStorageChange)
    } catch (error) {
      console.error("Error cleaning up session manager:", error)
    }
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): any {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY)
      const userData = localStorage.getItem("currentUser")
      
      return {
        hasSessionData: !!sessionData,
        hasUserData: !!userData,
        sessionData: sessionData ? JSON.parse(sessionData) : null,
        userData: userData ? JSON.parse(userData) : null,
        timestamp: Date.now(),
        url: typeof window !== "undefined" ? window.location.href : "unknown"
      }
    } catch (error) {
      return { error: "Failed to get session info", details: error }
    }
  }

  /**
   * Force clear all session data (useful for debugging)
   */
  static forceClearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem("currentUser")
      localStorage.removeItem("hasSeenWelcome")
      console.log("Force cleared all session data")
    } catch (error) {
      console.error("Error force clearing session:", error)
    }
  }
}

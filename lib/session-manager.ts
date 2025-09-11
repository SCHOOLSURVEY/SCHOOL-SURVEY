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
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return
      }

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
            localStorage.removeItem("currentUser")
          }
        } catch (error) {
          localStorage.removeItem("currentUser")
        }
      }
      
      // Listen for storage changes to handle multi-tab conflicts
      window.addEventListener('storage', this.handleStorageChange)
    } catch (error) {
      // Error initializing session manager
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
          window.location.href = `/${schoolSlug}/auth/login`
        }
      } else {
      }
    }
  }

  /**
   * Store user session data with validation
   */
  static setUser(user: User, schoolSlug: string): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return
      }

      // Validate user data before storing
      if (!user || !user.email || !user.role) {
        return
      }

      const sessionData: SessionData = {
        user,
        timestamp: Date.now(),
        schoolSlug,
      }
      
      const sessionDataString = JSON.stringify(sessionData)
      
      // Store in sessionStorage for tab isolation (primary storage)
      sessionStorage.setItem("currentUser", JSON.stringify(user))
      sessionStorage.setItem(SESSION_KEY, sessionDataString)
      
      // Also store in localStorage for cross-tab communication
      localStorage.setItem("currentUser", JSON.stringify(user))
      localStorage.setItem(SESSION_KEY, sessionDataString)
      
    } catch (error) {
      // Error storing session
    }
  }

  /**
   * Get current user with validation
   */
  static getCurrentUser(): User | null {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return null
      }
      
      // First try to get from sessionStorage (tab-specific)
      let sessionData = sessionStorage.getItem(SESSION_KEY)
      
      // Fallback to localStorage if sessionStorage is empty
      if (!sessionData) {
        sessionData = localStorage.getItem(SESSION_KEY)
      }
      
      if (sessionData) {
        const parsed: SessionData = JSON.parse(sessionData)
        
        // Check if parsed data is valid
        if (!parsed || !parsed.user) {
          this.clearSession()
          return null
        }
        
        // Check if session is expired
        if (Date.now() - parsed.timestamp > SESSION_TIMEOUT) {
          this.clearSession()
          return null
        }
        
        return parsed.user
      }
      
      // Fallback to old format for backward compatibility
      let userData = sessionStorage.getItem("currentUser")
      
      if (!userData) {
        userData = localStorage.getItem("currentUser")
      }
      
      if (userData) {
        try {
          const user: User = JSON.parse(userData)
          if (!user || !user.email) {
            this.clearSession()
            return null
          }
          return user
        } catch (parseError) {
          this.clearSession()
          return null
        }
      }
      
      return null
    } catch (error) {
      this.clearSession()
      return null
    }
  }

  /**
   * Validate user session against current URL
   */
  static validateSession(currentPath: string): { isValid: boolean; user: User | null; error?: string } {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return { isValid: false, user: null, error: "Not in browser environment" }
    }

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
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return
      }

      // Clear localStorage
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem("currentUser")
      localStorage.removeItem("hasSeenWelcome")
      
      // Clear sessionStorage
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem("currentUser")
      sessionStorage.removeItem(TAB_ID_KEY)
      
    } catch (error) {
      // Error clearing session
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
    } catch (error) {
      // Error force clearing session
    }
  }
}

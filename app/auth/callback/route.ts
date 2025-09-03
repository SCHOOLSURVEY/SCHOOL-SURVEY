import { createClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * This route handles the callback from Supabase Auth email verification
 * It's called when a user clicks the verification link in their email
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Redirect to the appropriate page based on user role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.user_metadata?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    } else if (user?.user_metadata?.role === "teacher") {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url))
    } else if (user?.user_metadata?.role === "parent") {
      return NextResponse.redirect(new URL("/parent/dashboard", request.url))
    } else if (user?.user_metadata?.role === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url))
    }
  }

  // If no code or user role not found, redirect to home
  return NextResponse.redirect(new URL("/", request.url))
}

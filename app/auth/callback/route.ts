import { type NextRequest, NextResponse } from "next/server"

/**
 * This route handles authentication callbacks
 * Since we're using MongoDB with custom auth, redirect to home
 */
export async function GET(request: NextRequest) {
  // Redirect to home page since we're using MongoDB auth
  return NextResponse.redirect(new URL("/", request.url))
}
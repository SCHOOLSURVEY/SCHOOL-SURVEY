import { Resend } from "resend"

// Initialize Resend with proper error handling
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not set in environment variables")
    throw new Error("Resend API key is missing. Please add RESEND_API_KEY to your .env.local file")
  }

  return new Resend(apiKey)
}

export async function sendVerificationEmail(email: string, token: string, teacherName: string) {
  try {
    // Check if we're in development and API key is missing
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 Email would be sent to:", email)
      console.log("🔗 Verification link:", `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`)

      // Return success for development without API key
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Email logged to console",
      }
    }

    const resend = getResendClient()
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`

    const { data, error } = await resend.emails.send({
      from: "School System <onboarding@resend.dev>", // Use resend.dev domain for testing
      to: [email],
      subject: "Verify Your Teacher Account - School Management System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to School Management System!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello ${teacherName}! 👋</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for joining our school management system. To complete your registration and access your teacher dashboard, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                ✅ Verify My Account
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 25px;">
              If the button doesn't work, you can copy and paste this link in your browser:
            </p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #495057;">
              ${verificationLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
              If you didn't create this account, please ignore this email or contact our support team.
              <br>
              © ${new Date().getFullYear()} School Management System. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Verification email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)

    // Fallback for development
    if (error instanceof Error && error.message.includes("API key")) {
      console.log("📧 Development fallback - Email would be sent to:", email)
      console.log("🔗 Verification link:", `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`)

      return {
        success: true,
        data: { id: "dev-fallback" },
        message: "Development mode: Check console for verification link",
      }
    }

    return { success: false, error: "Failed to send verification email" }
  }
}

export async function sendParentNotificationEmail(parentEmail: string, studentName: string, studentId: string) {
  try {
    // Check if we're in development and API key is missing
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 Parent notification would be sent to:", parentEmail)
      console.log("👨‍👩‍👧‍👦 Student:", studentName, "ID:", studentId)

      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Parent notification logged to console",
      }
    }

    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: "School System <onboarding@resend.dev>",
      to: [parentEmail],
      subject: `${studentName} Successfully Registered - School Management System`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Student Registration Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Student Registration Successful!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hello Parent/Guardian! 👋</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Great news! <strong>${studentName}</strong> has successfully registered for our school management system.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #155724; margin-top: 0;">📋 Registration Details:</h3>
              <p style="margin: 5px 0; color: #155724;"><strong>Student Name:</strong> ${studentName}</p>
              <p style="margin: 5px 0; color: #155724;"><strong>Student ID:</strong> ${studentId}</p>
              <p style="margin: 5px 0; color: #155724;"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="background: #cce5ff; border: 1px solid #99d6ff; border-radius: 5px; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #004085;">
                <strong>🔐 Parent Portal Access:</strong> You can use this email address to access the parent portal and monitor your child's progress.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 25px;">
              If you have any questions or need assistance, please don't hesitate to contact our school administration.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} School Management System. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Parent notification sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)

    // Fallback for development
    if (error instanceof Error && error.message.includes("API key")) {
      console.log("📧 Development fallback - Parent notification would be sent to:", parentEmail)
      console.log("👨‍👩‍👧‍👦 Student:", studentName, "ID:", studentId)

      return {
        success: true,
        data: { id: "dev-fallback" },
        message: "Development mode: Check console for notification details",
      }
    }

    return { success: false, error: "Failed to send parent notification" }
  }
}

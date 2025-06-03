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

// Email template wrapper for consistent styling
const createEmailTemplate = (title: string, content: string, buttonText?: string, buttonLink?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎓 School Management System</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      ${content}
      
      ${
        buttonText && buttonLink
          ? `
      <div style="text-align: center; margin: 35px 0;">
        <a href="${buttonLink}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: bold; 
                  font-size: 16px; 
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          ${buttonText}
        </a>
      </div>
      `
          : ""
      }
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>⏰ Important:</strong> This link will expire in 24 hours for security reasons.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
      <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
        If you didn't request this action, please ignore this email or contact our support team.
        <br><br>
        © ${new Date().getFullYear()} School Management System. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`

// 1. TEACHER EMAIL VERIFICATION
export async function sendVerificationEmail(email: string, token: string, teacherName: string) {
  try {
    // Development mode fallback
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 [DEV] Verification email for:", email)
      console.log("🔗 [DEV] Verification link:", `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`)
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Check console for verification link",
      }
    }

    const resend = getResendClient()
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`

    const content = `
      <h2 style="color: #495057; margin-top: 0;">Hello ${teacherName}! 👋</h2>
      
      <p style="font-size: 16px; margin-bottom: 25px;">
        Welcome to our school management system! To complete your registration and access your teacher dashboard, please verify your email address.
      </p>
      
      <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #155724; margin-top: 0;">✅ What's Next?</h3>
        <ul style="color: #155724; margin: 0; padding-left: 20px;">
          <li>Click the verification button below</li>
          <li>Complete your teacher profile</li>
          <li>Start managing your classes</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6c757d; margin-top: 25px;">
        If the button doesn't work, copy and paste this link in your browser:
      </p>
      <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #495057;">
        ${verificationLink}
      </p>
    `

    const { data, error } = await resend.emails.send({
      from: "School System <noreply@send.schoolms>", // Use your custom domain
      to: [email],
      subject: "✅ Verify Your Teacher Account - School Management System",
      html: createEmailTemplate("Verify Your Account", content, "🔓 Verify My Account", verificationLink),
    })

    if (error) {
      console.error("❌ Resend error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Verification email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)
    return { success: false, error: "Failed to send verification email" }
  }
}

// 2. PASSWORD RESET EMAIL
export async function sendPasswordResetEmail(email: string, token: string, userName: string) {
  try {
    // Development mode fallback
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 [DEV] Password reset email for:", email)
      console.log("🔗 [DEV] Reset link:", `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`)
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Check console for reset link",
      }
    }

    const resend = getResendClient()
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    const content = `
      <h2 style="color: #495057; margin-top: 0;">Hello ${userName}! 🔐</h2>
      
      <p style="font-size: 16px; margin-bottom: 25px;">
        We received a request to reset your password for your School Management System account. If you made this request, click the button below to create a new password.
      </p>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #856404; margin-top: 0;">🛡️ Security Notice</h3>
        <ul style="color: #856404; margin: 0; padding-left: 20px;">
          <li>This link expires in 1 hour</li>
          <li>You can only use this link once</li>
          <li>If you didn't request this, ignore this email</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6c757d; margin-top: 25px;">
        If the button doesn't work, copy and paste this link in your browser:
      </p>
      <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #495057;">
        ${resetLink}
      </p>
    `

    const { data, error } = await resend.emails.send({
      from: "School System <noreply@send.schoolms>",
      to: [email],
      subject: "🔐 Reset Your Password - School Management System",
      html: createEmailTemplate("Reset Your Password", content, "🔑 Reset My Password", resetLink),
    })

    if (error) {
      console.error("❌ Password reset email error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Password reset email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)
    return { success: false, error: "Failed to send password reset email" }
  }
}

// 3. PASSWORD RESET CONFIRMATION EMAIL
export async function sendPasswordResetConfirmationEmail(email: string, userName: string) {
  try {
    // Development mode fallback
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 [DEV] Password reset confirmation for:", email)
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Password reset confirmation logged",
      }
    }

    const resend = getResendClient()
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`

    const content = `
      <h2 style="color: #495057; margin-top: 0;">Hello ${userName}! ✅</h2>
      
      <p style="font-size: 16px; margin-bottom: 25px;">
        Great news! Your password has been successfully reset. You can now log in to your School Management System account with your new password.
      </p>
      
      <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #155724; margin-top: 0;">🎉 Password Updated Successfully!</h3>
        <p style="color: #155724; margin: 0;">
          Your account is now secure with your new password. You can log in immediately using your email and new password.
        </p>
      </div>
      
      <div style="background: #cce5ff; border: 1px solid #99d6ff; border-radius: 5px; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #004085;">
          <strong>🔐 Security Tip:</strong> If you didn't make this change, please contact our support team immediately.
        </p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: "School System <noreply@send.schoolms>",
      to: [email],
      subject: "✅ Password Successfully Reset - School Management System",
      html: createEmailTemplate("Password Reset Successful", content, "🚀 Login Now", loginLink),
    })

    if (error) {
      console.error("❌ Password reset confirmation error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Password reset confirmation sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)
    return { success: false, error: "Failed to send password reset confirmation" }
  }
}

// 4. PARENT NOTIFICATION EMAIL
export async function sendParentNotificationEmail(parentEmail: string, studentName: string, studentId: string) {
  try {
    // Development mode fallback
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 [DEV] Parent notification for:", parentEmail)
      console.log("👨‍👩‍👧‍👦 [DEV] Student:", studentName, "ID:", studentId)
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Parent notification logged",
      }
    }

    const resend = getResendClient()
    const parentPortalLink = `${process.env.NEXT_PUBLIC_APP_URL}/parent/dashboard`

    const content = `
      <h2 style="color: #495057; margin-top: 0;">Hello Parent/Guardian! 👋</h2>
      
      <p style="font-size: 16px; margin-bottom: 25px;">
        Great news! <strong>${studentName}</strong> has been successfully registered in our school management system.
      </p>
      
      <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #155724; margin-top: 0;">📋 Registration Details:</h3>
        <table style="width: 100%; color: #155724;">
          <tr><td style="padding: 5px 0;"><strong>Student Name:</strong></td><td>${studentName}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Student ID:</strong></td><td>${studentId}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Registration Date:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
          <tr><td style="padding: 5px 0;"><strong>Parent Email:</strong></td><td>${parentEmail}</td></tr>
        </table>
      </div>
      
      <div style="background: #cce5ff; border: 1px solid #99d6ff; border-radius: 5px; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #004085;">
          <strong>🔐 Parent Portal Access:</strong> Use this email address to access the parent portal and monitor your child's academic progress, attendance, and school activities.
        </p>
      </div>
      
      <p style="font-size: 14px; color: #6c757d; margin-top: 25px;">
        If you have any questions or need assistance accessing the parent portal, please don't hesitate to contact our school administration.
      </p>
    `

    const { data, error } = await resend.emails.send({
      from: "School System <noreply@send.schoolms>",
      to: [parentEmail],
      subject: `🎓 ${studentName} Successfully Registered - School Management System`,
      html: createEmailTemplate(
        "Student Registration Successful",
        content,
        "👨‍👩‍👧‍👦 Access Parent Portal",
        parentPortalLink,
      ),
    })

    if (error) {
      console.error("❌ Parent notification error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Parent notification sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)
    return { success: false, error: "Failed to send parent notification" }
  }
}

// 5. WELCOME EMAIL FOR NEW USERS
export async function sendWelcomeEmail(email: string, userName: string, userType: "teacher" | "parent" | "student") {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 [DEV] Welcome email for:", email, "Type:", userType)
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Welcome email logged",
      }
    }

    const resend = getResendClient()
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/${userType}/dashboard`

    const userTypeEmoji = {
      teacher: "👨‍🏫",
      parent: "👨‍👩‍👧‍👦",
      student: "🎓",
    }

    const content = `
      <h2 style="color: #495057; margin-top: 0;">Welcome ${userName}! ${userTypeEmoji[userType]}</h2>
      
      <p style="font-size: 16px; margin-bottom: 25px;">
        Welcome to the School Management System! We're excited to have you as part of our educational community.
      </p>
      
      <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #0066cc; margin-top: 0;">🚀 Getting Started</h3>
        <ul style="color: #0066cc; margin: 0; padding-left: 20px;">
          <li>Complete your profile setup</li>
          <li>Explore your dashboard features</li>
          <li>Connect with other users</li>
          <li>Access learning resources</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6c757d; margin-top: 25px;">
        Need help getting started? Check out our help center or contact our support team.
      </p>
    `

    const { data, error } = await resend.emails.send({
      from: "School System <noreply@send.schoolms>",
      to: [email],
      subject: `🎉 Welcome to School Management System - ${userName}!`,
      html: createEmailTemplate("Welcome to School Management System", content, "🏠 Go to Dashboard", dashboardLink),
    })

    if (error) {
      console.error("❌ Welcome email error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Welcome email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)
    return { success: false, error: "Failed to send welcome email" }
  }
}

// 6. UTILITY FUNCTION - Send Custom Email
export async function sendCustomEmail(to: string, subject: string, htmlContent: string, fromName = "School System") {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 [DEV] Custom email to:", to, "Subject:", subject)
      return {
        success: true,
        data: { id: "dev-mode" },
        message: "Development mode: Custom email logged",
      }
    }

    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: `${fromName} <noreply@send.schoolms>`,
      to: [to],
      subject: subject,
      html: htmlContent,
    })

    if (error) {
      console.error("❌ Custom email error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Custom email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Email service error:", error)
    return { success: false, error: "Failed to send custom email" }
  }
}

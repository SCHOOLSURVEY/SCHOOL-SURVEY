"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

interface NotificationEmailData {
  recipientName: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  type: "assignment" | "grade" | "announcement" | "attendance" | "survey" | "general"
}

export async function sendEmail({ to, subject, html, from = "School Management System <noreply@schoolsystem.com>" }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, email not sent")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error("Email send error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Email service error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendNotificationEmail(data: NotificationEmailData) {
  const { recipientName, title, message, actionUrl, actionText, type } = data

  const getTypeColor = (type: string) => {
    switch (type) {
      case "assignment": return "#3b82f6"
      case "grade": return "#10b981"
      case "announcement": return "#f59e0b"
      case "attendance": return "#ef4444"
      case "survey": return "#8b5cf6"
      default: return "#6b7280"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assignment": return "📝"
      case "grade": return "📊"
      case "announcement": return "📢"
      case "attendance": return "📅"
      case "survey": return "📋"
      default: return "🔔"
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${getTypeColor(type)} 0%, ${getTypeColor(type)}dd 100%); padding: 2rem; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 600;">
            ${getTypeIcon(type)} School Management System
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 2rem;">
          <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.25rem;">
            Hello ${recipientName},
          </h2>
          
          <div style="background-color: #f9fafb; border-left: 4px solid ${getTypeColor(type)}; padding: 1rem; margin: 1rem 0; border-radius: 0 0.5rem 0.5rem 0;">
            <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1.1rem;">
              ${title}
            </h3>
            <p style="color: #4b5563; margin: 0; line-height: 1.6;">
              ${message}
            </p>
          </div>

          ${actionUrl && actionText ? `
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${actionUrl}" 
                 style="display: inline-block; background-color: ${getTypeColor(type)}; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem;">
                ${actionText}
              </a>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 2rem;">
            <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
              This is an automated message from the School Management System. 
              Please do not reply to this email.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 1rem 2rem; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 0.75rem; margin: 0;">
            © ${new Date().getFullYear()} School Management System. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: data.recipientName, // This should be the email address
    subject: title,
    html
  })
}

export async function sendAssignmentNotification(
  studentEmail: string,
  studentName: string,
  assignmentTitle: string,
  courseName: string,
  dueDate: string,
  assignmentUrl: string
) {
  return await sendNotificationEmail({
    recipientName: studentName,
    title: "New Assignment Posted",
    message: `A new assignment "${assignmentTitle}" has been posted for ${courseName}. It's due on ${new Date(dueDate).toLocaleDateString()}.`,
    actionUrl: assignmentUrl,
    actionText: "View Assignment",
    type: "assignment"
  })
}

export async function sendGradeNotification(
  studentEmail: string,
  studentName: string,
  assignmentTitle: string,
  grade: string,
  courseName: string,
  gradeUrl: string
) {
  return await sendNotificationEmail({
    recipientName: studentName,
    title: "Grade Posted",
    message: `Your grade for "${assignmentTitle}" in ${courseName} has been posted. You received: ${grade}`,
    actionUrl: gradeUrl,
    actionText: "View Grade",
    type: "grade"
  })
}

export async function sendAttendanceNotification(
  parentEmail: string,
  parentName: string,
  studentName: string,
  attendanceStatus: string,
  date: string,
  courseName: string
) {
  return await sendNotificationEmail({
    recipientName: parentName,
    title: "Attendance Update",
    message: `${studentName} was marked as ${attendanceStatus} in ${courseName} on ${new Date(date).toLocaleDateString()}.`,
    actionUrl: "#", // Add appropriate URL
    actionText: "View Attendance",
    type: "attendance"
  })
}

export async function sendSurveyNotification(
  studentEmail: string,
  studentName: string,
  surveyTitle: string,
  courseName: string,
  surveyUrl: string
) {
  return await sendNotificationEmail({
    recipientName: studentName,
    title: "New Survey Available",
    message: `A new survey "${surveyTitle}" is available for ${courseName}. Your feedback is important to us.`,
    actionUrl: surveyUrl,
    actionText: "Take Survey",
    type: "survey"
  })
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  userRole: string,
  loginUrl: string
) {
  return await sendNotificationEmail({
    recipientName: userName,
    title: "Welcome to School Management System",
    message: `Your ${userRole} account has been created successfully. You can now access the system and start using all available features.`,
    actionUrl: loginUrl,
    actionText: "Login to System",
    type: "general"
  })
}

export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetUrl: string
) {
  return await sendNotificationEmail({
    recipientName: userName,
    title: "Password Reset Request",
    message: "You have requested to reset your password. Click the button below to create a new password.",
    actionUrl: resetUrl,
    actionText: "Reset Password",
    type: "general"
  })
}


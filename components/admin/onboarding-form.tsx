"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createUser } from "@/lib/auth-flow"
import { Info, Mail, Phone } from "lucide-react"

interface OnboardingFormProps {
  onSuccess: () => void
}

export function OnboardingForm({ onSuccess }: OnboardingFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "",
    class_number: "",
    parent_email: "",
    parent_phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      // Validate required fields
      if (!formData.email || !formData.full_name || !formData.role) {
        setMessage("Please fill in all required fields")
        setLoading(false)
        return
      }

      // For students, require at least one parent contact
      if (formData.role === "student" && !formData.parent_email && !formData.parent_phone) {
        setMessage("Please provide at least one parent contact for students")
        setLoading(false)
        return
      }

      const result = await createUser({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role as "teacher" | "student",
        class_number: formData.class_number,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
      })

      if (result.success) {
        setMessage(result.message ?? "User created successfully!")
        setFormData({
          email: "",
          full_name: "",
          role: "",
          class_number: "",
          parent_email: "",
          parent_phone: "",
        })
        onSuccess()
      } else {
        setMessage(result.error ?? "Failed to create user")
      }
    } catch (error) {
      setMessage("An error occurred while creating the user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard New User</CardTitle>
        <CardDescription>Add teachers and students to the system with proper verification flow</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_number">
                {formData.role === "student" ? "Class Number" : "Department (Optional)"}
              </Label>
              <Input
                id="class_number"
                value={formData.class_number}
                onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                placeholder={formData.role === "student" ? "e.g., 10A, 12B" : "e.g., Mathematics"}
                required={formData.role === "student"}
              />
            </div>
          </div>

          {/* Student Parent Contact Fields */}
          {formData.role === "student" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Parent/Guardian Contact (At least one required)</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_email" className="text-sm flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    Parent Email
                  </Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    placeholder="parent@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_phone" className="text-sm flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    Parent Phone
                  </Label>
                  <Input
                    id="parent_phone"
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Parent will receive a notification about the student registration and can use this contact info for
                  the parent portal.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Teacher Verification Notice */}
          {formData.role === "teacher" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Teacher Verification:</strong> The teacher will receive an email verification link and must
                verify their email before they can log in.
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading || !formData.role}>
            {loading ? "Creating..." : "Create User"}
          </Button>

          {message && (
            <div
              className={`text-sm ${
                message.includes("Error") || message.includes("Failed") || message.includes("provide")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

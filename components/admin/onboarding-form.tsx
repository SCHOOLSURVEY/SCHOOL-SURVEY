"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface OnboardingFormProps {
  onSuccess: () => void
}

export function OnboardingForm({ onSuccess }: OnboardingFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "",
    class_number: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const generateUniqueId = (role: string) => {
    const prefix = role === "teacher" ? "T" : "S"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}${timestamp}${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const uniqueId = generateUniqueId(formData.role)

      const { error } = await supabase.from("users").insert([
        {
          unique_id: uniqueId,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          class_number: formData.class_number || null,
        },
      ])

      if (error) {
        setMessage("Error creating user: " + error.message)
      } else {
        setMessage(`User created successfully! ID: ${uniqueId}`)
        setFormData({ email: "", full_name: "", role: "", class_number: "" })
        onSuccess()
      }
    } catch (error) {
      setMessage("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard New User</CardTitle>
        <CardDescription>Add teachers and students to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
              <Label htmlFor="class_number">Class Number</Label>
              <Input
                id="class_number"
                value={formData.class_number}
                onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                placeholder="e.g., 10A, 12B"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>

          {message && (
            <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Users, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ParentRegistrationPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    address: "",
    studentEmail: "",
    relationship: ""
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [schoolName, setSchoolName] = useState("Default School")
  const router = useRouter()

  // Fetch school name on component mount
  useEffect(() => {
    fetchSchoolName()
  }, [])

  const fetchSchoolName = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("name")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single()

      if (data && !error) {
        setSchoolName(data.name)
      }
    } catch (error) {
      console.error("Error fetching school name:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            school_id: '00000000-0000-0000-0000-000000000001', // Default school
            unique_id: `PAR-${Date.now()}`,
            email: formData.email,
            full_name: formData.fullName,
            role: 'parent',
            phone: formData.phone,
            address: formData.address,
            is_active: true,
            email_verified: false
          })

        if (profileError) throw profileError

        // Create parent-student relationship if student email is provided
        if (formData.studentEmail) {
          // First, find the student by email
          const { data: studentData, error: studentError } = await supabase
            .from('users')
            .select('id')
            .eq('email', formData.studentEmail)
            .eq('role', 'student')
            .single()

          if (studentData && !studentError) {
            // Create the relationship
            await supabase
              .from('parent_student_relationships')
              .insert({
                parent_id: authData.user.id,
                student_id: studentData.id,
                relationship: formData.relationship || 'parent',
                school_id: '00000000-0000-0000-0000-000000000001'
              })
          }
        }

        setMessage({ 
          type: 'success', 
          text: 'Account created successfully! Please check your email to verify your account.' 
        })
        
        // Redirect to parent dashboard after 2 seconds
        setTimeout(() => {
          router.push('/parent')
        }, 2000)
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create account. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Parent Registration</CardTitle>
          <CardDescription className="text-gray-600">
            Create a parent account to monitor your child's academic progress
          </CardDescription>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              🏫 Registering for: <span className="font-bold">{schoolName}</span>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Your account will be created for this school automatically
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Student</Label>
                <Input
                  id="relationship"
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => handleInputChange('relationship', e.target.value)}
                  placeholder="e.g., Father, Mother, Guardian"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Your home address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentEmail">Student Email (Optional)</Label>
              <Input
                id="studentEmail"
                type="email"
                value={formData.studentEmail}
                onChange={(e) => handleInputChange('studentEmail', e.target.value)}
                placeholder="Your child's email address to link accounts"
              />
              <p className="text-sm text-gray-500">
                If you provide your child's email, we'll automatically link your accounts
              </p>
            </div>

            {message && (
              <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Parent Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

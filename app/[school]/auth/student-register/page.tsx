"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatabaseService } from "@/lib/database-client"
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface School {
  _id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

export default function SchoolSpecificStudentRegistration() {
  const params = useParams()
  const schoolSlug = params.school as string
  const router = useRouter()
  
  const [school, setSchool] = useState<School | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    classNumber: "",
    parentEmail: "",
    parentPhone: "",
    address: ""
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch school information based on slug
  useEffect(() => {
    if (schoolSlug) {
      fetchSchoolInfo()
    }
  }, [schoolSlug])

  const fetchSchoolInfo = async () => {
    try {
      const schools = await DatabaseService.getAllSchools()
      const school = schools.find(s => s.slug === schoolSlug && s.is_active)
      
      if (!school) {
        throw new Error("School not found")
      }
      setSchool(school)
    } catch (error) {
      console.error("Error fetching school info:", error)
      // Redirect to main page if school not found
      router.push("/")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!school) return

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
        // Create user profile for this specific school
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            school_id: school.id, // Use the specific school ID
            unique_id: `STU-${Date.now()}`,
            email: formData.email,
            full_name: formData.fullName,
            role: 'student',
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            class_number: formData.classNumber,
            parent_email: formData.parentEmail,
            parent_phone: formData.parentPhone,
            address: formData.address,
            is_active: true,
            email_verified: false
          })

        if (profileError) throw profileError

        setMessage({ 
          type: 'success', 
          text: `Account created successfully for ${school.name}! You can now log in.` 
        })
        
        // Redirect to student dashboard after 2 seconds
        setTimeout(() => {
          router.push(`/${schoolSlug}/student`)
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

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const primaryColor = school.primary_color || '#3B82F6'
  const secondaryColor = school.secondary_color || '#1E40AF'

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`
      }}
    >
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardHeader className="text-center" style={{ backgroundColor: `${primaryColor}05` }}>
          {school.logo_url && (
            <div className="mx-auto mb-4">
              <img 
                src={school.logo_url} 
                alt={`${school.name} Logo`}
                className="w-16 h-16 object-contain"
              />
            </div>
          )}
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <UserPlus className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Student Registration
          </CardTitle>
          <CardDescription className="text-gray-600">
            Create a new student account for {school.name}
          </CardDescription>
          <div 
            className="mt-4 p-3 rounded-lg border"
            style={{ 
              backgroundColor: `${primaryColor}10`,
              borderColor: `${primaryColor}30`
            }}
          >
            <p className="text-sm font-medium" style={{ color: primaryColor }}>
              🏫 Registering for: <span className="font-bold">{school.name}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: secondaryColor }}>
              Your account will be created for {school.name} automatically
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
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classNumber">Class/Grade</Label>
                <Input
                  id="classNumber"
                  type="text"
                  value={formData.classNumber}
                  onChange={(e) => handleInputChange('classNumber', e.target.value)}
                  placeholder="e.g., Grade 10, Class A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                placeholder="Parent or guardian email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                  placeholder="Parent or guardian phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Home address"
                />
              </div>
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
              className="w-full text-white"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Create Student Account for ${school.name}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

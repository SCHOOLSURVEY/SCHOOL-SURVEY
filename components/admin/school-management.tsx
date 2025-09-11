"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { generateAdminCode, createAdminUser } from "@/lib/admin-setup"
import { Plus, Building2, Users, Key, Eye, EyeOff, Copy, RefreshCw } from "lucide-react"
import type { School, User } from "@/lib/types"

interface SchoolWithStats extends School {
  admin_count: number
  teacher_count: number
  student_count: number
}

interface AdminUser extends User {
  admin_code: string | null
}

export function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateSchoolDialogOpen, setIsCreateSchoolDialogOpen] = useState(false)
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [newSchool, setNewSchool] = useState({
    name: "",
    slug: "",
    abbreviation: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    logo_url: "",
    custom_domain: ""
  })

  const [newAdmin, setNewAdmin] = useState({
    email: "",
    full_name: "",
    class_number: "",
  })

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      // Fetch schools with user counts
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (schoolsError) throw schoolsError

      // Get user counts for each school
      const schoolsWithStats = await Promise.all(
        (schoolsData || []).map(async (school) => {
          const [adminCount, teacherCount, studentCount] = await Promise.all([
            supabase
              .from("users")
              .select("id", { count: "exact" })
              .eq("school_id", school.id)
              .eq("role", "admin"),
            supabase
              .from("users")
              .select("id", { count: "exact" })
              .eq("school_id", school.id)
              .eq("role", "teacher"),
            supabase
              .from("users")
              .select("id", { count: "exact" })
              .eq("school_id", school.id)
              .eq("role", "student")
          ])

          return {
            ...school,
            admin_count: adminCount.count || 0,
            teacher_count: teacherCount.count || 0,
            student_count: studentCount.count || 0
          }
        })
      )

      setSchools(schoolsWithStats)
    } catch (error) {
      console.error("Error fetching schools:", error)
      setMessage({ type: "error", text: "Failed to fetch schools" })
    } finally {
      setLoading(false)
    }
  }

  const createSchool = async () => {
    if (!newSchool.name || !newSchool.slug) {
      setMessage({ type: "error", text: "Please fill in required fields" })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const { data, error } = await supabase
        .from("schools")
        .insert({
          name: newSchool.name.trim(),
          slug: newSchool.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          abbreviation: newSchool.abbreviation.trim() || null,
          description: newSchool.description.trim() || null,
          address: newSchool.address.trim() || null,
          phone: newSchool.phone.trim() || null,
          email: newSchool.email.trim() || null,
          website: newSchool.website.trim() || null,
          primary_color: newSchool.primary_color,
          secondary_color: newSchool.secondary_color,
          logo_url: newSchool.logo_url.trim() || null,
          custom_domain: newSchool.custom_domain.trim() || null,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setMessage({ type: "success", text: "School created successfully!" })
      setNewSchool({
        name: "",
        slug: "",
        abbreviation: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        primary_color: "#3B82F6",
        secondary_color: "#1E40AF",
        logo_url: "",
        custom_domain: ""
      })
      setIsCreateSchoolDialogOpen(false)
      fetchSchools()
    } catch (error) {
      console.error("Error creating school:", error)
      setMessage({ type: "error", text: "Failed to create school" })
    } finally {
      setCreating(false)
    }
  }

  const createAdminForSchool = async () => {
    if (!selectedSchool || !newAdmin.email || !newAdmin.full_name) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const result = await createAdminUser({
        ...newAdmin,
        school_id: selectedSchool.id
      })

      if (result.success) {
        setMessage({ type: "success", text: result.message || "Admin created successfully!" })
        setNewAdmin({ email: "", full_name: "", class_number: "" })
        setIsCreateAdminDialogOpen(false)
        setSelectedSchool(null)
        fetchSchools()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create admin" })
      }
    } catch (error) {
      console.error("Error creating admin:", error)
      setMessage({ type: "error", text: "Failed to create admin user" })
    } finally {
      setCreating(false)
    }
  }

  const toggleCodeVisibility = (adminId: string) => {
    setShowCodes((prev) => ({ ...prev, [adminId]: !prev[adminId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Copied to clipboard!" })
    setTimeout(() => setMessage(null), 2000)
  }

  const openCreateAdminDialog = (school: School) => {
    setSelectedSchool(school)
    setIsCreateAdminDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading schools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>School Management</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Manage schools and create school-specific administrators. Each school operates independently.
              </CardDescription>
            </div>
            <Dialog open={isCreateSchoolDialogOpen} onOpenChange={setIsCreateSchoolDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create School
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New School</DialogTitle>
                  <DialogDescription>
                    Add a new school to the system. Each school will have its own isolated data and administrators.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school-name">School Name *</Label>
                      <Input
                        id="school-name"
                        value={newSchool.name}
                        onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                        placeholder="e.g., Tech Academy"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-slug">URL Slug *</Label>
                      <Input
                        id="school-slug"
                        value={newSchool.slug}
                        onChange={(e) => setNewSchool({ ...newSchool, slug: e.target.value })}
                        placeholder="e.g., tech-academy"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school-abbreviation">Abbreviation</Label>
                      <Input
                        id="school-abbreviation"
                        value={newSchool.abbreviation}
                        onChange={(e) => setNewSchool({ ...newSchool, abbreviation: e.target.value })}
                        placeholder="e.g., TA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-phone">Phone</Label>
                      <Input
                        id="school-phone"
                        value={newSchool.phone}
                        onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                        placeholder="e.g., +1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-description">Description</Label>
                    <Textarea
                      id="school-description"
                      value={newSchool.description}
                      onChange={(e) => setNewSchool({ ...newSchool, description: e.target.value })}
                      placeholder="Brief description of the school..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-address">Address</Label>
                    <Textarea
                      id="school-address"
                      value={newSchool.address}
                      onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                      placeholder="Full school address..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school-email">Email</Label>
                      <Input
                        id="school-email"
                        type="email"
                        value={newSchool.email}
                        onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                        placeholder="e.g., info@techacademy.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-website">Website</Label>
                      <Input
                        id="school-website"
                        value={newSchool.website}
                        onChange={(e) => setNewSchool({ ...newSchool, website: e.target.value })}
                        placeholder="e.g., https://techacademy.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-custom-domain">Custom Domain</Label>
                      <Input
                        id="school-custom-domain"
                        value={newSchool.custom_domain}
                        onChange={(e) => setNewSchool({ ...newSchool, custom_domain: e.target.value })}
                        placeholder="e.g., techacademy.com"
                      />
                    </div>
                  </div>

                  {/* Branding Section */}
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-3">School Branding</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="school-primary-color">Primary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="school-primary-color"
                              type="color"
                              value={newSchool.primary_color}
                              onChange={(e) => setNewSchool({ ...newSchool, primary_color: e.target.value })}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              value={newSchool.primary_color}
                              onChange={(e) => setNewSchool({ ...newSchool, primary_color: e.target.value })}
                              placeholder="#3B82F6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="school-secondary-color">Secondary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="school-secondary-color"
                              type="color"
                              value={newSchool.secondary_color}
                              onChange={(e) => setNewSchool({ ...newSchool, secondary_color: e.target.value })}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              value={newSchool.secondary_color}
                              onChange={(e) => setNewSchool({ ...newSchool, secondary_color: e.target.value })}
                              placeholder="#1E40AF"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="school-logo-url">Logo URL</Label>
                        <Input
                          id="school-logo-url"
                          value={newSchool.logo_url}
                          onChange={(e) => setNewSchool({ ...newSchool, logo_url: e.target.value })}
                          placeholder="e.g., https://example.com/logo.png"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={createSchool}
                    className="w-full"
                    disabled={creating || !newSchool.name || !newSchool.slug}
                  >
                    {creating ? "Creating School..." : "Create School"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {schools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Schools Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first school to get started with the multi-tenant system.
              </p>
              <Button onClick={() => setIsCreateSchoolDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First School
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead className="hidden sm:table-cell">Abbreviation</TableHead>
                    <TableHead className="hidden md:table-cell">Admins</TableHead>
                    <TableHead className="hidden lg:table-cell">Teachers</TableHead>
                    <TableHead className="hidden xl:table-cell">Students</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-muted-foreground">{school.slug}</div>
                          {school.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {school.description}
                            </div>
                          )}
                          <div className="sm:hidden mt-2 space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {school.abbreviation || "N/A"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{school.admin_count} admins, {school.teacher_count} teachers, {school.student_count} students</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {school.abbreviation ? (
                          <Badge variant="outline">{school.abbreviation}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{school.admin_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{school.teacher_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{school.student_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => openCreateAdminDialog(school)}
                          className="w-full sm:w-auto"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Create Admin</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Administrator for {selectedSchool?.name}</DialogTitle>
            <DialogDescription>
              Add a new administrator for this school. They will receive a unique access code for secure login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full Name *</Label>
              <Input
                id="admin-name"
                value={newAdmin.full_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address *</Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="e.g., admin@school.edu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-class">Department/Title (Optional)</Label>
              <Input
                id="admin-class"
                value={newAdmin.class_number}
                onChange={(e) => setNewAdmin({ ...newAdmin, class_number: e.target.value })}
                placeholder="e.g., Principal, Vice Principal"
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Important</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                The admin will use their generated code (not email) to log in. Make sure to securely share
                the code with them after creation.
              </p>
            </div>
            <Button
              onClick={createAdminForSchool}
              className="w-full"
              disabled={creating || !newAdmin.email || !newAdmin.full_name}
            >
              {creating ? "Creating Admin..." : "Create Administrator"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

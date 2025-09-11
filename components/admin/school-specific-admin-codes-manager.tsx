"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { generateAdminCode, createAdminUser } from "@/lib/admin-setup"
import { Plus, Copy, Eye, EyeOff, Shield, RefreshCw, Users, Key, Building2, Search } from "lucide-react"
import type { School } from "@/lib/types"

interface AdminUser {
  id: string
  school_id: string
  unique_id: string
  email: string
  full_name: string
  admin_code: string | null
  created_at: string
  class_number?: string | null
  school?: School
}

export function SchoolSpecificAdminCodesManager() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchool, setSelectedSchool] = useState<string>("all")
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    school_id: "",
    email: "",
    full_name: "",
    class_number: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (schoolsError) throw schoolsError

      // Fetch admins with school information
      const { data: adminsData, error: adminsError } = await supabase
        .from("users")
        .select(`
          *,
          school:schools(*)
        `)
        .eq("role", "admin")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (adminsError) throw adminsError

      setSchools(schoolsData || [])
      setAdmins(adminsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setMessage({ type: "error", text: "Failed to fetch data" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.school_id || !newAdmin.email || !newAdmin.full_name) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const result = await createAdminUser({
        school_id: newAdmin.school_id,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
        class_number: newAdmin.class_number || undefined
      })

      if (result.success) {
        setMessage({ type: "success", text: result.message || "Admin created successfully!" })
        setNewAdmin({ school_id: "", email: "", full_name: "", class_number: "" })
        setIsCreateDialogOpen(false)
        fetchData()
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

  const regenerateAdminCode = async (adminId: string) => {
    if (!confirm("Are you sure you want to regenerate the admin code? The old code will no longer work.")) {
      return
    }

    try {
      const newCode = generateAdminCode()
      
      const { error } = await supabase
        .from("users")
        .update({ admin_code: newCode })
        .eq("id", adminId)

      if (error) throw error

      // Update local state
      setAdmins(prev => prev.map(admin => 
        admin.id === adminId 
          ? { ...admin, admin_code: newCode }
          : admin
      ))

      setMessage({ type: "success", text: "Admin code regenerated successfully!" })
    } catch (error) {
      console.error("Error regenerating admin code:", error)
      setMessage({ type: "error", text: "Failed to regenerate admin code" })
    }
  }

  const toggleCodeVisibility = (adminId: string) => {
    setShowCodes((prev) => ({ ...prev, [adminId]: !prev[adminId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Copied to clipboard!" })
  }

  // Filter admins based on selected school and search term
  const filteredAdmins = admins.filter(admin => {
    const matchesSchool = selectedSchool === "all" || admin.school_id === selectedSchool
    const matchesSearch = 
      admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.class_number && admin.class_number.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSchool && matchesSearch
  })

  // Group admins by school for display
  const adminsBySchool = filteredAdmins.reduce((acc, admin) => {
    const schoolName = admin.school?.name || "Unknown School"
    if (!acc[schoolName]) {
      acc[schoolName] = []
    }
    acc[schoolName].push(admin)
    return acc
  }, {} as Record<string, AdminUser[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading admin codes...</p>
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
                <Key className="h-5 w-5" />
                <span>Admin Codes Management</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Manage administrator access codes by school. Each school operates independently with complete data isolation.
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Administrator</DialogTitle>
                  <DialogDescription>
                    Add a new administrator for a specific school. They will receive a unique access code for secure login.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-school">School *</Label>
                    <Select
                      value={newAdmin.school_id}
                      onValueChange={(value) => setNewAdmin({ ...newAdmin, school_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>{school.name}</span>
                              {school.abbreviation && (
                                <Badge variant="outline" className="text-xs">
                                  {school.abbreviation}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label htmlFor="admin-class">Department/Title</Label>
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
                    onClick={handleCreateAdmin}
                    className="w-full"
                    disabled={creating || !newAdmin.school_id || !newAdmin.email || !newAdmin.full_name}
                  >
                    {creating ? "Creating Admin..." : "Create Administrator"}
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

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search admins by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-64">
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* School-specific admin lists */}
          {Object.keys(adminsBySchool).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Administrators Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedSchool !== "all" 
                  ? "No administrators match your search criteria." 
                  : "Create your first administrator to get started."}
              </p>
              {!searchTerm && selectedSchool === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Administrator
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(adminsBySchool).map(([schoolName, schoolAdmins]) => (
                <div key={schoolName} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{schoolName}</h3>
                    <Badge variant="outline" className="text-sm">
                      {schoolAdmins.length} admin{schoolAdmins.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Administrator</TableHead>
                          <TableHead className="hidden sm:table-cell">Department</TableHead>
                          <TableHead>Admin Code</TableHead>
                          <TableHead className="hidden md:table-cell">User ID</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                          <TableHead className="min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schoolAdmins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{admin.full_name}</div>
                                <div className="text-sm text-muted-foreground">{admin.email}</div>
                                <div className="sm:hidden mt-1">
                                  {admin.class_number && (
                                    <Badge variant="outline" className="text-xs">
                                      {admin.class_number}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {admin.class_number ? (
                                <Badge variant="outline">{admin.class_number}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {showCodes[admin.id] ? admin.admin_code || "No Code" : "••••••••"}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCodeVisibility(admin.id)}
                                >
                                  {showCodes[admin.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                {admin.admin_code && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(admin.admin_code!)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="font-mono text-xs">
                                {admin.unique_id}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => regenerateAdminCode(admin.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Regenerate</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Multi-Tenant Security:</strong> Each school operates independently with complete data isolation. 
          Administrators can only access and manage data from their assigned school. Admin codes are unique across all schools.
        </AlertDescription>
      </Alert>
    </div>
  )
}



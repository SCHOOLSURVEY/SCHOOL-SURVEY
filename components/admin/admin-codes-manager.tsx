"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatabaseService } from "@/lib/database-client"
import { generateAdminCode, createAdminUser } from "@/lib/admin-setup-client"
import { Plus, Copy, Eye, EyeOff, Shield, RefreshCw, Users, Key } from "lucide-react"

interface AdminUser {
  _id: string
  unique_id: string
  email: string
  full_name: string
  admin_code: string | null
  created_at: string
  class_number?: string | null
}

export function AdminCodesManager() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    full_name: "",
    class_number: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const data = await DatabaseService.getUsersByRole(schoolId, 'admin')
      setAdmins(data || [])
    } catch (error) {
      console.error("Error fetching admins:", error)
      setMessage({ type: "error", text: "Failed to fetch admin users" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.full_name) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const result = await createAdminUser(newAdmin)

      if (result.success) {
        setMessage({ type: "success", text: result.message || "Admin created successfully!" })
        setNewAdmin({ email: "", full_name: "", class_number: "" })
        setIsCreateDialogOpen(false)
        fetchAdmins()
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
      await DatabaseService.updateUser(adminId, { admin_code: newCode })

      fetchAdmins()
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
    setTimeout(() => setMessage(null), 2000)
  }

  const renderAdminCode = (admin: AdminUser) => {
    if (!admin.admin_code) {
      return <Badge variant="destructive">No Code</Badge>
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="font-mono text-xs sm:text-sm truncate">
            {showCodes[admin._id] ? admin.admin_code : "•".repeat(admin.admin_code.length)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={() => toggleCodeVisibility(admin._id)} className="h-6 w-6 p-0">
            {showCodes[admin._id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(admin.admin_code!)} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regenerateAdminCode(admin._id)}
            className="h-6 w-6 p-0"
            title="Regenerate Code"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

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
                Manage administrator access codes and user accounts. Each admin receives a unique code for secure
                login.
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
                    Add a new school administrator. They will receive a unique access code for secure login.
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
                      <Shield className="h-4 w-4 text-yellow-600" />
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
                    disabled={creating || !newAdmin.email || !newAdmin.full_name}
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

          {admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Administrators Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first administrator account to get started with the school management system.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Admin
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Administrator</TableHead>
                    <TableHead className="hidden sm:table-cell">Department</TableHead>
                    <TableHead className="min-w-[200px]">Admin Code</TableHead>
                    <TableHead className="hidden md:table-cell">User ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{admin.full_name}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                          <div className="sm:hidden mt-1">
                            {admin.class_number ? (
                              <Badge variant="outline" className="text-xs">{admin.class_number}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">No department</span>
                            )}
                          </div>
                          <div className="md:hidden mt-1">
                            <Badge variant="secondary" className="text-xs">{admin.unique_id}</Badge>
                          </div>
                          <div className="lg:hidden mt-1 text-xs text-muted-foreground">
                            {new Date(admin.created_at).toLocaleDateString()}
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
                        <div className="min-w-0">
                          {renderAdminCode(admin)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{admin.unique_id}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Shield className="h-5 w-5" />
            <span>Security Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p>• Admin codes should be shared securely and not stored in plain text</p>
            <p>• Each administrator should have their own unique code</p>
            <p>• Codes can be regenerated if compromised</p>
            <p>• Monitor admin access and review permissions regularly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

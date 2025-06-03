"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createAdminUser, getAllAdmins } from "@/lib/admin-setup"
import { Plus, Copy, Eye, EyeOff, Shield, AlertCircle, CheckCircle2 } from "lucide-react"

interface Admin {
  id: string
  unique_id: string
  email: string
  full_name: string
  admin_code: string | null
  created_at: string
  class_number?: string | null
}

export function DeveloperSetup() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [newAdmin, setNewAdmin] = useState({
    email: "",
    full_name: "",
    class_number: "",
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    const result = await getAllAdmins()

    if (result.success) {
      setAdmins(result.admins ?? [])
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to fetch admins" })
    }
    setLoading(false)
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.full_name) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setCreating(true)
    setMessage(null)

    const result = await createAdminUser(newAdmin)

    if (result.success) {
      setMessage({ type: "success", text: result.message ?? "Admin created successfully!" })
      setNewAdmin({ email: "", full_name: "", class_number: "" })
      setIsDialogOpen(false)
      fetchAdmins()
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to create admin" })
    }

    setCreating(false)
  }

  const toggleCodeVisibility = (adminId: string) => {
    setShowCodes((prev) => ({ ...prev, [adminId]: !prev[adminId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Copied to clipboard!" })
    setTimeout(() => setMessage(null), 2000)
  }

  const renderAdminCode = (admin: Admin) => {
    if (!admin.admin_code) {
      return <Badge variant="destructive">No Code</Badge>
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="font-mono text-sm">
          {showCodes[admin.id] ? admin.admin_code : "•".repeat(admin.admin_code.length)}
        </span>
        <Button variant="ghost" size="sm" onClick={() => toggleCodeVisibility(admin.id)} className="h-6 w-6 p-0">
          {showCodes[admin.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(admin.admin_code!)} className="h-6 w-6 p-0">
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading admin setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-200 bg-yellow-50">
        <Shield className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Developer Setup Mode</AlertTitle>
        <AlertDescription className="text-yellow-700">
          This interface is for initial system setup only. Use it to create administrator accounts before deploying to
          production. Each admin will receive a unique code for secure access.
        </AlertDescription>
      </Alert>

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={message.type === "success" ? "border-green-200 bg-green-50" : ""}
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <AlertTitle className={message.type === "success" ? "text-green-800" : ""}>
            {message.type === "error" ? "Error" : "Success"}
          </AlertTitle>
          <AlertDescription className={message.type === "success" ? "text-green-700" : ""}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Administrator Management</CardTitle>
              <CardDescription>
                Create and manage school administrator accounts. Each admin receives a unique access code.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Important:</strong> The admin will use their generated code (not email) to log in. Make
                      sure to securely share the code with them after creation.
                    </AlertDescription>
                  </Alert>
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
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Administrators Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first administrator account to get started with the school management system.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Admin
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Admin Code</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.full_name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {admin.class_number ? (
                        <Badge variant="outline">{admin.class_number}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{renderAdminCode(admin)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{admin.unique_id}</Badge>
                    </TableCell>
                    <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

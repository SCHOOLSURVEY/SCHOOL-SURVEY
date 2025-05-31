"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Eye, EyeOff, Copy, Trash2 } from "lucide-react"

interface AdminCode {
  id: string
  code: string
  description: string
  is_active: boolean
  expires_at: string
  max_uses: number
  current_uses: number
  created_at: string
}

export function AdminCodesManager() {
  const [adminCodes, setAdminCodes] = useState<AdminCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [newCode, setNewCode] = useState({
    code: "",
    description: "",
    max_uses: 1,
    expires_in_days: 30,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchAdminCodes()
  }, [])

  const fetchAdminCodes = async () => {
    try {
      const { data, error } = await supabase.from("admin_codes").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setAdminCodes(data || [])
    } catch (error) {
      console.error("Error fetching admin codes:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateRandomCode = () => {
    const prefix = "ADMIN"
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${year}${random}`
  }

  const createAdminCode = async () => {
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + newCode.expires_in_days)

      const { error } = await supabase.from("admin_codes").insert([
        {
          code: newCode.code || generateRandomCode(),
          description: newCode.description,
          max_uses: newCode.max_uses,
          expires_at: expiresAt.toISOString(),
        },
      ])

      if (error) throw error

      setNewCode({ code: "", description: "", max_uses: 1, expires_in_days: 30 })
      setIsDialogOpen(false)
      fetchAdminCodes()
    } catch (error) {
      console.error("Error creating admin code:", error)
      alert("Error creating admin code")
    }
  }

  const toggleCodeVisibility = (codeId: string) => {
    setShowCodes((prev) => ({ ...prev, [codeId]: !prev[codeId] }))
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    alert("Code copied to clipboard!")
  }

  const deactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase.from("admin_codes").update({ is_active: false }).eq("id", codeId)

      if (error) throw error
      fetchAdminCodes()
    } catch (error) {
      console.error("Error deactivating code:", error)
    }
  }

  const getStatusBadge = (adminCode: AdminCode) => {
    const now = new Date()
    const expiresAt = new Date(adminCode.expires_at)
    const isExpired = expiresAt < now
    const isMaxedOut = adminCode.current_uses >= adminCode.max_uses

    if (!adminCode.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (isMaxedOut) {
      return <Badge variant="destructive">Max Uses Reached</Badge>
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    )
  }

  if (loading) {
    return <div>Loading admin codes...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Admin Access Codes</CardTitle>
              <CardDescription>Manage codes that allow users to sign up as administrators</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin Code</DialogTitle>
                  <DialogDescription>Generate a new code for administrator access</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code (leave empty to auto-generate)</Label>
                    <Input
                      id="code"
                      value={newCode.code}
                      onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., PRINCIPAL2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCode.description}
                      onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                      placeholder="Purpose of this admin code"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_uses">Max Uses</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        min="1"
                        value={newCode.max_uses}
                        onChange={(e) => setNewCode({ ...newCode, max_uses: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires_in_days">Expires in (days)</Label>
                      <Input
                        id="expires_in_days"
                        type="number"
                        min="1"
                        value={newCode.expires_in_days}
                        onChange={(e) => setNewCode({ ...newCode, expires_in_days: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={createAdminCode} className="w-full">
                    Create Admin Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminCodes.map((adminCode) => (
                <TableRow key={adminCode.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {showCodes[adminCode.id] ? adminCode.code : "•".repeat(adminCode.code.length)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCodeVisibility(adminCode.id)}
                        className="h-6 w-6 p-0"
                      >
                        {showCodes[adminCode.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adminCode.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{adminCode.description}</TableCell>
                  <TableCell>{getStatusBadge(adminCode)}</TableCell>
                  <TableCell>
                    {adminCode.current_uses} / {adminCode.max_uses}
                  </TableCell>
                  <TableCell>{new Date(adminCode.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {adminCode.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivateCode(adminCode.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
          <CardDescription>Current active admin codes for sharing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {adminCodes
              .filter((code) => {
                const now = new Date()
                const expiresAt = new Date(code.expires_at)
                return code.is_active && expiresAt > now && code.current_uses < code.max_uses
              })
              .map((code) => (
                <div key={code.id} className="p-4 border rounded-lg">
                  <div className="font-mono text-lg font-bold text-center mb-2">{code.code}</div>
                  <div className="text-sm text-muted-foreground text-center">{code.description}</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {code.max_uses - code.current_uses} uses remaining
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

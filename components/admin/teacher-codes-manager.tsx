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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { generateTeacherCode } from "@/lib/admin-setup"
import { Users, Key, Eye, EyeOff, Copy, RefreshCw, Search, Plus, AlertCircle } from "lucide-react"
import type { User, School } from "@/lib/types"
import { toast } from "sonner"

interface TeacherWithCode extends User {
  teacher_code: string | null
  school?: School
}

export function TeacherCodesManager() {
  const [teachers, setTeachers] = useState<TeacherWithCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [newTeacher, setNewTeacher] = useState({
    email: "",
    full_name: "",
    class_number: "",
    department: ""
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const { data: teachersData, error } = await supabase
        .from("users")
        .select(`
          *,
          school:schools(*)
        `)
        .eq("role", "teacher")
        .eq("is_active", true)
        .eq("school_id", schoolId) // Filter by current school
        .order("created_at", { ascending: false })

      if (error) throw error

      setTeachers(teachersData || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
      setMessage({ type: "error", text: "Failed to fetch teachers" })
    } finally {
      setLoading(false)
    }
  }

  const generateNewTeacherCode = async (teacherId: string) => {
    try {
      const newCode = generateTeacherCode()
      
      const { error } = await supabase
        .from("users")
        .update({ teacher_code: newCode })
        .eq("id", teacherId)

      if (error) throw error

      // Update local state
      setTeachers(prev => prev.map(teacher => 
        teacher.id === teacherId 
          ? { ...teacher, teacher_code: newCode }
          : teacher
      ))

      setMessage({ type: "success", text: "New teacher code generated successfully!" })
      toast.success("New teacher code generated!")
    } catch (error) {
      console.error("Error generating new code:", error)
      setMessage({ type: "error", text: "Failed to generate new code" })
      toast.error("Failed to generate new code")
    }
  }

  const createNewTeacher = async () => {
    if (!newTeacher.email || !newTeacher.full_name) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Generate teacher code
      const teacherCode = generateTeacherCode()
      
      // Generate unique ID
      const uniqueId = `T${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`

      // Create teacher user
      const { data: newTeacherData, error } = await supabase
        .from("users")
        .insert({
          school_id: schoolId,
          unique_id: uniqueId,
          email: newTeacher.email,
          full_name: newTeacher.full_name,
          role: "teacher",
          class_number: newTeacher.class_number || null,
          teacher_code: teacherCode,
          email_verified: true,
          is_active: true
        })
        .select(`
          *,
          school:schools(*)
        `)
        .single()

      if (error) throw error

      setMessage({ type: "success", text: "Teacher created successfully!" })
      setNewTeacher({ email: "", full_name: "", class_number: "", department: "" })
      setIsCreateDialogOpen(false)
      fetchTeachers()
      toast.success("Teacher created successfully!")
    } catch (error) {
      console.error("Error creating teacher:", error)
      setMessage({ type: "error", text: "Failed to create teacher" })
      toast.error("Failed to create teacher")
    } finally {
      setCreating(false)
    }
  }

  const toggleCodeVisibility = (teacherId: string) => {
    setShowCodes((prev) => ({ ...prev, [teacherId]: !prev[teacherId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.class_number && teacher.class_number.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading teachers...</p>
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
                <Users className="h-5 w-5" />
                <span>Teacher Codes Management</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Manage teacher accounts and their login codes. Teachers use these codes to access the system.
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Teacher</DialogTitle>
                  <DialogDescription>
                    Add a new teacher to your school. A unique login code will be generated automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher-name">Full Name *</Label>
                    <Input
                      id="teacher-name"
                      value={newTeacher.full_name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-email">Email Address *</Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      placeholder="e.g., john.smith@school.edu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-class">Department/Class</Label>
                    <Input
                      id="teacher-class"
                      value={newTeacher.class_number}
                      onChange={(e) => setNewTeacher({ ...newTeacher, class_number: e.target.value })}
                      placeholder="e.g., Mathematics, Science"
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Important</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      The teacher will use their generated code (not email) to log in. Make sure to securely share
                      the code with them after creation.
                    </p>
                  </div>
                  <Button
                    onClick={createNewTeacher}
                    className="w-full"
                    disabled={creating || !newTeacher.email || !newTeacher.full_name}
                  >
                    {creating ? "Creating Teacher..." : "Create Teacher"}
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

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teachers by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Teachers Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No teachers match your search criteria." : "Create your first teacher to get started."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Teacher
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="hidden sm:table-cell">Department</TableHead>
                    <TableHead className="hidden md:table-cell">School</TableHead>
                    <TableHead>Teacher Code</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{teacher.full_name}</div>
                          <div className="text-sm text-muted-foreground">{teacher.email}</div>
                          <div className="sm:hidden mt-1">
                            {teacher.class_number && (
                              <Badge variant="outline" className="text-xs">
                                {teacher.class_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {teacher.class_number ? (
                          <Badge variant="outline">{teacher.class_number}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {teacher.school?.name || "Unknown School"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {showCodes[teacher.id] ? teacher.teacher_code || "No Code" : "••••••••"}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCodeVisibility(teacher.id)}
                          >
                            {showCodes[teacher.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {teacher.teacher_code && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(teacher.teacher_code!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateNewTeacherCode(teacher.id)}
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
          )}
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Teacher Code Management:</strong> Teachers use their unique codes to log in to the system. 
          If a teacher loses their code, you can regenerate a new one using the "Regenerate" button. 
          Always share codes securely with teachers.
        </AlertDescription>
      </Alert>
    </div>
  )
}
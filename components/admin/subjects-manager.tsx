"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { DatabaseService } from "@/lib/database-client"
import { Plus, Edit, Trash2, BookOpen, Save, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Subject {
  _id: string
  name: string
  code: string
  description?: string
  created_at: string
}

export function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    description: "",
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const data = await DatabaseService.getSubjectsBySchool(schoolId)
      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSubject = async () => {
    if (!newSubject.name || !newSubject.code) {
      alert("Please fill in both name and code")
      return
    }

    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      // Check if code already exists within the same school
      const existingSubject = subjects.find((s) => s.code.toLowerCase() === newSubject.code.toLowerCase())
      if (existingSubject) {
        alert("A subject with this code already exists")
        return
      }

      await DatabaseService.createSubject({
        school_id: schoolId,
        name: newSubject.name,
        code: newSubject.code.toUpperCase(),
        description: newSubject.description || null,
      })

      setNewSubject({ name: "", code: "", description: "" })
      setIsCreateDialogOpen(false)
      fetchSubjects()
      alert("Subject created successfully!")
    } catch (error) {
      console.error("Error creating subject:", error)
      alert(`Error creating subject: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const startEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setNewSubject({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
    })
  }

  const saveEdit = async () => {
    if (!editingSubject || !newSubject.name || !newSubject.code) {
      alert("Please fill in both name and code")
      return
    }

    try {
      // Check if code already exists (excluding current subject)
      const existingSubject = subjects.find(
        (s) => s.id !== editingSubject.id && s.code.toLowerCase() === newSubject.code.toLowerCase()
      )
      if (existingSubject) {
        alert("A subject with this code already exists")
        return
      }

      await DatabaseService.updateSubject(editingSubject.id, {
        name: newSubject.name,
        code: newSubject.code.toUpperCase(),
        description: newSubject.description || null,
      })

      setEditingSubject(null)
      setNewSubject({ name: "", code: "", description: "" })
      fetchSubjects()
      alert("Subject updated successfully!")
    } catch (error) {
      console.error("Error updating subject:", error)
      alert(`Error updating subject: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const cancelEdit = () => {
    setEditingSubject(null)
    setNewSubject({ name: "", code: "", description: "" })
  }

  const deleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will also remove all related courses.")) {
      return
    }

    try {
      await DatabaseService.deleteSubject(subjectId)
      fetchSubjects()
      alert("Subject deleted successfully!")
    } catch (error) {
      console.error("Error deleting subject:", error)
      alert(`Error deleting subject: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return <div>Loading subjects...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Subjects Management</span>
              </CardTitle>
              <CardDescription>Create and manage school subjects</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subject</DialogTitle>
                  <DialogDescription>Add a new subject to the curriculum</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject-name">Subject Name *</Label>
                    <Input
                      id="subject-name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      placeholder="e.g., Mathematics, Science, English"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject-code">Subject Code *</Label>
                    <Input
                      id="subject-code"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      placeholder="e.g., MATH, SCI, ENG"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject-description">Description (Optional)</Label>
                    <Textarea
                      id="subject-description"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                      placeholder="Brief description of the subject"
                      rows={3}
                    />
                  </div>
                  <Button onClick={createSubject} className="w-full" disabled={!newSubject.name || !newSubject.code}>
                    Create Subject
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No subjects created yet.</p>
              <p className="text-sm">Create your first subject to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject._id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {subject.description ? (
                        <span className="text-sm text-muted-foreground">{subject.description}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(subject.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {editingSubject?._id === subject._id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(subject)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSubject(subject._id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSubject && (
        <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>Update subject information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject-name">Subject Name *</Label>
                <Input
                  id="edit-subject-name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g., Mathematics, Science, English"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject-code">Subject Code *</Label>
                <Input
                  id="edit-subject-code"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="e.g., MATH, SCI, ENG"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject-description">Description (Optional)</Label>
                <Textarea
                  id="edit-subject-description"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Brief description of the subject"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={saveEdit} className="flex-1" disabled={!newSubject.name || !newSubject.code}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={cancelEdit} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

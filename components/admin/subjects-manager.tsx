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
import { supabase } from "@/lib/supabase"
import { Plus, Trash2 } from "lucide-react"

interface Subject {
  id: string
  name: string
  code: string
  description: string
  created_at: string
}

export function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    description: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase.from("subjects").select("*").order("name")

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSubject = async () => {
    try {
      const { error } = await supabase.from("subjects").insert([
        {
          name: newSubject.name,
          code: newSubject.code.toUpperCase(),
          description: newSubject.description,
        },
      ])

      if (error) throw error

      setNewSubject({ name: "", code: "", description: "" })
      setIsDialogOpen(false)
      fetchSubjects()
    } catch (error) {
      console.error("Error creating subject:", error)
      alert("Error creating subject")
    }
  }

  const deleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will also delete all associated courses.")) {
      return
    }

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", subjectId)

      if (error) throw error
      fetchSubjects()
    } catch (error) {
      console.error("Error deleting subject:", error)
      alert("Error deleting subject")
    }
  }

  if (loading) {
    return <div>Loading subjects...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Subjects Management</CardTitle>
            <CardDescription>Create and manage school subjects</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>Add a new subject to the school curriculum</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject-name">Subject Name</Label>
                  <Input
                    id="subject-name"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject-code">Subject Code</Label>
                  <Input
                    id="subject-code"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MATH"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject-description">Description</Label>
                  <Textarea
                    id="subject-description"
                    value={newSubject.description}
                    onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                    placeholder="Brief description of the subject"
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
              <TableRow key={subject.id}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell className="font-mono">{subject.code}</TableCell>
                <TableCell>{subject.description}</TableCell>
                <TableCell>{new Date(subject.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSubject(subject.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {subjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No subjects created yet. Click "Add Subject" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

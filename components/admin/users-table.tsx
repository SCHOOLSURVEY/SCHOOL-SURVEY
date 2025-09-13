"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Search, Filter, Eye, Edit, Trash2, Users, Mail, Phone, Calendar } from "lucide-react"

interface User {
  _id: string
  unique_id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "student" | "parent"
  class_number?: string
  created_at: string
  admin_code?: string
  parent_email?: string
  parent_phone?: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      // Get current user's school_id
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id

      const data = await DatabaseService.getAllUsers(schoolId)
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.unique_id.toLowerCase().includes(term) ||
          (user.class_number && user.class_number.toLowerCase().includes(term))
      )
    }

    setFilteredUsers(filtered)
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      await DatabaseService.deleteUser(userId)
      fetchUsers()
      alert("User deleted successfully!")
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error deleting user")
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      case "teacher":
        return <Badge className="bg-blue-100 text-blue-800">Teacher</Badge>
      case "student":
        return <Badge className="bg-green-100 text-green-800">Student</Badge>
      case "parent":
        return <Badge className="bg-orange-100 text-orange-800">Parent</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const viewUserDetails = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const getTotalByRole = (role: string) => {
    return users.filter((user) => user.role === role).length
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Students</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{getTotalByRole("student")}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Teachers</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{getTotalByRole("teacher")}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Faculty members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Admins</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{getTotalByRole("admin")}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">System administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="role-filter" className="text-sm">Role:</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found matching your criteria.</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Class/Department</TableHead>
                    <TableHead className="hidden xl:table-cell">Created</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{user.unique_id}</div>
                          <div className="sm:hidden mt-1">
                            {getRoleBadge(user.role)}
                          </div>
                          <div className="md:hidden mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs truncate">{user.email}</span>
                            </div>
                          </div>
                          <div className="lg:hidden mt-1">
                            {user.class_number ? (
                              <Badge variant="outline" className="text-xs">{user.class_number}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                          <div className="xl:hidden mt-1 text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                          {user.parent_email && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">Parent: {user.parent_email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.class_number ? (
                          <Badge variant="outline">{user.class_number}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewUserDetails(user)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit User"
                            disabled
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete information about this user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm">{selectedUser.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm font-mono">{selectedUser.unique_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                {selectedUser.class_number && (
                  <div>
                    <Label className="text-sm font-medium">Class/Department</Label>
                    <p className="text-sm">{selectedUser.class_number}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedUser.role === "admin" && selectedUser.admin_code && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Admin Code</Label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">{selectedUser.admin_code}</p>
                </div>
              )}

              {selectedUser.role === "student" && (selectedUser.parent_email || selectedUser.parent_phone) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Parent Contact</Label>
                  <div className="space-y-2 mt-2">
                    {selectedUser.parent_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{selectedUser.parent_email}</span>
                      </div>
                    )}
                    {selectedUser.parent_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{selectedUser.parent_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

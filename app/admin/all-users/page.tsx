"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Search, RefreshCw, User, Phone, Mail, Calendar, UserPlus, X, Trash2, AlertTriangle } from "lucide-react"

interface User {
  _id: string
  email: string
  fname: string
  lname: string
  contact: string
  role: "admin" | "employee"
  createdAt: string
  updatedAt: string
}

interface UsersResponse {
  success: string
  data: User[]
  message?: string
}

interface DeleteResponse {
  success: string
  message: string
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users when search term changes (exclude admins)
  useEffect(() => {
    // Only show employees (filter out admins)
    let filtered = users.filter((user) => user.role === "employee")

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.contact.includes(searchTerm)
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const response = await fetch("/api/user/getall", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data: UsersResponse = await response.json()

      if (response.ok && data.success === "true") {
        setUsers(data.data || [])
      } else {
        setError(data.message || "Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteError(null)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setDeleteError("No authentication token found")
        return
      }

      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userToDelete.email,
        }),
      })

      const data: DeleteResponse = await response.json()

      if (response.ok && data.success === "true") {
        // Remove the deleted user from the local state
        setUsers(users.filter((user) => user._id !== userToDelete._id))
        setShowDeleteDialog(false)
        setUserToDelete(null)
        
        // Show success message (you can add a toast notification here)
        console.log("User deleted successfully:", data.message)
      } else {
        setDeleteError(data.message || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      setDeleteError("Failed to delete user. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setUserToDelete(null)
    setDeleteError(null)
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <User className="h-3 w-3 mr-1" />
        Employee
      </Badge>
    )
  }

  const employeeUsers = users.filter((user) => user.role === "employee")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="px-3 py-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700 truncate">All Users</h1>
              <p className="text-sm md:text-base text-slate-600 truncate">
                Manage all employee users and their information
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchUsers}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden md:inline ml-2">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-6">
            <Card className="bg-white/90 border-blue-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <Users className="h-4 w-4 md:h-8 md:w-8 text-blue-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-blue-600">Total Employees</p>
                    <p className="text-sm md:text-2xl font-bold text-blue-800">{employeeUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-green-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <User className="h-4 w-4 md:h-8 md:w-8 text-green-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-green-600">Active Users</p>
                    <p className="text-sm md:text-2xl font-bold text-green-800">{employeeUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-slate-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <Search className="h-4 w-4 md:h-8 md:w-8 text-slate-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-slate-600">Search Results</p>
                    <p className="text-sm md:text-2xl font-bold text-slate-800">{filteredUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="bg-white/90 border-blue-100 shadow-sm">
            <CardHeader>
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users ({filteredUsers.length})
                </CardTitle>
                
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-400 w-64"
                    />
                  </div>
                  {searchTerm && (
                    <Button
                      onClick={clearSearch}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Search Display */}
              {searchTerm && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-slate-600">Searching for:</span>
                  <Badge variant="outline" className="gap-1">
                    🔍 "{searchTerm}"
                    <button
                      onClick={clearSearch}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="w-full overflow-x-auto">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">
                      <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Error Loading Users</h3>
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchUsers} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No Users Found</h3>
                    <p className="text-sm text-slate-600">
                      {searchTerm ? "No employees match your search criteria." : "No employee users have been created yet."}
                    </p>
                    {searchTerm && (
                      <Button onClick={clearSearch} variant="outline" size="sm" className="mt-3">
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Employee</TableHead>
                        <TableHead className="min-w-[150px]">Contact</TableHead>
                        <TableHead className="min-w-[100px]">Role</TableHead>
                        <TableHead className="min-w-[120px]">Joined</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user._id} className="hover:bg-blue-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                                  {user.fname.charAt(0).toUpperCase()}
                                  {user.lname.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {user.fname} {user.lname}
                                </p>
                                <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="h-3 w-3" />
                              {user.contact || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(user.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleDeleteClick(user)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                    {userToDelete.fname.charAt(0).toUpperCase()}
                    {userToDelete.lname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {userToDelete.fname} {userToDelete.lname}
                    </p>
                    <p className="text-sm text-slate-600">{userToDelete.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={handleDeleteCancel}
              variant="outline"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="destructive"
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  _id: string
  email: string
  fname: string
  lname: string
  contact: string
  role: string
  createdAt: string
  updatedAt: string
}

interface EmployeeTableProps {
  onRefresh?: () => void
}

export function EmployeeTable({ onRefresh }: EmployeeTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      // Fixed: Changed from /api/users/getall to /api/user/getall
      const response = await fetch("/api/user/getall", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success === "true" && data.data) {
        setUsers(data.data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRefresh = () => {
    fetchUsers()
    onRefresh?.()
  }

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            Admin
          </Badge>
        )
      case "employee":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Employee
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getFullName = (fname: string, lname: string) => {
    return `${fname} ${lname}`.trim()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <p className="text-sm text-slate-600">Loading employee data...</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <p className="text-sm text-red-600">Error: {error}</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">Failed to load employee data</p>
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-blue-700">Employee Management</CardTitle>
            <p className="text-sm text-slate-600">Manage and monitor all employees</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/admin/create-user")}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-blue-100">
                <TableHead className="text-blue-700 font-semibold">Employee ID</TableHead>
                <TableHead className="text-blue-700 font-semibold">Full Name</TableHead>
                <TableHead className="text-blue-700 font-semibold">Email</TableHead>
                <TableHead className="text-blue-700 font-semibold">Contact</TableHead>
                <TableHead className="text-blue-700 font-semibold">Role</TableHead>
                <TableHead className="text-blue-700 font-semibold">Join Date</TableHead>
                <TableHead className="text-blue-700 font-semibold">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} className="hover:bg-blue-50/50 border-blue-50">
                  <TableCell className="font-medium text-slate-800">{user._id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell className="font-medium text-slate-800">{getFullName(user.fname, user.lname)}</TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell className="text-slate-600">{user.contact}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-slate-600">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-slate-600">{formatDate(user.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">No employees found</p>
            <Button
              onClick={() => router.push("/admin/create-user")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Add First Employee
            </Button>
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500 border-t border-blue-100 pt-4">
          Total Employees: {users.length} | Admins: {users.filter((u) => u.role.toLowerCase() === "admin").length} |
          Employees: {users.filter((u) => u.role.toLowerCase() === "employee").length}
        </div>
      </CardContent>
    </Card>
  )
}

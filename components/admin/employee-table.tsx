"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { RefreshCw, UserPlus, Calendar } from "lucide-react"
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

interface AttendanceRecord {
  email: string
  fname: string
  lname: string
  contact: string
  date: string
  clockInTime?: string
  clockInLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  clockOutTime?: string
  clockOutLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  totalHours?: string
  status: "clocked-in" | "clocked-out" | "absent"
  notes?: string
}

interface EmployeeTableProps {
  onRefresh?: () => void
  onAttendanceUpdate?: (totalEmployees: number, activeToday: number) => void
}

export function EmployeeTable({ onRefresh, onAttendanceUpdate }: EmployeeTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  )
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

  const fetchAttendanceData = async (date: string) => {
    try {
      setAttendanceLoading(true)

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No authentication token found")
        return
      }

      // Using the internal API route
      const response = await fetch(`/api/attendance/${date}`, {
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
        setAttendanceData(data.data)
      } else {
        setAttendanceData([])
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      setAttendanceData([])
    } finally {
      setAttendanceLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceData(selectedDate)
    }
  }, [selectedDate])

  // Update parent component with attendance stats
  useEffect(() => {
    if (users.length > 0 && onAttendanceUpdate) {
      const today = new Date().toISOString().split("T")[0]
      if (selectedDate === today) {
        const activeToday = attendanceData.filter(
          (record) => record.status === "clocked-in" || record.status === "clocked-out",
        ).length
        onAttendanceUpdate(users.length, activeToday)
      }
    }
  }, [users, attendanceData, selectedDate, onAttendanceUpdate])

  const handleRefresh = () => {
    fetchUsers()
    if (selectedDate) {
      fetchAttendanceData(selectedDate)
    }
    onRefresh?.()
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value)
  }

  const getAttendanceStatus = (userEmail: string) => {
    const attendance = attendanceData.find((record) => record.email === userEmail)
    return attendance?.status || "no-data"
  }

  const getAttendanceDetails = (userEmail: string) => {
    return attendanceData.find((record) => record.email === userEmail)
  }

  const getAttendanceBadge = (status: string, attendance?: AttendanceRecord) => {
    switch (status) {
      case "clocked-in":
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Clocked In
            </Badge>
            {attendance?.clockInTime && (
              <span className="text-xs text-slate-500">
                {new Date(attendance.clockInTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        )
      case "clocked-out":
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Completed
            </Badge>
            {attendance?.totalHours && <span className="text-xs text-slate-500">{attendance.totalHours}</span>}
          </div>
        )
      case "absent":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            Absent
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            No Data
          </Badge>
        )
    }
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

  const formatSelectedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance</CardTitle>
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
          <CardTitle>Employee Attendance</CardTitle>
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
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-blue-700">Employee Attendance</CardTitle>
            <p className="text-sm text-slate-600">View attendance for all employees</p>

            {/* Date Picker Section */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <label htmlFor="attendance-date" className="text-sm font-medium text-slate-700">
                  Select Date:
                </label>
              </div>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-auto border-blue-200 focus:border-blue-400"
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
              />
              <div className="text-sm text-slate-600">
                Showing attendance for <span className="font-medium">{formatSelectedDate(selectedDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              disabled={attendanceLoading}
            >
              <RefreshCw className={`h-4 w-4 ${attendanceLoading ? "animate-spin" : ""}`} />
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
                <TableHead className="text-blue-700 font-semibold">Attendance Status</TableHead>
                <TableHead className="text-blue-700 font-semibold">Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const attendanceStatus = getAttendanceStatus(user.email)
                const attendanceDetails = getAttendanceDetails(user.email)

                return (
                  <TableRow key={user._id} className="hover:bg-blue-50/50 border-blue-50">
                    <TableCell className="font-medium text-slate-800">{user._id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-slate-800">{getFullName(user.fname, user.lname)}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell className="text-slate-600">{user.contact}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {attendanceLoading ? (
                          <Skeleton className="h-6 w-20" />
                        ) : (
                          getAttendanceBadge(attendanceStatus, attendanceDetails)
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                )
              })}
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
          <div className="flex flex-wrap gap-4">
            <span>Total Employees: {users.length}</span>
            <span>Admins: {users.filter((u) => u.role.toLowerCase() === "admin").length}</span>
            <span>Employees: {users.filter((u) => u.role.toLowerCase() === "employee").length}</span>
            {attendanceData.length > 0 && (
              <>
                <span className="text-green-600">
                  Present:{" "}
                  {attendanceData.filter((a) => a.status === "clocked-out" || a.status === "clocked-in").length}
                </span>
                <span className="text-red-600">
                  Absent: {attendanceData.filter((a) => a.status === "absent").length}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
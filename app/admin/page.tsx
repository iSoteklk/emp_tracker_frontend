"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LocationDisplay } from "@/components/location-display"
import { AuthGuard } from "@/components/auth-guard"
import { LogOut, Users, Clock, Calendar, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function AdminDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Redirect non-admin users
      if (parsedUser.role !== "admin") {
        router.push("/dashboard")
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("contact")
    localStorage.removeItem("userLocation")
    localStorage.removeItem("locationSkipped")
    router.push("/login")
  }

  // Sample employee data - in a real app, this would come from an API
  const employeeData = [
    {
      id: "EMP001",
      name: "John Doe",
      email: "john@example.com",
      department: "Engineering",
      status: "Active",
      todayHours: "7h 45m",
      weeklyHours: "38h 30m",
      lastClockIn: "09:15 AM",
      isLate: false,
      location: "New York, NY",
    },
    {
      id: "EMP002",
      name: "Jane Smith",
      email: "jane@example.com",
      department: "Design",
      status: "Active",
      todayHours: "8h 15m",
      weeklyHours: "40h 15m",
      lastClockIn: "08:45 AM",
      isLate: false,
      location: "San Francisco, CA",
    },
    {
      id: "EMP003",
      name: "Mike Johnson",
      email: "mike@example.com",
      department: "Marketing",
      status: "Active",
      todayHours: "6h 30m",
      weeklyHours: "32h 15m",
      lastClockIn: "09:45 AM",
      isLate: true,
      location: "Chicago, IL",
    },
    {
      id: "EMP004",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      department: "HR",
      status: "Active",
      todayHours: "8h 00m",
      weeklyHours: "40h 00m",
      lastClockIn: "08:30 AM",
      isLate: false,
      location: "Austin, TX",
    },
    {
      id: "EMP005",
      name: "David Brown",
      email: "david@example.com",
      department: "Engineering",
      status: "Inactive",
      todayHours: "0h 00m",
      weeklyHours: "35h 45m",
      lastClockIn: "-",
      isLate: false,
      location: "Seattle, WA",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Active
          </Badge>
        )
      case "Inactive":
        return <Badge variant="outline">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLateBadge = (isLate: boolean) => {
    if (isLate) {
      return <Badge variant="destructive">Late</Badge>
    }
    return null
  }

  // Calculate summary stats
  const totalEmployees = employeeData.length
  const activeEmployees = employeeData.filter((emp) => emp.status === "Active").length
  const lateEmployees = employeeData.filter((emp) => emp.isLate).length
  const totalHoursToday = employeeData.reduce((total, emp) => {
    const hours = Number.parseFloat(emp.todayHours.split("h")[0])
    const minutes = Number.parseFloat(emp.todayHours.split("h ")[1]?.split("m")[0] || "0")
    return total + hours + minutes / 60
  }, 0)

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Admin Location Display */}
        <div className="mb-6">
          <LocationDisplay showRefresh={true} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{activeEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Late Today</p>
                  <p className="text-2xl font-bold">{lateEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Hours Today</p>
                  <p className="text-2xl font-bold">
                    {Math.floor(totalHoursToday)}h {Math.round((totalHoursToday % 1) * 60)}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Time Tracking</CardTitle>
            <p className="text-sm text-muted-foreground">Monitor employee attendance and working hours</p>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Today Hours</TableHead>
                    <TableHead>Weekly Hours</TableHead>
                    <TableHead>Last Clock In</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Late Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeData.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{employee.id}</TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="font-medium">{employee.todayHours}</TableCell>
                      <TableCell className="font-medium">{employee.weeklyHours}</TableCell>
                      <TableCell>{employee.lastClockIn}</TableCell>
                      <TableCell className="text-sm">{employee.location}</TableCell>
                      <TableCell>{getLateBadge(employee.isLate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {employeeData.map((employee) => (
                <div key={employee.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-lg">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.id} • {employee.department}
                      </div>
                      <div className="text-sm text-muted-foreground">{employee.email}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(employee.status)}
                      {getLateBadge(employee.isLate)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Today Hours</div>
                      <div className="font-semibold text-blue-600">{employee.todayHours}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Weekly Hours</div>
                      <div className="font-medium">{employee.weeklyHours}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Clock In</div>
                      <div className="font-medium">{employee.lastClockIn}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Location</div>
                      <div className="font-medium text-xs">{employee.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </AuthGuard>
  )
}

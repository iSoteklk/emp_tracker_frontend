"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { EmployeeTable } from "@/components/admin/employee-table"
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar"
import { LogOut, Users, Clock, Calendar, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

function AdminDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    lateEmployees: 0,
    totalHoursToday: 0,
  })
  const [loading, setLoading] = useState(true)

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

    // Fetch initial data
    fetchDashboardStats()

    // Dispatch auth change event to ensure sidebar updates
    window.dispatchEvent(new Event("auth-change"))
  }, [router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("No authentication token found")
        return
      }

      // Fetch total employees
      const employeesResponse = await fetch("/api/user/getall", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      let totalEmployees = 0
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json()
        if (employeesData.success === "true" && employeesData.data) {
          totalEmployees = employeesData.data.length
        }
      }

      // Fetch today's attendance
      const today = format(new Date(), "yyyy-MM-dd")
      const attendanceResponse = await fetch(`/api/attendance/${today}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      let activeToday = 0
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        if (attendanceData.success === "true" && attendanceData.data) {
          activeToday = attendanceData.data.filter(
            (record: any) => record.status === "clocked-in" || record.status === "clocked-out",
          ).length
        }
      }

      setSummaryStats((prev) => ({
        ...prev,
        totalEmployees,
        activeEmployees: activeToday,
      }))
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("contact")
    localStorage.removeItem("userLocation")
    localStorage.removeItem("locationSkipped")

    // Dispatch custom event to notify sidebar
    window.dispatchEvent(new Event("auth-change"))

    router.push("/login")
  }

  const handleAttendanceUpdate = (totalEmployees: number, activeToday: number) => {
    setSummaryStats((prev) => ({
      ...prev,
      totalEmployees,
      activeEmployees: activeToday,
    }))
  }

  const handleRefreshStats = () => {
    fetchDashboardStats()
    console.log("Refreshing admin stats...")
  }

  // Sample employee schedule data for calendar
  const employeeScheduleData = [
    {
      day: new Date("2024-12-30"),
      events: [
        {
          id: 1,
          name: "John Doe - Clock In",
          time: "09:15 AM",
          datetime: "2024-12-30T09:15:00",
        },
        {
          id: 2,
          name: "Jane Smith - Clock In",
          time: "08:45 AM",
          datetime: "2024-12-30T08:45:00",
        },
      ],
    },
    {
      day: new Date("2024-12-31"),
      events: [
        {
          id: 3,
          name: "Team Meeting",
          time: "10:00 AM",
          datetime: "2024-12-31T10:00:00",
        },
        {
          id: 4,
          name: "Mike Johnson - Late",
          time: "09:45 AM",
          datetime: "2024-12-31T09:45:00",
        },
      ],
    },
    {
      day: new Date("2025-01-02"),
      events: [
        {
          id: 5,
          name: "Sarah Wilson - Clock In",
          time: "08:30 AM",
          datetime: "2025-01-02T08:30:00",
        },
        {
          id: 6,
          name: "David Brown - Absent",
          time: "All Day",
          datetime: "2025-01-02T00:00:00",
        },
      ],
    },
    {
      day: new Date("2025-01-03"),
      events: [
        {
          id: 7,
          name: "Monthly Review",
          time: "2:00 PM",
          datetime: "2025-01-03T14:00:00",
        },
        {
          id: 8,
          name: "Training Session",
          time: "11:00 AM",
          datetime: "2025-01-03T11:00:00",
        },
      ],
    },
  ]

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-600">Welcome back, {user.name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/80 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Employees</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {loading ? (
                      <div className="animate-pulse bg-slate-200 h-8 w-12 rounded"></div>
                    ) : (
                      summaryStats.totalEmployees
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Active Today</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {loading ? (
                      <div className="animate-pulse bg-slate-200 h-8 w-12 rounded"></div>
                    ) : (
                      summaryStats.activeEmployees
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Late Today</p>
                  <p className="text-2xl font-bold text-slate-800">{summaryStats.lateEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Hours Today</p>
                  <p className="text-2xl font-bold text-slate-800">{summaryStats.totalHoursToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Table Component */}
        <div className="mb-6">
          <EmployeeTable onRefresh={handleRefreshStats} onAttendanceUpdate={handleAttendanceUpdate} />
        </div>

        {/* Employee Schedule Calendar */}
        <Card className="bg-white/80 border-blue-100">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-blue-700">Employee Schedule Calendar</h3>
              <p className="text-sm text-slate-600">Click on any date to view employee attendance details</p>
            </div>
            <div className="h-[600px]">
              <FullScreenCalendar
                data={employeeScheduleData}
                onDateClick={(date) => {
                  console.log("Date clicked:", date)
                }}
              />
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
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { EmployeeTable } from "@/components/admin/employee-table"
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar"
import { LogOut, Users, Clock, Calendar, BarChart3, Plane } from "lucide-react"
import { useRouter } from "next/navigation"

function AdminDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    leaveEmployees: 0,
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

      // Fetch today's leave data
      const leaveResponse = await fetch("/api/leave/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      let leaveToday = 0
      if (leaveResponse.ok) {
        const leaveData = await leaveResponse.json()
        if (leaveData.success === "true" && leaveData.data) {
          const todayDate = new Date(today)
          leaveToday = leaveData.data.filter((leave: any) => {
            const startDate = new Date(leave.startDate)
            const endDate = new Date(leave.endDate)
            return todayDate >= startDate && todayDate <= endDate
          }).length
        }
      }

      setSummaryStats((prev) => ({
        ...prev,
        totalEmployees,
        activeEmployees: activeToday,
        leaveEmployees: leaveToday,
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

  const handleAttendanceUpdate = (totalEmployees: number, activeToday: number, leaveToday: number) => {
    setSummaryStats((prev) => ({
      ...prev,
      totalEmployees,
      activeEmployees: activeToday,
      leaveEmployees: leaveToday,
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
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="px-3 py-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-blue-700 truncate">Admin Dashboard</h1>
                  <p className="text-sm md:text-base text-slate-600 truncate">Welcome back, {user.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full md:w-auto border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards - Optimized for mobile */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-6 mb-4 md:mb-6">
            <Card className="bg-white/90 border-blue-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <Users className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-blue-600">Total</p>
                    <p className="text-base md:text-2xl font-bold text-blue-800">
                      {loading ? (
                        <div className="animate-pulse bg-slate-200 h-6 w-8 rounded"></div>
                      ) : (
                        summaryStats.totalEmployees
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-green-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <Clock className="h-5 w-5 md:h-8 md:w-8 text-green-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-green-600">Active</p>
                    <p className="text-base md:text-2xl font-bold text-green-800">
                      {loading ? (
                        <div className="animate-pulse bg-slate-200 h-6 w-8 rounded"></div>
                      ) : (
                        summaryStats.activeEmployees
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-yellow-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <Plane className="h-5 w-5 md:h-8 md:w-8 text-yellow-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-yellow-600">On Leave</p>
                    <p className="text-base md:text-2xl font-bold text-yellow-800">
                      {loading ? (
                        <div className="animate-pulse bg-slate-200 h-6 w-8 rounded"></div>
                      ) : (
                        summaryStats.leaveEmployees
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border-red-100 shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-1 md:flex-row md:space-y-0 md:space-x-3">
                  <Calendar className="h-5 w-5 md:h-8 md:w-8 text-red-600" />
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm font-medium text-red-600">Late</p>
                    <p className="text-base md:text-2xl font-bold text-red-800">{summaryStats.lateEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </div>

          {/* Employee Table Component - Mobile optimized */}
          <div className="mb-4 md:mb-6">
            <Card className="bg-white/90 border-blue-100 shadow-sm">
              <CardContent className="p-0 md:p-4">
                <div className="w-full overflow-x-auto">
                  <EmployeeTable onRefresh={handleRefreshStats} onAttendanceUpdate={handleAttendanceUpdate} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Schedule Calendar - Mobile optimized */}
          <Card className="bg-white/90 border-blue-100 shadow-sm">
            <CardContent className="p-3 md:p-6">
              <div className="mb-3 md:mb-4">
                <h3 className="text-base md:text-xl font-semibold text-blue-700">Employee Schedule Calendar</h3>
                <p className="text-xs md:text-sm text-slate-600">Click on any date to view employee attendance details</p>
              </div>
              <div className="h-[300px] md:h-[600px] w-full overflow-hidden rounded-lg border">
                <div className="w-full h-full overflow-auto">
                  <FullScreenCalendar
                    data={employeeScheduleData}
                    onDateClick={(date) => {
                      console.log("Date clicked:", date)
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
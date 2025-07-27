"use client"

import { useEffect, useState } from "react"
import { format, isToday, isSameDay, parseISO } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, RefreshCw, FileText, User, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface LeaveRequest {
  _id: string
  employee: string
  leaveType: "annual" | "sick" | "personal" | "emergency"
  startDate: string
  endDate: string
  reason: string
  comments: string
  totalDays: number
  createdAt: string
  updatedAt: string
}

interface Employee {
  id: string
  email: string
  fname: string
  lname: string
  contact: string
  role: string
  isActive: boolean
}

interface ApiResponse {
  success: boolean
  data: LeaveRequest[]
}

function LeaveManagementContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([])
  const [filteredLeaveRequests, setFilteredLeaveRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)

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

    // Fetch leave data and employees
    fetchLeaveData()
    fetchEmployees()

    // Dispatch auth change event to ensure sidebar updates
    window.dispatchEvent(new Event("auth-change"))
  }, [router])

  useEffect(() => {
    // Filter leaves based on selected date
    if (allLeaveRequests.length > 0) {
      filterLeavesByDate(selectedDate)
    }
  }, [allLeaveRequests, selectedDate])

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("No authentication token found")
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
        setEmployees(data.data)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchLeaveData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")

      if (!token) {
        setError("No authentication token found")
        return
      }

      const response = await fetch("/api/leave/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setAllLeaveRequests(data.data)
        // Initially filter for today's leaves
        filterLeavesByDate(new Date(), data.data)
      } else {
        setError("Failed to fetch leave data")
      }
    } catch (error) {
      console.error("Error fetching leave data:", error)
      setError("Failed to load leave requests. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filterLeavesByDate = (date: Date, leaves = allLeaveRequests) => {
    const filtered = leaves.filter((leave) => {
      const startDate = parseISO(leave.startDate)
      const endDate = parseISO(leave.endDate)
      return date >= startDate && date <= endDate
    })
    setFilteredLeaveRequests(filtered)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setIsCalendarModalOpen(false)
  }

  const generateCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1)
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0)
    
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getDayLeaveCount = (date: Date) => {
    return allLeaveRequests.filter((leave) => {
      const startDate = parseISO(leave.startDate)
      const endDate = parseISO(leave.endDate)
      return date >= startDate && date <= endDate
    }).length
  }

  const handlePreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(calendarYear - 1)
    } else {
      setCalendarMonth(calendarMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(calendarYear + 1)
    } else {
      setCalendarMonth(calendarMonth + 1)
    }
  }

  const getLeaveTypeBadgeColor = (type: string) => {
    switch (type) {
      case "annual":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "sick":
        return "bg-red-100 text-red-800 border-red-300"
      case "personal":
        return "bg-green-100 text-green-800 border-green-300"
      case "emergency":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const getEmployeeDetails = (email: string) => {
    const employee = employees.find((emp) => emp.email === email)
    return employee ? {
      fullName: `${employee.fname || ""} ${employee.lname || ""}`.trim() || email,
      contact: employee.contact || "N/A"
    } : {
      fullName: email,
      contact: "N/A"
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  const calendarDays = generateCalendarDays()
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let year = currentYear - 10; year <= currentYear + 10; year++) {
    yearOptions.push(year)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Leave Management
              </h1>
              <p className="text-sm text-slate-600">
                Viewing leaves for {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM dd, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCalendarModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Select Date
            </Button>
            <Button
              onClick={fetchLeaveData}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">
                    {isToday(selectedDate) ? "Today's Requests" : "Selected Date Requests"}
                  </p>
                  <p className="text-2xl font-bold text-slate-800">{filteredLeaveRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Days</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredLeaveRequests.reduce((sum, leave) => sum + leave.totalDays, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Employees on Leave</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {new Set(filteredLeaveRequests.map(leave => leave.employee)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card className="bg-white/80 border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-700">
              Leave Requests - {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM dd, yyyy")}
            </CardTitle>
            <CardDescription>
              {isToday(selectedDate) 
                ? "All employees on leave today" 
                : `All employees on leave for ${format(selectedDate, "MMM dd, yyyy")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading leave requests...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <Button onClick={fetchLeaveData} className="mt-4" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredLeaveRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p>No leave requests found for {isToday(selectedDate) ? "today" : format(selectedDate, "MMM dd, yyyy")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Employee</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Mobile</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Leave Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Days</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Reason</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Comments</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaveRequests.map((leave) => {
                      const employeeDetails = getEmployeeDetails(leave.employee)
                      return (
                        <tr key={leave._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-slate-400 mr-2" />
                              <div>
                                <span className="font-medium text-slate-800">{employeeDetails.fullName}</span>
                                <div className="text-xs text-slate-500">{leave.employee}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {employeeDetails.contact}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline" 
                              className={getLeaveTypeBadgeColor(leave.leaveType)}
                            >
                              {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="text-sm">
                              <div>{formatDate(leave.startDate)}</div>
                              <div className="text-slate-400">to {formatDate(leave.endDate)}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{leave.totalDays}</span>
                            <span className="text-slate-500 text-sm ml-1">
                              {leave.totalDays === 1 ? "day" : "days"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs">
                            <div className="truncate" title={leave.reason}>
                              {leave.reason}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs">
                            <div className="truncate" title={leave.comments}>
                              {leave.comments || "-"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-sm">
                            {formatDate(leave.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Modal */}
        <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Select Date
              </DialogTitle>
            </DialogHeader>
            
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Select value={calendarMonth.toString()} onValueChange={(value) => setCalendarMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      {monthNames[calendarMonth]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={calendarYear.toString()} onValueChange={(value) => setCalendarYear(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue>
                      {calendarYear}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-sm font-medium text-slate-600">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                const leaveCount = getDayLeaveCount(day)
                const isCurrentMonth = day.getMonth() === calendarMonth
                const isSelectedDay = isSameDay(day, selectedDate)
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    disabled={!isCurrentMonth}
                    className={`
                      p-2 text-sm rounded-md transition-colors relative
                      ${!isCurrentMonth 
                        ? 'text-slate-300 cursor-not-allowed' 
                        : 'text-slate-700 hover:bg-blue-100 cursor-pointer'
                      }
                      ${isSelectedDay ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    `}
                  >
                    {day.getDate()}
                    {leaveCount > 0 && isCurrentMonth && (
                      <div className={`
                        absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center
                        ${isSelectedDay ? 'bg-white text-blue-600' : ''}
                      `}>
                        {leaveCount}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function LeaveManagementPage() {
  return (
    <AuthGuard requiredRole="admin">
      <LeaveManagementContent />
    </AuthGuard>
  )
} 
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, Users, UserCheck, UserX, Calendar } from "lucide-react"

interface Employee {
  id: string
  email: string
  fname: string
  lname: string
  contact: string
  role: string
  isActive: boolean
}

interface AttendanceRecord {
  email: string
  fname: string
  lname: string
  contact: string
  date: string
  clockInTime?: string
  clockOutTime?: string
  totalHours?: string
  status: "clocked-in" | "clocked-out" | "absent"
  notes?: string
}

interface LeaveRecord {
  _id: string
  employee: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  comments: string
  totalDays: number
  createdAt: string
  updatedAt: string
}

interface EmployeeTableProps {
  onRefresh?: () => void
  onAttendanceUpdate?: (totalEmployees: number, activeToday: number, leaveToday: number) => void
}

export function EmployeeTable({ onRefresh, onAttendanceUpdate }: EmployeeTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceData(selectedDate)
      fetchLeaveData(selectedDate)
    }
  }, [selectedDate])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
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

  const fetchLeaveData = async (date: string) => {
    try {
      setLeaveLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        console.error("No authentication token found")
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

      const data = await response.json()

      if (data.success === "true" && data.data) {
        // Filter leaves for the selected date
        const selectedDateObj = new Date(date)
        const todaysLeaves = data.data.filter((leave: LeaveRecord) => {
          const startDate = new Date(leave.startDate)
          const endDate = new Date(leave.endDate)
          return selectedDateObj >= startDate && selectedDateObj <= endDate
        })
        setLeaveData(todaysLeaves)

        // Update parent component with statistics
        const activeToday = attendanceData.filter(
          (record: AttendanceRecord) => record.status === "clocked-in" || record.status === "clocked-out",
        ).length

        onAttendanceUpdate?.(employees.length, activeToday, todaysLeaves.length)
      } else {
        setLeaveData([])
        onAttendanceUpdate?.(employees.length, 0, 0)
      }
    } catch (error) {
      console.error("Error fetching leave data:", error)
      setLeaveData([])
      onAttendanceUpdate?.(employees.length, 0, 0)
    } finally {
      setLeaveLoading(false)
    }
  }

  const getStatusInfo = (employee: Employee) => {
    const attendance = attendanceData.find((record) => record.email === employee.email)

    if (!attendance) {
      return {
        badge: (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            No Data
          </Badge>
        ),
        details: null,
      }
    }

    switch (attendance.status) {
      case "clocked-in":
        return {
          badge: (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Clock In
            </Badge>
          ),
          details: attendance.clockInTime ? (
            <div className="text-xs text-slate-500 mt-1">
              {new Date(attendance.clockInTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ) : null,
        }
      case "clocked-out":
        return {
          badge: (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
              Clock Out
            </Badge>
          ),
          details: attendance.clockOutTime ? (
            <div className="text-xs text-slate-500 mt-1">
              {new Date(attendance.clockOutTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ) : null,
        }
      case "absent":
        return {
          badge: (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
              Absent
            </Badge>
          ),
          details: null,
        }
      default:
        return {
          badge: (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
              No Data
            </Badge>
          ),
          details: null,
        }
    }
  }

  const getAttendanceStatus = (employee: Employee) => {
    const attendance = attendanceData.find((record) => record.email === employee.email)

    if (!attendance) {
      return {
        badge: (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            No Data
          </Badge>
        ),
        details: null,
      }
    }

    switch (attendance.status) {
      case "clocked-in":
        return {
          badge: (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              In Office
            </Badge>
          ),
          details: attendance.totalHours ? (
            <div className="text-xs text-slate-500 mt-1">Working: {attendance.totalHours}</div>
          ) : null,
        }
      case "clocked-out":
        return {
          badge: (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
              Off for the day
            </Badge>
          ),
          details: attendance.totalHours ? (
            <div className="text-xs text-slate-500 mt-1">Total: {attendance.totalHours}</div>
          ) : null,
        }
      case "absent":
        return {
          badge: (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
              Absent
            </Badge>
          ),
          details: null,
        }
      default:
        return {
          badge: (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
              No Data
            </Badge>
          ),
          details: null,
        }
    }
  }

  const getLeaveStatus = (employee: Employee) => {
    const leave = leaveData.find((record) => record.employee === employee.email)

    if (!leave) {
      return {
        badge: (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            Not on Leave
          </Badge>
        ),
        details: null,
      }
    }

    const getLeaveTypeBadge = (leaveType: string) => {
      switch (leaveType.toLowerCase()) {
        case "annual":
          return "bg-blue-100 text-blue-800 border-blue-200"
        case "sick":
          return "bg-red-100 text-red-800 border-red-200"
        case "personal":
          return "bg-purple-100 text-purple-800 border-purple-200"
        case "emergency":
          return "bg-orange-100 text-orange-800 border-orange-200"
        default:
          return "bg-yellow-100 text-yellow-800 border-yellow-200"
      }
    }

    return {
      badge: (
        <Badge variant="secondary" className={`text-xs ${getLeaveTypeBadge(leave.leaveType)}`}>
          {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
        </Badge>
      ),
      details: (
        <div className="text-xs text-slate-500 mt-1">
          {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
        </div>
      ),
    }
  }

  const getFullName = (fname: string, lname: string) => {
    return `${fname || ""} ${lname || ""}`.trim() || "N/A"
  }

  const presentCount = attendanceData.filter(
    (record) => record.status === "clocked-in" || record.status === "clocked-out",
  ).length
  const absentCount = attendanceData.filter((record) => record.status === "absent").length
  const leaveCount = leaveData.length

  return (
    <Card className="bg-white/80 border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-blue-700">Employee Attendance</CardTitle>
            <p className="text-sm text-slate-600">Manage and view employee attendance records</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full lg:w-auto"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-4">
            <div className="flex flex-col items-center space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 md:space-x-3">
              <Users className="h-4 w-4 md:h-8 md:w-8 text-blue-600" />
              <div className="text-center sm:text-left">
                <p className="text-xs md:text-sm font-medium text-blue-600">Total</p>
                <p className="text-sm md:text-2xl font-bold text-blue-800">{employees.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-4">
            <div className="flex flex-col items-center space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 md:space-x-3">
              <UserCheck className="h-4 w-4 md:h-8 md:w-8 text-green-600" />
              <div className="text-center sm:text-left">
                <p className="text-xs md:text-sm font-medium text-green-600">Present</p>
                <p className="text-sm md:text-2xl font-bold text-green-800">{presentCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-4">
            <div className="flex flex-col items-center space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 md:space-x-3">
              <UserX className="h-4 w-4 md:h-8 md:w-8 text-red-600" />
              <div className="text-center sm:text-left">
                <p className="text-xs md:text-sm font-medium text-red-600">Absent</p>
                <p className="text-sm md:text-2xl font-bold text-red-800">{absentCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-4">
            <div className="flex flex-col items-center space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 md:space-x-3">
              <Calendar className="h-4 w-4 md:h-8 md:w-8 text-yellow-600" />
              <div className="text-center sm:text-left">
                <p className="text-xs md:text-sm font-medium text-yellow-600">On Leave</p>
                <p className="text-sm md:text-2xl font-bold text-yellow-800">{leaveCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="w-full overflow-x-auto">
          <div className="max-h-[640px] overflow-y-auto border border-slate-200 rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 min-w-[150px]">Name</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[200px]">Email</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[120px]">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[80px]">Role</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[120px]">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[120px]">Leave</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[150px]">
                    Attendance ({format(new Date(selectedDate), "MMM d, yyyy")})
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees
                    .filter((employee) => employee.role !== "admin" && employee.role !== "super admin")
                    .map((employee) => {
                    const statusInfo = getStatusInfo(employee)
                    const attendanceStatus = getAttendanceStatus(employee)
                    const leaveStatus = getLeaveStatus(employee)
                    return (
                      <TableRow key={employee.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm truncate">
                          {getFullName(employee.fname, employee.lname)}
                        </TableCell>
                        <TableCell className="text-slate-600 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm truncate">
                          {employee.email}
                        </TableCell>
                        <TableCell className="text-slate-600 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                          {employee.contact}
                        </TableCell>
                        <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                          <Badge variant="outline" className="capitalize text-xs">
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                          {attendanceLoading ? (
                            <Skeleton className="h-6 w-20" />
                          ) : (
                            <div>
                              {statusInfo.badge}
                              {statusInfo.details}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                          {leaveLoading ? (
                            <Skeleton className="h-6 w-20" />
                          ) : (
                            <div>
                              {leaveStatus.badge}
                              {leaveStatus.details}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                          {attendanceLoading ? (
                            <Skeleton className="h-6 w-20" />
                          ) : (
                            <div>
                              {attendanceStatus.badge}
                              {attendanceStatus.details}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
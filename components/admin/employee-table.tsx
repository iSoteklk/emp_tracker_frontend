"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, Users, UserCheck, UserX } from "lucide-react"

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

interface EmployeeTableProps {
  onRefresh?: () => void
  onAttendanceUpdate?: (totalEmployees: number, activeToday: number) => void
}

export function EmployeeTable({ onRefresh, onAttendanceUpdate }: EmployeeTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceData(selectedDate)
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

        // Update parent component with statistics
        const activeToday = data.data.filter(
          (record: AttendanceRecord) => record.status === "clocked-in" || record.status === "clocked-out",
        ).length

        onAttendanceUpdate?.(employees.length, activeToday)
      } else {
        setAttendanceData([])
        onAttendanceUpdate?.(employees.length, 0)
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      setAttendanceData([])
      onAttendanceUpdate?.(employees.length, 0)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const getAttendanceStatus = (employee: Employee) => {
    const attendance = attendanceData.find((record) => record.email === employee.email)

    if (!attendance) {
      return {
        status: "no-data",
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
          status: "clocked-in",
          badge: (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Clocked In
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
          status: "clocked-out",
          badge: (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
              Completed
            </Badge>
          ),
          details: attendance.totalHours ? (
            <div className="text-xs text-slate-500 mt-1">{attendance.totalHours}</div>
          ) : null,
        }
      case "absent":
        return {
          status: "absent",
          badge: (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
              Absent
            </Badge>
          ),
          details: null,
        }
      default:
        return {
          status: "no-data",
          badge: (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
              No Data
            </Badge>
          ),
          details: null,
        }
    }
  }

  const getFullName = (fname: string, lname: string) => {
    return `${fname || ""} ${lname || ""}`.trim() || "N/A"
  }

  const presentCount = attendanceData.filter(
    (record) => record.status === "clocked-in" || record.status === "clocked-out",
  ).length
  const absentCount = attendanceData.filter((record) => record.status === "absent").length

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
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-800">{employees.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Present</p>
                <p className="text-2xl font-bold text-green-800">{presentCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Absent</p>
                <p className="text-2xl font-bold text-red-800">{absentCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="rounded-md border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                <TableHead className="font-semibold text-slate-700">Email</TableHead>
                <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                <TableHead className="font-semibold text-slate-700">Role</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Attendance ({format(new Date(selectedDate), "MMM d, yyyy")})
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => {
                  const attendanceStatus = getAttendanceStatus(employee)
                  return (
                    <TableRow key={employee.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{getFullName(employee.fname, employee.lname)}</TableCell>
                      <TableCell className="text-slate-600">{employee.email}</TableCell>
                      <TableCell className="text-slate-600">{employee.contact}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {employee.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={employee.isActive ? "default" : "secondary"}
                          className={
                            employee.isActive
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
      </CardContent>
    </Card>
  )
}
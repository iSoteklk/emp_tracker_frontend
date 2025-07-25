"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { Badge } from "@/components/ui/badge"
import { Calendar, RefreshCw, FileText, User } from "lucide-react"
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

interface ApiResponse {
  success: boolean
  data: LeaveRequest[]
}

function LeaveManagementContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    // Fetch leave data
    fetchLeaveData()

    // Dispatch auth change event to ensure sidebar updates
    window.dispatchEvent(new Event("auth-change"))
  }, [router])

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
        setLeaveRequests(data.data)
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
                Leave Management
              </h1>
              <p className="text-sm text-slate-600">Manage and view all employee leave requests</p>
            </div>
          </div>
          <Button
            onClick={fetchLeaveData}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-800">{leaveRequests.length}</p>
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
                    {leaveRequests.reduce((sum, leave) => sum + leave.totalDays, 0)}
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
                  <p className="text-sm font-medium text-slate-600">Unique Employees</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {new Set(leaveRequests.map(leave => leave.employee)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card className="bg-white/80 border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-700">Leave Requests</CardTitle>
            <CardDescription>
              All employee leave requests and their details
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
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Employee</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Leave Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Days</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Reason</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Comments</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((leave) => (
                      <tr key={leave._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-slate-400 mr-2" />
                            <span className="font-medium text-slate-800">{leave.employee}</span>
                          </div>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
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
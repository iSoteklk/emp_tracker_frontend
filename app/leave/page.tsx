"use client"

import { useEffect, useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { LeaveRequestForm } from "@/components/leave/leave-request-form"
import { LeaveRequestsList } from "@/components/leave/leave-requests-list"
import { Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  totalDays: number
  comments?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

function LeavePageContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Redirect admin users to admin dashboard
      if (parsedUser.role === "admin") {
        router.push("/admin")
        return
      }
    }

    fetchLeaveRequests()
  }, [router])

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"

      const response = await fetch(`${baseUrl}/leave/my`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        const requests = result.data || []
        setLeaveRequests(requests)

        // Calculate stats
        setStats({
          totalRequests: requests.length,
          pendingRequests: requests.filter((req: LeaveRequest) => req.status === "pending").length,
          approvedRequests: requests.filter((req: LeaveRequest) => req.status === "approved").length,
          rejectedRequests: requests.filter((req: LeaveRequest) => req.status === "rejected").length,
        })
      }
    } catch (error) {
      console.error("Failed to fetch leave requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    fetchLeaveRequests()
  }

  const handleUpdateSuccess = () => {
    fetchLeaveRequests()
  }

  if (!user || user.role === "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Leave Management
              </h1>
              <p className="text-sm text-muted-foreground">Manage your leave requests and track their status</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Leave Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.approvedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Rejected</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.rejectedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests List */}
        <Card className="bg-white/80 border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-700">My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveRequestsList requests={leaveRequests} loading={loading} onUpdateSuccess={handleUpdateSuccess} />
          </CardContent>
        </Card>

        {/* Create Leave Request Form Modal */}
        {showCreateForm && (
          <LeaveRequestForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  )
}

export default function LeavePage() {
  return (
    <AuthGuard requiredRole="employee">
      <LeavePageContent />
    </AuthGuard>
  )
}
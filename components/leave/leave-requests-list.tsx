"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit, Calendar, Clock, CheckCircle, XCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { LeaveRequestForm } from "./leave-request-form"

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

interface LeaveRequestsListProps {
  requests: LeaveRequest[]
  loading: boolean
  onUpdateSuccess: () => void
}

export function LeaveRequestsList({ requests, loading, onUpdateSuccess }: LeaveRequestsListProps) {
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatLeaveType = (type: string) => {
    if (!type) return "Unknown"
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1")
  }

  const handleEditSuccess = () => {
    setEditingRequest(null)
    onUpdateSuccess()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading leave requests...</p>
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No leave requests found</h3>
        <p className="text-sm text-muted-foreground">
          You haven't submitted any leave requests yet. Click "New Request" to get started.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4 p-4">
        {requests.map((request) => (
          <Card key={request.id} className="border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{formatLeaveType(request.leaveType)}</h3>
                  <p className="text-sm text-slate-600">
                    {format(new Date(request.startDate), "MMM dd")} -{" "}
                    {format(new Date(request.endDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                  </Badge>
                  {(request.status || "pending") === "pending" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRequest(request)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Request
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Reason:</p>
                  <p className="text-sm text-slate-600">{request.reason}</p>
                </div>

                {request.comments && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">Comments:</p>
                    <p className="text-sm text-slate-600">{request.comments}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge className={`${getStatusColor(request.status || "pending")} flex items-center gap-1`}>
                    {getStatusIcon(request.status || "pending")}
                    {(request.status || "pending").charAt(0).toUpperCase() + (request.status || "pending").slice(1)}
                  </Badge>
                  <p className="text-xs text-slate-500">
                    Submitted {format(new Date(request.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{formatLeaveType(request.leaveType)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{format(new Date(request.startDate), "MMM dd, yyyy")}</div>
                    <div className="text-muted-foreground">to {format(new Date(request.endDate), "MMM dd, yyyy")}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={request.reason}>
                    {request.reason}
                  </div>
                  {request.comments && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={request.comments}>
                      {request.comments}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(request.status || "pending")} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(request.status || "pending")}
                    {(request.status || "pending").charAt(0).toUpperCase() + (request.status || "pending").slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(request.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {(request.status || "pending") === "pending" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRequest(request)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Request
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingRequest && (
        <LeaveRequestForm
          isOpen={!!editingRequest}
          onClose={() => setEditingRequest(null)}
          onSuccess={handleEditSuccess}
          editData={editingRequest}
        />
      )}
    </>
  )
}

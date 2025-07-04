"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

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

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
}

export function AttendanceModal({ isOpen, onClose, selectedDate }: AttendanceModalProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchAttendanceForDate(selectedDate)
    }
    // Reset data when modal closes
    if (!isOpen) {
      setAttendanceData([])
    }
  }, [isOpen, selectedDate])

  const fetchAttendanceForDate = async (date: Date) => {
    try {
      setLoading(true)
      const dateString = format(date, "yyyy-MM-dd")

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No authentication token found")
        return
      }

      const response = await fetch(`/api/attendance/${dateString}`, {
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
      setLoading(false)
    }
  }

  const getAttendanceBadge = (status: string, record?: AttendanceRecord) => {
    switch (status) {
      case "clocked-in":
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Clocked In
            </Badge>
            {record?.clockInTime && (
              <span className="text-xs text-slate-500">
                {new Date(record.clockInTime).toLocaleTimeString("en-US", {
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
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
              Completed
            </Badge>
            {record?.totalHours && <span className="text-xs text-slate-500">{record.totalHours}</span>}
          </div>
        )
      case "absent":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
            Absent
          </Badge>
        )
      default:
        return null
    }
  }

  const formatModalDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-700">
            Employee Attendance - {selectedDate && formatModalDate(selectedDate)}
          </DialogTitle>
          <DialogDescription>View detailed attendance information for all employees on this date.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading attendance data...</p>
              </div>
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Records</h3>
              <p className="text-sm text-slate-600">No attendance data found for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {
                        attendanceData.filter(
                          (record) => record.status === "clocked-out" || record.status === "clocked-in",
                        ).length
                      }
                    </div>
                    <div className="text-sm text-green-600">Present</div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-700">
                      {attendanceData.filter((record) => record.status === "absent").length}
                    </div>
                    <div className="text-sm text-red-600">Absent</div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {attendanceData.filter((record) => record.status === "clocked-in").length}
                    </div>
                    <div className="text-sm text-blue-600">Currently Clocked In</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {attendanceData.map((record, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium text-slate-900">
                              {record.fname} {record.lname}
                            </h4>
                            <p className="text-sm text-slate-600">{record.email}</p>
                          </div>
                        </div>

                        {record.status !== "absent" && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {record.clockInTime && (
                              <div>
                                <span className="text-slate-500">Clock In: </span>
                                <span className="font-medium">
                                  {new Date(record.clockInTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            {record.clockOutTime && (
                              <div>
                                <span className="text-slate-500">Clock Out: </span>
                                <span className="font-medium">
                                  {new Date(record.clockOutTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            {record.totalHours && (
                              <div>
                                <span className="text-slate-500">Total Hours: </span>
                                <span className="font-medium">{record.totalHours}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {record.notes && (
                          <div className="mt-2">
                            <span className="text-slate-500 text-sm">Notes: </span>
                            <span className="text-sm">{record.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-4">{getAttendanceBadge(record.status, record)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationSearch } from "@/components/user-worklog/location-search"
import { X, Users, UserCheck, UserX, Clock, Filter } from "lucide-react"

interface AttendanceRecord {
  email: string
  fname: string
  lname: string
  contact: string
  date: string
  clockInTime?: string
  clockOutTime?: string
  clockInLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
    name?: string // Work location name from clock-in
  }
  clockOutLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
    name?: string // Work location name from clock-out
  }
  totalHours?: string
  status: "clocked-in" | "clocked-out" | "absent"
  notes?: string
}

interface WorkLocation {
  _id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number
  createdAt: string
  updatedAt: string
}

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
}

type AttendanceStatusFilter = "all" | "present" | "absent" | "clocked-in"

export function AttendanceModal({ isOpen, onClose, selectedDate }: AttendanceModalProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredAttendanceData, setFilteredAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<WorkLocation | null>(null)
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<AttendanceStatusFilter>("all")

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchAttendanceForDate(selectedDate)
    }
    // Reset data when modal closes
    if (!isOpen) {
      setAttendanceData([])
      setFilteredAttendanceData([])
      setSelectedWorkLocation(null)
      setAttendanceStatusFilter("all")
    }
  }, [isOpen, selectedDate])

  // Filter attendance data when work location or status selection changes
  useEffect(() => {
    let filtered = attendanceData

    // Apply work location filter
    if (selectedWorkLocation) {
      filtered = filtered.filter((record) => {
        // Filter by clock-in location name (primary filter)
        if (record.clockInLocation?.name === selectedWorkLocation.name) {
          return true
        }
        // Fallback: filter by clock-out location name if clock-in location is not available
        if (!record.clockInLocation?.name && record.clockOutLocation?.name === selectedWorkLocation.name) {
          return true
        }
        return false
      })
    }

    // Apply attendance status filter
    if (attendanceStatusFilter !== "all") {
      filtered = filtered.filter((record) => {
        switch (attendanceStatusFilter) {
          case "present":
            return record.status === "clocked-in" || record.status === "clocked-out"
          case "absent":
            return record.status === "absent"
          case "clocked-in":
            return record.status === "clocked-in"
          default:
            return true
        }
      })
    }

    setFilteredAttendanceData(filtered)
  }, [attendanceData, selectedWorkLocation, attendanceStatusFilter])

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
        setFilteredAttendanceData(data.data)
      } else {
        setAttendanceData([])
        setFilteredAttendanceData([])
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      setAttendanceData([])
      setFilteredAttendanceData([])
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: WorkLocation) => {
    setSelectedWorkLocation(location)
  }

  const clearLocationFilter = () => {
    setSelectedWorkLocation(null)
  }

  const clearAllFilters = () => {
    setSelectedWorkLocation(null)
    setAttendanceStatusFilter("all")
  }

  const getAttendanceStatusLabel = (filter: AttendanceStatusFilter) => {
    switch (filter) {
      case "all":
        return "All Employees"
      case "present":
        return "Present Only"
      case "absent":
        return "Absent Only"
      case "clocked-in":
        return "Currently Clocked In"
      default:
        return "All Employees"
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

  const hasActiveFilters = selectedWorkLocation !== null || attendanceStatusFilter !== "all"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-700">
            Employee Attendance - {selectedDate && formatModalDate(selectedDate)}
          </DialogTitle>
          <DialogDescription>View detailed attendance information filtered by work location and attendance status.</DialogDescription>
        </DialogHeader>

        {/* Filters Section */}
        <div className="border-b border-slate-200 pb-4 space-y-4">
          {/* Clear Filters Button */}
          {/* {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap bg-red-400"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
            )} */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Work Location Filter */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Work Location:
              </label>
              <LocationSearch 
                onLocationSelect={handleLocationSelect}
                className="w-full"
                defaultValue={selectedWorkLocation}
              />
            </div>
            
            {/* Attendance Status Filter */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Status:
              </label>
              <Select value={attendanceStatusFilter} onValueChange={(value: AttendanceStatusFilter) => setAttendanceStatusFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select attendance status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  <SelectItem value="absent">Absent Only</SelectItem>
                  <SelectItem value="clocked-in">Currently Clocked In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Active filters:</span>
              
              {selectedWorkLocation && (
                <Badge variant="outline" className="gap-1">
                  📍 {selectedWorkLocation.name}
                  <button
                    onClick={clearLocationFilter}
                    className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {attendanceStatusFilter !== "all" && (
                <Badge variant="outline" className="gap-1">
                  🎯 {getAttendanceStatusLabel(attendanceStatusFilter)}
                  <button
                    onClick={() => setAttendanceStatusFilter("all")}
                    className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading attendance data...</p>
              </div>
            </div>
          ) : filteredAttendanceData.length === 0 ? (
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
              <p className="text-sm text-slate-600">
                {hasActiveFilters
                  ? "No attendance data found matching the current filters."
                  : "No attendance data found for this date."
                }
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-center">
                    <UserCheck className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-green-700">
                      {
                        filteredAttendanceData.filter(
                          (record) => record.status === "clocked-out" || record.status === "clocked-in",
                        ).length
                      }
                    </div>
                    <div className="text-xs text-green-600">Present</div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-center">
                    <UserX className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-red-700">
                      {filteredAttendanceData.filter((record) => record.status === "absent").length}
                    </div>
                    <div className="text-xs text-red-600">Absent</div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-center">
                    <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-blue-700">
                      {filteredAttendanceData.filter((record) => record.status === "clocked-in").length}
                    </div>
                    <div className="text-xs text-blue-600">Clocked In</div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-center">
                    <Users className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-slate-700">{filteredAttendanceData.length}</div>
                    <div className="text-xs text-slate-600">Total</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredAttendanceData.map((record, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">
                              {record.fname} {record.lname}
                            </h4>
                            <p className="text-sm text-slate-600 truncate">{record.email}</p>
                            
                            {/* Show work location info */}
                            {(record.clockInLocation?.name || record.clockOutLocation?.name) && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  📍 {record.clockInLocation?.name || record.clockOutLocation?.name}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {record.status !== "absent" && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {record.clockInTime && (
                              <div className="truncate">
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
                              <div className="truncate">
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
                              <div className="truncate">
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

                      <div className="ml-4 flex-shrink-0">{getAttendanceBadge(record.status, record)}</div>
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
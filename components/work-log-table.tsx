"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format, parseISO, differenceInMinutes, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"

interface ShiftData {
  _id: string
  email: string
  date: string
  clockInTime: string
  clockOutTime?: string
  clockInLocation: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  clockOutLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  totalHours: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface WorkLogEntry {
  date: string
  day: string
  startTime: string
  endTime: string
  totalHours: string
  status: string
  overtime: string
  location: string
  notes?: string
}

interface DateRange {
  startDate: string
  endDate: string
}

interface WorkLogTableProps {
  selectedDate?: string
}

const TIME_PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "Last 30 Days", value: "last30days" },
  { label: "This Week", value: "thisweek" },
  { label: "This Month", value: "thismonth" },
  { label: "Custom Range", value: "custom" },
]

export function WorkLogTable({ selectedDate }: WorkLogTableProps) {
  const [workLogData, setWorkLogData] = useState<WorkLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("today")
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const getDateRangeForPeriod = (period: string): DateRange => {
    const today = new Date()
    
    switch (period) {
      case "today":
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        }
      case "yesterday":
        const yesterday = subDays(today, 1)
        return {
          startDate: format(yesterday, 'yyyy-MM-dd'),
          endDate: format(yesterday, 'yyyy-MM-dd'),
        }
      case "last7days":
        return {
          startDate: format(subDays(today, 6), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        }
      case "last30days":
        return {
          startDate: format(subDays(today, 29), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        }
      case "thisweek":
        return {
          startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        }
      case "thismonth":
        return {
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
        }
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        }
      default:
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        }
    }
  }

  const fetchWorkLogData = async (range: DateRange) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Get all dates in the range
      const startDate = parseISO(range.startDate)
      const endDate = parseISO(range.endDate)
      const datesInRange = eachDayOfInterval({ start: startDate, end: endDate })

      // Fetch data for each date
      const promises = datesInRange.map(async (date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/me/date/${dateStr}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            console.warn(`Failed to fetch data for ${dateStr}: ${response.status}`)
            return []
          }

          const data = await response.json()
          
          if (data.success === "true" && data.data) {
            return data.data
          }
          return []
        } catch (error) {
          console.warn(`Error fetching data for ${dateStr}:`, error)
          return []
        }
      })

      const results = await Promise.all(promises)
      const allShiftData = results.flat()
      
      if (allShiftData.length > 0) {
        const transformedData = transformShiftData(allShiftData)
        setWorkLogData(transformedData)
      } else {
        setWorkLogData([])
      }
    } catch (error) {
      console.error("Error fetching work log data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch work log data")
      setWorkLogData([])
    } finally {
      setIsLoading(false)
    }
  }

  const transformShiftData = (shiftData: ShiftData[]): WorkLogEntry[] => {
    return shiftData
      .map((shift) => {
        const clockInDate = parseISO(shift.clockInTime)
        const clockOutDate = shift.clockOutTime ? parseISO(shift.clockOutTime) : null
        
        // Calculate actual worked time if both clock in and out are available
        let actualWorkedMinutes = 0
        let calculatedHours = shift.totalHours
        
        if (clockOutDate) {
          actualWorkedMinutes = differenceInMinutes(clockOutDate, clockInDate)
          const hours = Math.floor(actualWorkedMinutes / 60)
          const minutes = actualWorkedMinutes % 60
          calculatedHours = `${hours}h ${minutes}m`
        }

        // Calculate overtime (assuming 8 hour standard day = 480 minutes)
        const standardWorkMinutes = 8 * 60 // 8 hours
        const overtimeMinutes = Math.max(0, actualWorkedMinutes - standardWorkMinutes)
        const overtimeHours = Math.floor(overtimeMinutes / 60)
        const overtimeRemainingMinutes = overtimeMinutes % 60
        const overtime = overtimeMinutes > 0 ? `${overtimeHours}h ${overtimeRemainingMinutes}m` : "0m"

        return {
          date: format(clockInDate, 'yyyy-MM-dd'),
          day: format(clockInDate, 'EEEE'),
          startTime: format(clockInDate, 'HH:mm'),
          endTime: clockOutDate ? format(clockOutDate, 'HH:mm') : 'Still working',
          totalHours: calculatedHours,
          status: getWorkStatus(shift.status, clockInDate),
          overtime: overtime,
          location: shift.clockInLocation.address,
          notes: shift.notes
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending (newest first)
  }

  const getWorkStatus = (apiStatus: string, clockInTime: Date): string => {
    // You can customize this based on your business logic
    const clockInHour = clockInTime.getHours()
    const clockInMinute = clockInTime.getMinutes()
    const clockInTotalMinutes = clockInHour * 60 + clockInMinute
    const standardStartMinutes = 9 * 60 // 9:00 AM = 540 minutes
    const lateThresholdMinutes = 5

    if (apiStatus === "clocked-out") {
      if (clockInTotalMinutes > standardStartMinutes + lateThresholdMinutes) {
        return "Late"
      }
      return "On Time"
    } else if (apiStatus === "clocked-in") {
      return "Working"
    }
    
    return apiStatus
  }

  useEffect(() => {
    if (selectedDate) {
      setCustomStartDate(selectedDate)
      setCustomEndDate(selectedDate)
      setDateRange({ startDate: selectedDate, endDate: selectedDate })
      setSelectedPeriod("custom")
    } else {
      // Load today's data by default
      const today = format(new Date(), 'yyyy-MM-dd')
      setDateRange({ startDate: today, endDate: today })
      setSelectedPeriod("today")
    }
  }, [selectedDate])

  useEffect(() => {
    fetchWorkLogData(dateRange)
  }, [dateRange])

  const navigateToToday = () => {
    setSelectedPeriod("today")
    setDateRange(getDateRangeForPeriod("today"))
  }

  const navigateToYesterday = () => {
    setSelectedPeriod("yesterday")
    setDateRange(getDateRangeForPeriod("yesterday"))
  }

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    setDateRange(getDateRangeForPeriod(value))
  }

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "startDate") {
      setCustomStartDate(value)
    } else if (name === "endDate") {
      setCustomEndDate(value)
    }
  }

  const handleApplyCustomDates = () => {
    setDateRange({ startDate: customStartDate, endDate: customEndDate })
  }

  const getDateRangeTitle = () => {
    const start = parseISO(dateRange.startDate)
    const end = parseISO(dateRange.endDate)
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'EEEE, MMMM dd, yyyy')
    }
    
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "On Time":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            On Time
          </Badge>
        )
      case "Late":
        return <Badge variant="destructive">Late</Badge>
      case "Working":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Working
          </Badge>
        )
      case "Weekend":
        return <Badge variant="outline">Weekend</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getOvertimeBadge = (overtime: string) => {
    if (overtime === "0m") {
      return <span className="text-gray-500">-</span>
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        {overtime}
      </Badge>
    )
  }

  // Calculate summary statistics
  const totalWeeklyHours = workLogData
    .filter((day) => day.totalHours !== "0h 00m" && !day.totalHours.includes("Still"))
    .reduce((total, day) => {
      const hours = parseInt(day.totalHours.split("h")[0])
      const minutes = parseInt(day.totalHours.split("h ")[1]?.split("m")[0] || "0")
      return total + hours + minutes / 60
    }, 0)

  const totalOvertime = workLogData
    .filter((day) => day.overtime !== "0m")
    .reduce((total, day) => {
      if (day.overtime.includes("h")) {
        const hours = parseInt(day.overtime.split("h")[0])
        const minutes = parseInt(day.overtime.split("h ")[1]?.split("m")[0] || "0")
        return total + hours + minutes / 60
      } else {
        const minutes = parseInt(day.overtime.split("m")[0])
        return total + minutes / 60
      }
    }, 0)

  const totalDaysWorked = workLogData.filter((day) => 
    day.status !== "Weekend" && day.totalHours !== "0h 00m"
  ).length
  
  const lateDays = workLogData.filter((day) => day.status === "Late").length
  
  const daysWithOvertime = workLogData.filter((day) => 
    day.overtime !== "0m" && parseInt(day.overtime.split("h")[0] || "0") > 0 || 
    (parseInt(day.overtime.split("m")[0]) || 0) > 0
  ).length

  const averageHoursPerDay = totalDaysWorked > 0 ? totalWeeklyHours / totalDaysWorked : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-slate-600">Loading work log data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">Failed to load work log data</div>
              <div className="text-sm text-gray-500 mb-4">{error}</div>
              <Button 
                onClick={() => fetchWorkLogData(dateRange)}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {selectedPeriod === "today" ? "Today's Work Log" : 
                 selectedPeriod === "yesterday" ? "Yesterday's Work Log" :
                 "Work Log History"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getDateRangeTitle()}
              </p>
            </div>
            
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:gap-2">
              {/* Navigation buttons row */}
              <div className="flex items-center gap-1">
                <Button 
                  onClick={navigateToToday}
                  variant={selectedPeriod === "today" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 md:flex-initial"
                >
                  Today
                </Button>
                <Button 
                  onClick={navigateToYesterday}
                  variant={selectedPeriod === "yesterday" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 md:flex-initial"
                >
                  Yesterday
                </Button>
              </div>
              
              {/* Controls row */}
              <div className="flex items-center gap-2">
                <Select onValueChange={handlePeriodChange} value={selectedPeriod}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => fetchWorkLogData(dateRange)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} md:mr-2`} />
                  <span className="hidden md:inline">Refresh</span>
                </Button>
              </div>
              
              {/* Total hours display */}
              {workLogData.length > 0 && (
                <div className="text-center md:text-right border-t pt-3 md:border-t-0 md:pt-0">
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                  <div className="text-xl font-bold">
                    {Math.floor(totalWeeklyHours)}h {Math.round((totalWeeklyHours % 1) * 60)}m
                  </div>
                  {totalOvertime > 0 && (
                    <div className="text-sm text-green-600">
                      Overtime: {Math.floor(totalOvertime)}h {Math.round((totalOvertime % 1) * 60)}m
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPeriod === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="customStartDate" className="text-sm">Start Date</Label>
                <Input
                  id="customStartDate"
                  type="date"
                  name="startDate"
                  value={customStartDate}
                  onChange={handleCustomDateChange}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="customEndDate" className="text-sm">End Date</Label>
                <Input
                  id="customEndDate"
                  type="date"
                  name="endDate"
                  value={customEndDate}
                  onChange={handleCustomDateChange}
                  className="w-full"
                />
              </div>
              <Button onClick={handleApplyCustomDates} className="md:col-span-2">
                Apply Custom Dates
              </Button>
            </div>
          )}
          {workLogData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>No work log entries found for this date range</p>
              <p className="text-sm">Try selecting a different period or date range</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workLogData.map((log, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{log.date}</TableCell>
                        <TableCell>{log.day}</TableCell>
                        <TableCell>{log.startTime}</TableCell>
                        <TableCell>{log.endTime}</TableCell>
                        <TableCell className="font-medium">{log.totalHours}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{getOvertimeBadge(log.overtime)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.location}>
                          {log.location}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.notes}>
                          {log.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {workLogData.map((log, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-lg">{log.day}</div>
                        <div className="text-sm text-muted-foreground">{log.date}</div>
                      </div>
                      <div className="text-right">{getStatusBadge(log.status)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-muted-foreground">Start Time</div>
                        <div className="font-medium">{log.startTime}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">End Time</div>
                        <div className="font-medium">{log.endTime}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Hours</div>
                        <div className="font-semibold text-blue-600">{log.totalHours}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Overtime</div>
                        <div>{getOvertimeBadge(log.overtime)}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Location</div>
                        <div className="font-medium">{log.location}</div>
                      </div>
                      {log.notes && (
                        <div>
                          <div className="text-muted-foreground">Notes</div>
                          <div className="font-medium">{log.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards - Only show if we have data */}
      {workLogData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalDaysWorked}</div>
                <div className="text-sm text-muted-foreground">Days Worked</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lateDays}</div>
                <div className="text-sm text-muted-foreground">Late Days</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(totalOvertime)}h {Math.round((totalOvertime % 1) * 60)}m
                </div>
                <div className="text-sm text-muted-foreground">Total Overtime</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {averageHoursPerDay.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">Average Hours/Day</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

import { SidebarTrigger } from "@/components/ui/sidebar"
import { GlassTimeCard } from "@/components/ui/glass-time-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  // Sample work log data - in a real app, this would come from a database
  const workLogData = [
    {
      date: "2024-01-22",
      day: "Monday",
      startTime: "09:00",
      endTime: "17:30",
      totalHours: "8h 30m",
      status: "On Time",
      overtime: "30m",
    },
    {
      date: "2024-01-23",
      day: "Tuesday",
      startTime: "08:45",
      endTime: "17:15",
      totalHours: "8h 30m",
      status: "On Time",
      overtime: "30m",
    },
    {
      date: "2024-01-24",
      day: "Wednesday",
      startTime: "09:15",
      endTime: "18:00",
      totalHours: "8h 45m",
      status: "Late",
      overtime: "45m",
    },
    {
      date: "2024-01-25",
      day: "Thursday",
      startTime: "08:30",
      endTime: "16:30",
      totalHours: "8h 00m",
      status: "On Time",
      overtime: "0m",
    },
    {
      date: "2024-01-26",
      day: "Friday",
      startTime: "09:30",
      endTime: "18:30",
      totalHours: "9h 00m",
      status: "Late",
      overtime: "1h",
    },
    {
      date: "2024-01-27",
      day: "Saturday",
      startTime: "-",
      endTime: "-",
      totalHours: "0h 00m",
      status: "Weekend",
      overtime: "0m",
    },
    {
      date: "2024-01-28",
      day: "Sunday",
      startTime: "-",
      endTime: "-",
      totalHours: "0h 00m",
      status: "Weekend",
      overtime: "0m",
    },
  ]

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

  // Calculate weekly totals
  const totalWeeklyHours = workLogData
    .filter((day) => day.totalHours !== "0h 00m")
    .reduce((total, day) => {
      const hours = Number.parseInt(day.totalHours.split("h")[0])
      const minutes = Number.parseInt(day.totalHours.split("h ")[1].split("m")[0])
      return total + hours + minutes / 60
    }, 0)

  const totalOvertime = workLogData
    .filter((day) => day.overtime !== "0m")
    .reduce((total, day) => {
      if (day.overtime.includes("h")) {
        const hours = Number.parseInt(day.overtime.split("h")[0])
        return total + hours
      } else {
        const minutes = Number.parseInt(day.overtime.split("m")[0])
        return total + minutes / 60
      }
    }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Time Tracking Dashboard
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Task Timer */}
          <div className="xl:col-span-1 flex justify-center items-start">
            <div className="relative">
              {/* Background gradient for glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg blur-xl opacity-30"></div>
              <div className="relative">
                <GlassTimeCard showSeconds showTimezone />
              </div>
            </div>
          </div>

          {/* Right Column - Work Log Table */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Weekly Work Log</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Week of January 22 - 28, 2024</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Hours</div>
                    <div className="text-2xl font-bold">
                      {Math.floor(totalWeeklyHours)}h {Math.round((totalWeeklyHours % 1) * 60)}m
                    </div>
                    <div className="text-sm text-green-600">
                      Overtime: {Math.floor(totalOvertime)}h {Math.round((totalOvertime % 1) * 60)}m
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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

                      <div className="grid grid-cols-2 gap-4 text-sm">
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
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Weekly Summary Cards - Mobile Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-muted-foreground">Working Days</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">2</div>
                      <div className="text-sm text-muted-foreground">Late Days</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.floor(totalOvertime)}h {Math.round((totalOvertime % 1) * 60)}m
                      </div>
                      <div className="text-sm text-muted-foreground">Total Overtime</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

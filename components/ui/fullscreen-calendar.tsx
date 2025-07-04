"use client"

import * as React from "react"

import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"

import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Event {
  id: number
  name: string
  time: string
  datetime: string
}

interface CalendarData {
  day: Date
  events: Event[]
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

interface FullScreenCalendarProps {
  data: CalendarData[]
  onDateClick?: (date: Date) => void
}

const colStartClasses = ["", "col-start-2", "col-start-3", "col-start-4", "col-start-5", "col-start-6", "col-start-7"]

export function FullScreenCalendar({ data, onDateClick }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"))
  const [showAttendanceModal, setShowAttendanceModal] = React.useState(false)
  const [attendanceData, setAttendanceData] = React.useState<AttendanceRecord[]>([])
  const [attendanceLoading, setAttendanceLoading] = React.useState(false)
  const [modalDate, setModalDate] = React.useState<Date | null>(null)

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
  }

  const fetchAttendanceForDate = async (date: Date) => {
    try {
      setAttendanceLoading(true)
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
      setAttendanceLoading(false)
    }
  }

  const handleDayClick = async (day: Date) => {
    setSelectedDay(day)
    setModalDate(day)
    setShowAttendanceModal(true)
    await fetchAttendanceForDate(day)
    onDateClick?.(day)
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
    <>
      <div className="flex flex-1 flex-col">
        {/* Calendar Header */}
        <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
          <div className="flex flex-auto">
            <div className="flex items-center gap-4">
              <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
                <h1 className="p-1 text-xs uppercase text-muted-foreground">{format(today, "MMM")}</h1>
                <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                  <span>{format(today, "d")}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-foreground">{format(firstDayCurrentMonth, "MMMM, yyyy")}</h2>
                <p className="text-sm text-muted-foreground">
                  {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                  {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <Button variant="outline" size="icon" className="hidden lg:flex bg-transparent">
              <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>

            <Separator orientation="vertical" className="hidden h-6 lg:block" />

            <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
              <Button
                onClick={previousMonth}
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 bg-transparent"
                variant="outline"
                size="icon"
                aria-label="Navigate to previous month"
              >
                <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button
                onClick={goToToday}
                className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto bg-transparent"
                variant="outline"
              >
                Today
              </Button>
              <Button
                onClick={nextMonth}
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 bg-transparent"
                variant="outline"
                size="icon"
                aria-label="Navigate to next month"
              >
                <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </div>

            <Separator orientation="vertical" className="hidden h-6 md:block" />

            <Separator orientation="horizontal" className="block w-full md:hidden" />

            <Button className="w-full gap-2 md:w-auto">
              <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
              <span>New Event</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:flex lg:flex-auto lg:flex-col">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none">
            <div className="border-r py-2.5">Sun</div>
            <div className="border-r py-2.5">Mon</div>
            <div className="border-r py-2.5">Tue</div>
            <div className="border-r py-2.5">Wed</div>
            <div className="border-r py-2.5">Thu</div>
            <div className="border-r py-2.5">Fri</div>
            <div className="py-2.5">Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="flex text-xs leading-6 lg:flex-auto">
            <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
              {days.map((day, dayIdx) =>
                !isDesktop ? (
                  <button
                    onClick={() => handleDayClick(day)}
                    key={dayIdx}
                    type="button"
                    className={cn(
                      isEqual(day, selectedDay) && "text-primary-foreground",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-foreground",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-muted-foreground",
                      (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
                      "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10",
                    )}
                  >
                    <time
                      dateTime={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "ml-auto flex size-6 items-center justify-center rounded-full",
                        isEqual(day, selectedDay) && isToday(day) && "bg-primary text-primary-foreground",
                        isEqual(day, selectedDay) && !isToday(day) && "bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </time>
                    {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                      <div>
                        {data
                          .filter((date) => isSameDay(date.day, day))
                          .map((date) => (
                            <div key={date.day.toString()} className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                              {date.events.map((event) => (
                                <span
                                  key={event.id}
                                  className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                                />
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                  </button>
                ) : (
                  <div
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "bg-accent/50 text-muted-foreground",
                      "relative flex flex-col border-b border-r hover:bg-muted focus:z-10 cursor-pointer",
                      !isEqual(day, selectedDay) && "hover:bg-accent/75",
                    )}
                  >
                    <header className="flex items-center justify-between p-2.5">
                      <button
                        type="button"
                        className={cn(
                          isEqual(day, selectedDay) && "text-primary-foreground",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            "text-foreground",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            "text-muted-foreground",
                          isEqual(day, selectedDay) && isToday(day) && "border-none bg-primary",
                          isEqual(day, selectedDay) && !isToday(day) && "bg-foreground",
                          (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border",
                        )}
                      >
                        <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
                      </button>
                    </header>

                    <div className="flex-1 p-2.5">
                      {data
                        .filter((event) => isSameDay(event.day, day))
                        .map((day) => (
                          <div key={day.day.toString()} className="space-y-1.5">
                            {day.events.slice(0, 1).map((event) => (
                              <div
                                key={event.id}
                                className="flex flex-col items-start gap-1 rounded-lg border bg-muted/50 p-2 text-xs leading-tight"
                              >
                                <p className="font-medium leading-none">{event.name}</p>
                                <p className="leading-none text-muted-foreground">{event.time}</p>
                              </div>
                            ))}
                            {day.events.length > 1 && (
                              <div className="text-xs text-muted-foreground">+ {day.events.length - 1} more</div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
              {days.map((day, dayIdx) => (
                <button
                  onClick={() => handleDayClick(day)}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) && "text-primary-foreground",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      isSameMonth(day, firstDayCurrentMonth) &&
                      "text-foreground",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "text-muted-foreground",
                    (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
                    "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10",
                  )}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full",
                      isEqual(day, selectedDay) && isToday(day) && "bg-primary text-primary-foreground",
                      isEqual(day, selectedDay) && !isToday(day) && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </time>

                  {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                    <div>
                      {data
                        .filter((date) => isSameDay(date.day, day))
                        .map((date) => (
                          <div key={date.day.toString()} className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                            {date.events.map((event) => (
                              <span
                                key={event.id}
                                className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-blue-700">
              Employee Attendance - {modalDate && formatModalDate(modalDate)}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {attendanceLoading ? (
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
    </>
  )
}
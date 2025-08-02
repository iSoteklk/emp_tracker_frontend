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
import { AttendanceModal } from "@/components/modals/attendance-modal"
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

  const handleDayClick = React.useCallback(
    (day: Date) => {
      setSelectedDay(day)
      setModalDate(day)
      setShowAttendanceModal(true)
      onDateClick?.(day)
    },
    [onDateClick],
  )

  const handleCloseModal = React.useCallback(() => {
    setShowAttendanceModal(false)
    setModalDate(null)
  }, [])

  return (
    <>
      <div className="flex flex-1 flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex flex-col space-y-4 p-6 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b">
          <div className="flex flex-auto">
            <div className="flex items-center gap-4">
              <div className="hidden w-20 flex-col items-center justify-center rounded-xl bg-white shadow-md border border-blue-100 p-2 md:flex">
                <h1 className="text-xs uppercase text-blue-600 font-medium">{format(today, "MMM")}</h1>
                <div className="flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-bold shadow-sm">
                  <span className="py-1">{format(today, "d")}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-blue-900">{format(firstDayCurrentMonth, "MMMM, yyyy")}</h2>
                <p className="text-sm text-blue-600 font-medium">
                  {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                  {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-blue-100 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousMonth}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="sr-only">Previous month</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Next month</span>
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs px-4 py-2 bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-medium shadow-sm transition-all"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:flex lg:flex-auto lg:flex-col bg-gradient-to-b from-white to-gray-50/30 p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-4 text-center text-sm font-semibold text-blue-700 lg:flex-none">
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Sun</div>
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Mon</div>
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Tue</div>
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Wed</div>
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Thu</div>
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Fri</div>
            <div className="py-3 rounded-lg bg-blue-50/50 border border-blue-100">Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="flex-auto">
            {/* Desktop Calendar */}
            <div className="hidden lg:grid lg:grid-cols-7 lg:gap-1 lg:auto-rows-fr">
              {days.map((day, dayIdx) => {
                const hasEvents = data.filter((date) => isSameDay(date.day, day)).length > 0
                const dayEvents = data.filter((event) => isSameDay(event.day, day))
                
                return (
                  <div
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      "group relative min-h-[120px] rounded-xl cursor-pointer transition-all duration-200 p-3",
                      "bg-background hover:bg-accent/50 border shadow-sm hover:shadow-md",
                      isToday(day) && "ring-2 ring-blue-500 bg-blue-50/50",
                      isEqual(day, selectedDay) && "ring-2 ring-primary bg-primary/5",
                      !isSameMonth(day, firstDayCurrentMonth) && "opacity-40",
                      hasEvents && "border-blue-200 bg-gradient-to-br from-blue-50/30 to-transparent"
                    )}
                  >
                    {/* Date Number */}
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          isToday(day) && "bg-blue-500 text-white shadow-md",
                          isEqual(day, selectedDay) && !isToday(day) && "bg-primary text-primary-foreground",
                          !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && "text-foreground group-hover:bg-accent",
                          !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      
                      {hasEvents && (
                        <div className="flex items-center space-x-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {dayEvents.reduce((total, day) => total + day.events.length, 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.map((dayData) => (
                        <div key={dayData.day.toString()}>
                          {dayData.events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="group/event rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 p-2 border border-blue-200/50 hover:border-blue-300 transition-colors"
                            >
                              <p className="text-xs font-medium text-blue-900 leading-tight truncate">
                                {event.name}
                              </p>
                              <p className="text-xs text-blue-600 mt-0.5">{event.time}</p>
                            </div>
                          ))}
                          {dayData.events.length > 2 && (
                            <div className="text-xs text-muted-foreground font-medium bg-muted/50 rounded px-2 py-1 text-center">
                              +{dayData.events.length - 2} more events
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mobile Calendar */}
            <div className="grid grid-cols-7 gap-1 lg:hidden">
              {days.map((day, dayIdx) => {
                const hasEvents = data.filter((date) => isSameDay(date.day, day)).length > 0
                const eventCount = data.filter((date) => isSameDay(date.day, day)).reduce((total, date) => total + date.events.length, 0)
                
                return (
                  <button
                    onClick={() => handleDayClick(day)}
                    key={dayIdx}
                    type="button"
                    className={cn(
                      "relative h-12 w-full rounded-lg transition-all duration-200 group",
                      "bg-background hover:bg-accent border shadow-sm hover:shadow-md",
                      isToday(day) && "ring-2 ring-blue-500 bg-blue-50",
                      isEqual(day, selectedDay) && "ring-2 ring-primary bg-primary/5",
                      !isSameMonth(day, firstDayCurrentMonth) && "opacity-40",
                      hasEvents && "border-blue-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-medium",
                        isToday(day) && "text-blue-600 font-bold",
                        isEqual(day, selectedDay) && !isToday(day) && "text-primary",
                        !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && "text-foreground",
                        !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center space-x-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                        {eventCount > 1 && (
                          <span className="text-xs text-blue-600 font-medium">{eventCount}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      <AttendanceModal isOpen={showAttendanceModal} onClose={handleCloseModal} selectedDate={modalDate} />
    </>
  )
}
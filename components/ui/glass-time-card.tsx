"use client"
import { useState, useEffect } from "react"
import { Play, Pause, Square } from "lucide-react"

interface GlassTimeCardProps {
  showSeconds?: boolean
  showTimezone?: boolean
}

export function GlassTimeCard(props: GlassTimeCardProps) {
  const { showSeconds = true, showTimezone = false } = props

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [timezoneName, setTimezoneName] = useState<string>("")

  useEffect(() => {
    const timezoneOffset = currentTime.getTimezoneOffset()
    const timezoneShorter = Intl.DateTimeFormat().resolvedOptions().timeZone
    const offset = -timezoneOffset / 60
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`
    setTimezoneName(`${timezoneShorter} GMT${offsetStr}`)

    const intervalId = setInterval(() => {
      setCurrentTime(new Date())

      if (isTracking && startTime) {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTracking, startTime])

  const handleStart = () => {
    const now = new Date()
    setStartTime(now)
    setIsTracking(true)
    setElapsedTime(0)
  }

  const handlePause = () => {
    setIsTracking(false)
  }

  const handleStop = () => {
    setIsTracking(false)
    setStartTime(null)
    setElapsedTime(0)
  }

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (showSeconds) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      hour12: false,
    })
  }

  const formatDate = (date: Date): string => {
    const day = date.getDate()
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const weekday = weekdays[date.getDay()]
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    const month = months[date.getMonth()]
    return `${weekday} | ${month} ${day}`
  }

  // Check if started late (after 8:30 AM)
  const isLate = startTime && (startTime.getHours() > 8 || (startTime.getHours() === 8 && startTime.getMinutes() > 30))

  // Check if overtime (more than 8 hours)
  const isOvertime = elapsedTime > 8 * 3600 // 8 hours in seconds

  return (
    <div className="w-96 text-white bg-white/20 shadow-xl backdrop-blur-xl p-6 rounded-lg border border-white/10">
      <div className="flex flex-col gap-4 items-center">
        {/* Current Time */}
        <div className="text-center">
          <div className="text-sm opacity-80">{formatDate(currentTime)}</div>
          <div className="text-2xl font-bold tabular-nums">{formatTime(currentTime)}</div>
          {showTimezone && <div className="text-xs text-white/70">{timezoneName}</div>}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/20"></div>

        {/* Task Timer */}
        <div className="text-center w-full">
          <div className="text-sm opacity-80 mb-2">Task Timer</div>
          <div className="text-4xl font-bold tabular-nums mb-4">{formatElapsedTime(elapsedTime)}</div>

          {/* Status Indicators */}
          <div className="flex justify-center gap-4 mb-4">
            {isLate && (
              <div className="flex items-center gap-1 text-red-300">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs">Late</span>
              </div>
            )}
            {isOvertime && (
              <div className="flex items-center gap-1 text-green-300">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs">Overtime</span>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {!isTracking ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/80 hover:bg-yellow-500 rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span className="text-sm">Pause</span>
              </button>
            )}

            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
              disabled={!startTime}
            >
              <Square className="w-4 h-4" />
              <span className="text-sm">Stop</span>
            </button>
          </div>

          {/* Start Time Display */}
          {startTime && (
            <div className="mt-3 text-xs opacity-70">
              Started at: {startTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

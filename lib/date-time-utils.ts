// Date and time utility functions for the time tracking application

/**
 * Formats a date object to a readable string
 */
export function formatDate(date: Date, options?: { includeWeekday?: boolean }): string {
  const { includeWeekday = false } = options || {}

  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: includeWeekday ? "long" : undefined,
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return formatter.format(date)
}

/**
 * Formats a date object to time string
 */
export function formatTime(date: Date, options?: { showSeconds?: boolean }): string {
  const { showSeconds = true } = options || {}

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: true,
  })

  return formatter.format(date)
}

/**
 * Formats elapsed time in seconds to HH:MM:SS or HH:MM format
 */
export function formatElapsedTime(seconds: number, showSeconds = true): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (showSeconds) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  } else {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }
}

/**
 * Gets the current timezone string
 */
export function formatTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Calculates time difference between start time and current time
 */
export function calculateTimeDifference(startTime: Date): {
  totalSeconds: number
  hours: number
  minutes: number
  seconds: number
} {
  const now = new Date()
  const diffMs = now.getTime() - startTime.getTime()
  const totalSeconds = Math.floor(diffMs / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
  }
}

/**
 * Checks if a given time is considered late (after 9:00 AM)
 */
export function isLateTime(time: Date): boolean {
  const hour = time.getHours()
  const minute = time.getMinutes()

  // Consider late if after 9:00 AM
  return hour > 9 || (hour === 9 && minute > 0)
}

/**
 * Checks if worked hours qualify as overtime (more than 8 hours)
 */
export function isOvertimeHours(hours: number): boolean {
  return hours > 8
}

/**
 * Gets the working hours text for display
 */
export function getWorkingHoursText(): string {
  return "9:00 AM - 5:00 PM"
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date()
  return formatDateToString(today)
}

/**
 * Formats a date to YYYY-MM-DD string format
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Parses a date string in YYYY-MM-DD format to Date object
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString + "T00:00:00.000Z")
}

/**
 * Checks if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateToString(date1) === formatDateToString(date2)
}

/**
 * Gets the start of day for a given date
 */
export function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  return startOfDay
}

/**
 * Gets the end of day for a given date
 */
export function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay
}

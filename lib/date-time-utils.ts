import { workTimeConfig } from "@/lib/work-config"

/**
 * Date and Time Utility Functions
 * Centralized utilities for consistent date/time formatting across the application
 */

export interface TimeFormatOptions {
  showSeconds?: boolean
  use24Hour?: boolean
}

export interface DateFormatOptions {
  includeYear?: boolean
  shortFormat?: boolean
  includeWeekday?: boolean
}

/**
 * Format elapsed time from seconds to HH:MM or HH:MM:SS format
 */
export function formatElapsedTime(seconds: number, showSeconds = true): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (showSeconds) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

/**
 * Format time using work configuration or custom options
 */
export function formatTime(date: Date, options?: TimeFormatOptions): string {
  const config = workTimeConfig.getConfig()
  const showSeconds = options?.showSeconds ?? config.showSeconds
  const use24Hour = options?.use24Hour ?? config.use24HourFormat

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24Hour,
  }

  if (showSeconds) {
    formatOptions.second = "2-digit"
  }

  return date.toLocaleTimeString(undefined, formatOptions)
}

/**
 * Format date with weekday and month name
 */
export function formatDate(date: Date, options?: DateFormatOptions): string {
  const day = date.getDate()
  const year = date.getFullYear()

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

  if (options?.shortFormat) {
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const shortMonth = shortMonths[date.getMonth()]

    if (options?.includeYear) {
      return options?.includeWeekday ? `${weekday} | ${shortMonth} ${day}, ${year}` : `${shortMonth} ${day}, ${year}`
    }
    return options?.includeWeekday ? `${weekday} | ${shortMonth} ${day}` : `${shortMonth} ${day}`
  }

  if (options?.includeYear) {
    return options?.includeWeekday ? `${weekday} | ${month} ${day}, ${year}` : `${month} ${day}, ${year}`
  }

  return options?.includeWeekday ? `${weekday} | ${month} ${day}` : `${month} ${day}`
}

/**
 * Get timezone information
 */
export function getTimezoneInfo(): {
  name: string
  offset: string
  abbreviation: string
} {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset()
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
  const offset = -timezoneOffset / 60
  const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`

  // Get timezone abbreviation
  const abbreviation = now.toLocaleDateString("en", { timeZoneName: "short" }).split(", ")[1] || "UTC"

  return {
    name: timezoneName,
    offset: offsetStr,
    abbreviation: `GMT${offsetStr}`,
  }
}

/**
 * Format timezone display string
 */
export function formatTimezone(includeAbbreviation = true): string {
  const timezone = getTimezoneInfo()

  if (includeAbbreviation) {
    return `${timezone.name} ${timezone.abbreviation}`
  }

  return timezone.name
}

/**
 * Calculate time difference between two dates
 */
export function calculateTimeDifference(
  startTime: Date,
  endTime: Date = new Date(),
): {
  totalSeconds: number
  hours: number
  minutes: number
  seconds: number
  formatted: string
} {
  const diffMs = endTime.getTime() - startTime.getTime()
  const totalSeconds = Math.floor(diffMs / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    formatted: formatElapsedTime(totalSeconds, true),
  }
}

/**
 * Check if a time is late based on work configuration
 */
export function isLateTime(clockInTime: Date): boolean {
  return workTimeConfig.isLate(clockInTime)
}

/**
 * Check if worked hours constitute overtime
 */
export function isOvertimeHours(workedHours: number): boolean {
  return workTimeConfig.isOvertime(workedHours)
}

/**
 * Check if a date is a weekend
 */
export function isWeekendDate(date: Date): boolean {
  return workTimeConfig.isWeekend(date)
}

/**
 * Get working hours text from configuration
 */
export function getWorkingHoursText(): string {
  return workTimeConfig.getWorkingHoursText()
}

/**
 * Calculate expected end time based on start time and work configuration
 */
export function calculateExpectedEndTime(startTime: Date): Date {
  return workTimeConfig.calculateExpectedEndTime(startTime)
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(
  seconds: number,
  options?: {
    showSeconds?: boolean
    longFormat?: boolean
  },
): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (options?.longFormat) {
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`)
    if (options?.showSeconds && secs > 0) parts.push(`${secs} second${secs !== 1 ? "s" : ""}`)

    return parts.join(", ") || "0 minutes"
  }

  if (options?.showSeconds) {
    return `${hours}h ${minutes}m ${secs}s`
  }

  return `${hours}h ${minutes}m`
}

/**
 * Parse time string (HH:MM) to hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(":").map(Number)
  return { hours, minutes }
}

/**
 * Convert hours and minutes to total minutes
 */
export function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

/**
 * Convert total minutes to hours and minutes
 */
export function minutesToTime(totalMinutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes }
}

/**
 * Get current date at start of day (midnight)
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  return startOfDay
}

/**
 * Get current date at end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(
  timestamp: number,
  options?: {
    includeDate?: boolean
    includeTime?: boolean
    shortFormat?: boolean
  },
): string {
  const date = new Date(timestamp)
  const includeDate = options?.includeDate ?? true
  const includeTime = options?.includeTime ?? true
  const shortFormat = options?.shortFormat ?? false

  if (includeDate && includeTime) {
    if (shortFormat) {
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    return date.toLocaleString()
  }

  if (includeDate) {
    return shortFormat
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : date.toLocaleDateString()
  }

  if (includeTime) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return date.toISOString()
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 30 minutes")
 */
export function getRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffMs = date.getTime() - baseDate.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (Math.abs(diffDays) >= 1) {
    return diffDays > 0
      ? `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
      : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ago`
  }

  if (Math.abs(diffHours) >= 1) {
    return diffHours > 0
      ? `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`
      : `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? "s" : ""} ago`
  }

  if (Math.abs(diffMinutes) >= 1) {
    return diffMinutes > 0
      ? `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`
      : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? "s" : ""} ago`
  }

  return "just now"
}

/**
 * Validate if a time string is in valid format (HH:MM)
 */
export function isValidTimeFormat(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(timeString)
}

/**
 * Get business days between two dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    if (!isWeekendDate(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

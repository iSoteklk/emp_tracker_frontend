// Work Time Configuration
export interface WorkTimeConfig {
  // Standard work hours
  standardStartTime: string // Format: "HH:MM" (24-hour)
  standardEndTime: string // Format: "HH:MM" (24-hour)
  fullWorkingHours: number // Hours (e.g., 8 for 8 hours)

  // Break times
  lunchBreakDuration: number // Minutes
  shortBreakDuration: number // Minutes

  // Late threshold
  lateThresholdMinutes: number // Minutes after start time

  // Overtime calculation
  overtimeAfterHours: number // Hours after which overtime starts

  // Weekend configuration
  weekendDays: number[] // 0 = Sunday, 1 = Monday, etc.

  // Time format preferences
  use24HourFormat: boolean
  showSeconds: boolean
}

// API Response interface
interface WorkTimeConfigResponse {
  success: boolean
  data: {
    _id: string
    name: string
    standardStartTime: string
    standardEndTime: string
    fullWorkingHours: number
    lunchBreakDuration: number
    shortBreakDuration: number
    lateThresholdMinutes: number
    overtimeAfterHours: number
    weekendDays: number[]
    use24HourFormat: boolean
    showSeconds: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
    __v: number
  }
}

// Default configuration - Fallback if API fails
export const DEFAULT_WORK_CONFIG: WorkTimeConfig = {
  standardStartTime: "08:30", // 8:30 AM
  standardEndTime: "17:30", // 5:30 PM
  fullWorkingHours: 8, // 8 hours
  lunchBreakDuration: 60, // 1 hour lunch
  shortBreakDuration: 15, // 15 minutes break
  lateThresholdMinutes: 0, // Late if any time after start time
  overtimeAfterHours: 8, // Overtime after 8 hours
  weekendDays: [0, 6], // Sunday and Saturday
  use24HourFormat: true,
  showSeconds: true,
}

// Configuration management class
export class WorkTimeConfigManager {
  private static instance: WorkTimeConfigManager
  private config: WorkTimeConfig
  private isLoading = false
  private lastFetchTime = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

  private constructor() {
    this.config = this.loadLocalConfig()
    // Fetch from API on initialization
    this.fetchConfigFromAPI()
  }

  public static getInstance(): WorkTimeConfigManager {
    if (!WorkTimeConfigManager.instance) {
      WorkTimeConfigManager.instance = new WorkTimeConfigManager()
    }
    return WorkTimeConfigManager.instance
  }

  private loadLocalConfig(): WorkTimeConfig {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("workTimeConfig")
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          // Check if we have a timestamp and if it's recent
          if (parsed.timestamp && Date.now() - parsed.timestamp < this.CACHE_DURATION) {
            return { ...DEFAULT_WORK_CONFIG, ...parsed.config }
          }
        } catch (error) {
          console.error("Error loading work config:", error)
        }
      }
    }
    return DEFAULT_WORK_CONFIG
  }

  private async fetchConfigFromAPI(): Promise<void> {
    if (this.isLoading) return

    try {
      this.isLoading = true
      console.log("Fetching work time configuration from API...")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/public/work-time/config/active`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: WorkTimeConfigResponse = await response.json()
      console.log("Work time config API response:", data)

      if (data.success && data.data) {
        const apiConfig: WorkTimeConfig = {
          standardStartTime: data.data.standardStartTime,
          standardEndTime: data.data.standardEndTime,
          fullWorkingHours: data.data.fullWorkingHours,
          lunchBreakDuration: data.data.lunchBreakDuration,
          shortBreakDuration: data.data.shortBreakDuration,
          lateThresholdMinutes: data.data.lateThresholdMinutes,
          overtimeAfterHours: data.data.overtimeAfterHours,
          weekendDays: data.data.weekendDays,
          use24HourFormat: data.data.use24HourFormat,
          showSeconds: data.data.showSeconds,
        }

        this.config = apiConfig
        this.lastFetchTime = Date.now()
        this.saveConfigToLocal(apiConfig)

        console.log("Work time configuration updated from API:", apiConfig)
      } else {
        console.warn("Invalid API response, using default config")
      }
    } catch (error) {
      console.error("Failed to fetch work time config from API:", error)
      console.log("Using cached or default configuration")
    } finally {
      this.isLoading = false
    }
  }

  private saveConfigToLocal(config: WorkTimeConfig): void {
    if (typeof window !== "undefined") {
      const configWithTimestamp = {
        config,
        timestamp: Date.now(),
      }
      localStorage.setItem("workTimeConfig", JSON.stringify(configWithTimestamp))
    }
  }

  public async getConfig(forceRefresh = false): Promise<WorkTimeConfig> {
    // Check if we need to refresh from API
    const shouldRefresh = forceRefresh || (Date.now() - this.lastFetchTime > this.CACHE_DURATION && !this.isLoading)

    if (shouldRefresh) {
      await this.fetchConfigFromAPI()
    }

    return { ...this.config }
  }

  public getConfigSync(): WorkTimeConfig {
    return { ...this.config }
  }

  public async refreshConfig(): Promise<WorkTimeConfig> {
    await this.fetchConfigFromAPI()
    return { ...this.config }
  }

  public updateConfig(newConfig: Partial<WorkTimeConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfigToLocal(this.config)
  }

  // Helper methods
  public isLate(clockInTime: Date): boolean {
    const startTime = this.parseTime(this.config.standardStartTime)
    const clockIn = {
      hours: clockInTime.getHours(),
      minutes: clockInTime.getMinutes(),
    }

    const startMinutes = startTime.hours * 60 + startTime.minutes
    const clockInMinutes = clockIn.hours * 60 + clockIn.minutes

    return clockInMinutes > startMinutes + this.config.lateThresholdMinutes
  }

  public isOvertime(workedHours: number): boolean {
    return workedHours > this.config.overtimeAfterHours
  }

  public isWeekend(date: Date): boolean {
    return this.config.weekendDays.includes(date.getDay())
  }

  public calculateExpectedEndTime(startTime: Date): Date {
    const endTime = new Date(startTime)
    const workHours = this.config.fullWorkingHours
    const lunchBreakHours = this.config.lunchBreakDuration / 60

    endTime.setHours(endTime.getHours() + workHours)
    endTime.setMinutes(endTime.getMinutes() + this.config.lunchBreakDuration)

    return endTime
  }

  public formatTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !this.config.use24HourFormat,
    }

    if (this.config.showSeconds) {
      options.second = "2-digit"
    }

    return date.toLocaleTimeString(undefined, options)
  }

  public parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(":").map(Number)
    return { hours, minutes }
  }

  public getWorkingHoursText(): string {
    const start = this.config.standardStartTime
    const end = this.config.standardEndTime
    return `${start} - ${end} (${this.config.fullWorkingHours}h)`
  }

  public getConfigInfo(): {
    config: WorkTimeConfig
    lastFetchTime: number
    isLoading: boolean
    cacheAge: number
  } {
    return {
      config: { ...this.config },
      lastFetchTime: this.lastFetchTime,
      isLoading: this.isLoading,
      cacheAge: Date.now() - this.lastFetchTime,
    }
  }
}

// Export singleton instance
export const workTimeConfig = WorkTimeConfigManager.getInstance()

// Utility functions for easy access
export const getWorkConfig = async (forceRefresh = false) => workTimeConfig.getConfig(forceRefresh)
export const getWorkConfigSync = () => workTimeConfig.getConfigSync()
export const refreshWorkConfig = () => workTimeConfig.refreshConfig()

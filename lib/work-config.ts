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
  
  // Default configuration - Change these values as needed
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
  
    private constructor() {
      this.config = this.loadConfig()
    }
  
    public static getInstance(): WorkTimeConfigManager {
      if (!WorkTimeConfigManager.instance) {
        WorkTimeConfigManager.instance = new WorkTimeConfigManager()
      }
      return WorkTimeConfigManager.instance
    }
  
    private loadConfig(): WorkTimeConfig {
      if (typeof window !== "undefined") {
        const savedConfig = localStorage.getItem("workTimeConfig")
        if (savedConfig) {
          try {
            return { ...DEFAULT_WORK_CONFIG, ...JSON.parse(savedConfig) }
          } catch (error) {
            console.error("Error loading work config:", error)
          }
        }
      }
      return DEFAULT_WORK_CONFIG
    }
  
    public getConfig(): WorkTimeConfig {
      return { ...this.config }
    }
  
    public updateConfig(newConfig: Partial<WorkTimeConfig>): void {
      this.config = { ...this.config, ...newConfig }
      this.saveConfig()
    }
  
    private saveConfig(): void {
      if (typeof window !== "undefined") {
        localStorage.setItem("workTimeConfig", JSON.stringify(this.config))
      }
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
  }
  
  // Export singleton instance
  export const workTimeConfig = WorkTimeConfigManager.getInstance()
  
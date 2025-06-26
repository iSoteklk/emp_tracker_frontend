// Simplified Work Station Configuration - Single Main Office Only
export interface WorkStationLocation {
    latitude: number
    longitude: number
    radius: number // in meters
    address?: string
    name: string
  }
  
  export interface WorkStationConfig {
    mainOffice: WorkStationLocation
  }
  
  // Default main office configuration
  export const DEFAULT_MAIN_OFFICE: WorkStationLocation = {
    latitude: 6.84985016423255,
    longitude: 79.91988625396195,
    radius: 30,
    address: "Main Office Building, Colombo",
    name: "Main Office",
  }
  
  export const DEFAULT_WORK_STATION_CONFIG: WorkStationConfig = {
    mainOffice: DEFAULT_MAIN_OFFICE,
  }
  
  // Work Station Configuration Manager
  export class WorkStationConfigManager {
    private static instance: WorkStationConfigManager
    private config: WorkStationConfig
  
    private constructor() {
      this.config = this.loadConfig()
    }
  
    public static getInstance(): WorkStationConfigManager {
      if (!WorkStationConfigManager.instance) {
        WorkStationConfigManager.instance = new WorkStationConfigManager()
      }
      return WorkStationConfigManager.instance
    }
  
    private loadConfig(): WorkStationConfig {
      if (typeof window !== "undefined") {
        const savedConfig = localStorage.getItem("workStationConfig")
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig)
            return {
              mainOffice: { ...DEFAULT_MAIN_OFFICE, ...parsed.mainOffice },
            }
          } catch (error) {
            console.error("Error loading work station config:", error)
          }
        }
      }
      return DEFAULT_WORK_STATION_CONFIG
    }
  
    public getConfig(): WorkStationConfig {
      return { ...this.config }
    }
  
    public getMainOffice(): WorkStationLocation {
      return { ...this.config.mainOffice }
    }
  
    public updateMainOffice(updates: Partial<WorkStationLocation>): void {
      this.config.mainOffice = { ...this.config.mainOffice, ...updates }
      this.saveConfig()
    }
  
    public updateCoordinates(latitude: number, longitude: number): void {
      this.updateMainOffice({ latitude, longitude })
    }
  
    public updateRadius(radius: number): void {
      this.updateMainOffice({ radius })
    }
  
    private saveConfig(): void {
      if (typeof window !== "undefined") {
        localStorage.setItem("workStationConfig", JSON.stringify(this.config))
      }
    }
  
    // Helper method for geofencing
    public checkGeofence(
      userLat: number,
      userLng: number,
    ): {
      isWithinOffice: boolean
      distance: number
      office: WorkStationLocation
    } {
      const office = this.getMainOffice()
      const distance = this.calculateDistance(userLat, userLng, office.latitude, office.longitude)
  
      return {
        isWithinOffice: distance <= office.radius,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        office,
      }
    }
  
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371000 // Earth's radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c // Distance in meters
    }
  }
  
  // Export singleton instance
  export const workStationConfig = WorkStationConfigManager.getInstance()
  
  // Quick access functions for easy updates
  export const updateMainOfficeCoords = (lat: number, lng: number) => workStationConfig.updateCoordinates(lat, lng)
  export const updateOfficeRadius = (radius: number) => workStationConfig.updateRadius(radius)
  
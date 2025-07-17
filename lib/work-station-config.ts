// Dynamic Work Station Configuration - Fetches from API and matches user location
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

  // API Response interface for work locations
  interface WorkLocationAPIResponse {
    success: string
    data: {
      data: Array<{
        _id: string
        latitude: number
        longitude: number
        address: string
        radius: number
        name: string
        createdAt?: string
        updatedAt?: string
      }>
    }
  }
  
  // Placeholder configuration when no location is matched - will be replaced by API data
  const PLACEHOLDER_OFFICE: WorkStationLocation = {
    latitude: 0,
    longitude: 0,
    radius: 50,
    address: "No location configured",
    name: "Loading...",
  }
  
  export const INITIAL_WORK_STATION_CONFIG: WorkStationConfig = {
    mainOffice: PLACEHOLDER_OFFICE,
  }
  
  // Work Station Configuration Manager
  export class WorkStationConfigManager {
    private static instance: WorkStationConfigManager
    private config: WorkStationConfig
    private isLoading: boolean = false
    private lastFetchTime: number = 0
    private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
    private hasValidConfig: boolean = false
  
    private constructor() {
      this.config = this.loadConfig()
      // Try to fetch from API on initialization
      this.fetchConfigFromAPI()
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
            // Check if it's a valid config with real data (not placeholder)
            if (parsed.mainOffice && parsed.mainOffice.latitude !== 0 && parsed.mainOffice.longitude !== 0) {
              this.hasValidConfig = true
              return parsed
            }
          } catch (error) {
            console.error("Error loading work station config:", error)
          }
        }
      }
      return INITIAL_WORK_STATION_CONFIG
    }

    private async fetchConfigFromAPI(): Promise<void> {
      if (this.isLoading) return

      // Check if we have recent data
      const now = Date.now()
      if (now - this.lastFetchTime < this.CACHE_DURATION && this.hasValidConfig) {
        return
      }

      try {
        this.isLoading = true
        console.log("Fetching work locations from API...")

        // Get user location from localStorage to match with API locations
        const userLocationStr = localStorage.getItem("user")
        let userLocationName = ""
        if (userLocationStr) {
          try {
            const userData = JSON.parse(userLocationStr)
            userLocationName = userData.location || ""
          } catch (error) {
            console.error("Error parsing user data:", error)
          }
        }

        console.log("User location to match:", userLocationName)

        // Get token for API call
        const token = localStorage.getItem("token")
        if (!token) {
          console.log("No token found, cannot fetch locations")
          return
        }

        const response = await fetch("/api/work-locations/getall", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: WorkLocationAPIResponse = await response.json()
        console.log("Work locations API response:", data)

        if (data.success === "true" && data.data && data.data.data && Array.isArray(data.data.data)) {
          const locations = data.data.data
          console.log("Available locations:", locations.map(loc => loc.name))

          // Try to find matching location by name
          let matchedLocation = null
          if (userLocationName) {
            matchedLocation = locations.find(location => 
              location.name.toLowerCase() === userLocationName.toLowerCase()
            )
          }

          if (matchedLocation) {
            console.log("Found matching location:", matchedLocation)
            
            const apiConfig: WorkStationConfig = {
              mainOffice: {
                latitude: matchedLocation.latitude,
                longitude: matchedLocation.longitude,
                radius: matchedLocation.radius,
                address: matchedLocation.address,
                name: matchedLocation.name,
              }
            }

            this.config = apiConfig
            this.lastFetchTime = now
            this.hasValidConfig = true
            this.saveConfig()

            console.log("Work station configuration updated from API:", apiConfig)
            
            // Trigger events to notify components
            if (typeof window !== "undefined") {
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'workStationConfig',
                newValue: JSON.stringify(this.config),
                storageArea: localStorage
              }))
            }
          } else {
            console.log(`No matching location found for user location: "${userLocationName}"`)
            console.log("Available locations:", locations.map(loc => `"${loc.name}"`).join(", "))
            console.log("User will need to be assigned to a valid location")
            
            // Keep placeholder config but mark as invalid
            this.hasValidConfig = false
          }
        } else {
          console.warn("Invalid API response structure")
        }
      } catch (error) {
        console.error("Failed to fetch work locations from API:", error)
        console.log("Cannot load location configuration without API data")
        this.hasValidConfig = false
      } finally {
        this.isLoading = false
      }
    }

    public async refreshFromAPI(): Promise<void> {
      this.lastFetchTime = 0 // Force refresh
      this.hasValidConfig = false // Force re-validation
      await this.fetchConfigFromAPI()
    }
  
    public getConfig(): WorkStationConfig {
      return { ...this.config }
    }
  
    public getMainOffice(): WorkStationLocation {
      return { ...this.config.mainOffice }
    }

    public hasValidConfiguration(): boolean {
      return this.hasValidConfig
    }
  
    public updateMainOffice(updates: Partial<WorkStationLocation>): void {
      this.config.mainOffice = { ...this.config.mainOffice, ...updates }
      this.hasValidConfig = true
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
  export const refreshWorkStationConfig = () => workStationConfig.refreshFromAPI()
  export const hasValidWorkStationConfig = () => workStationConfig.hasValidConfiguration()
  
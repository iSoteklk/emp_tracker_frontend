"use client"

import { useState, useEffect, useCallback } from "react"
import { workStationConfig, type WorkStationLocation } from "@/lib/work-station-config"

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

export type LocationPermissionStatus = "unknown" | "granted" | "denied" | "blocked"

export interface LocationError {
  code: number
  message: string
  type: "permission" | "unavailable" | "timeout" | "unsupported" | "geofence"
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
  fetchAddress?: boolean
  autoRefreshOnClockIn?: boolean // New option to force refresh on clock in
}

export interface GeofenceResult {
  isWithinOffice: boolean
  distance: number
  office: WorkStationLocation
}

export interface UseLocationReturn {
  // State
  location: LocationData | null
  permissionStatus: LocationPermissionStatus
  isLoading: boolean
  error: LocationError | null
  geofenceResult: GeofenceResult | null

  // Actions
  getCurrentLocation: (forceRefresh?: boolean) => Promise<LocationData>
  checkPermissionStatus: () => Promise<LocationPermissionStatus>
  clearError: () => void
  refreshLocation: () => Promise<void>
  checkGeofence: (userLocation?: LocationData) => GeofenceResult | null

  // Utilities
  isLocationSupported: boolean
  isPermissionBlocked: boolean
  isWithinOffice: boolean
  getBrowserInstructions: () => {
    browser: string
    icon: string
    steps: string[]
  }
}

const DEFAULT_OPTIONS: Required<UseLocationOptions> = {
  enableHighAccuracy: true,
  timeout: 15000, // Increased timeout
  maximumAge: 30000, // Reduced max age for fresher location
  watchPosition: false,
  fetchAddress: true,
  autoRefreshOnClockIn: true,
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const [location, setLocation] = useState<LocationData | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>("unknown")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<LocationError | null>(null)
  const [geofenceResult, setGeofenceResult] = useState<GeofenceResult | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  // Check if geolocation is supported
  const isLocationSupported = typeof navigator !== "undefined" && "geolocation" in navigator

  // Check if permission is blocked
  const isPermissionBlocked = permissionStatus === "blocked"

  // Check if user is within office
  const isWithinOffice = geofenceResult?.isWithinOffice ?? false

  // Load saved location on mount (but don't rely on it for clock-in)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocation = localStorage.getItem("userLocation")
      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation)
          // Only use saved location if it's recent (less than 5 minutes old)
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
          if (parsedLocation.timestamp > fiveMinutesAgo) {
            setLocation(parsedLocation)
            const geofence = checkGeofenceInternal(parsedLocation)
            setGeofenceResult(geofence)
          } else {
            // Remove old location data
            localStorage.removeItem("userLocation")
          }
        } catch (error) {
          console.error("Error parsing saved location:", error)
          localStorage.removeItem("userLocation")
        }
      }
    }
  }, [])

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus()
  }, [])

  // Cleanup watch position on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const fetchAddressFromCoordinates = async (lat: number, lng: number): Promise<string | undefined> => {
    if (!config.fetchAddress) return undefined

    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      )
      const addressData = await response.json()
      return `${addressData.city}, ${addressData.principalSubdivision}, ${addressData.countryName}`
    } catch (error) {
      console.log("Could not fetch address:", error)
      return undefined
    }
  }

  const createLocationError = (geolocationError: GeolocationPositionError): LocationError => {
    let message = "Unable to retrieve your location"
    let type: LocationError["type"] = "unavailable"

    switch (geolocationError.code) {
      case geolocationError.PERMISSION_DENIED:
        message = "Location access has been blocked. Please enable location permissions to continue."
        type = "permission"
        break
      case geolocationError.POSITION_UNAVAILABLE:
        message = "Location information is unavailable. Please check your GPS settings."
        type = "unavailable"
        break
      case geolocationError.TIMEOUT:
        message = "Location request timed out. Please try again."
        type = "timeout"
        break
    }

    return {
      code: geolocationError.code,
      message,
      type,
    }
  }

  const checkGeofenceInternal = (userLocation: LocationData): GeofenceResult => {
    const geofenceCheck = workStationConfig.checkGeofence(userLocation.latitude, userLocation.longitude)

    return {
      isWithinOffice: geofenceCheck.isWithinOffice,
      distance: geofenceCheck.distance,
      office: geofenceCheck.office,
    }
  }

  const checkGeofence = useCallback(
    (userLocation?: LocationData): GeofenceResult | null => {
      const locationToCheck = userLocation || location
      if (!locationToCheck) return null

      return checkGeofenceInternal(locationToCheck)
    },
    [location],
  )

  const checkPermissionStatus = useCallback(async (): Promise<LocationPermissionStatus> => {
    if (!isLocationSupported) {
      setPermissionStatus("blocked")
      return "blocked"
    }

    try {
      // Check if Permissions API is supported
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "geolocation" })

        let status: LocationPermissionStatus
        switch (permission.state) {
          case "granted":
            status = "granted"
            break
          case "denied":
            status = "blocked"
            break
          case "prompt":
            status = "unknown"
            break
          default:
            status = "unknown"
        }

        setPermissionStatus(status)

        // Listen for permission changes
        permission.addEventListener("change", () => {
          const newStatus: LocationPermissionStatus =
            permission.state === "granted" ? "granted" : permission.state === "denied" ? "blocked" : "unknown"
          setPermissionStatus(newStatus)
        })

        return status
      } else {
        // Fallback: Try to get location to check permission
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissionStatus("granted")
              resolve("granted")
            },
            (error) => {
              const status = error.code === error.PERMISSION_DENIED ? "blocked" : "unknown"
              setPermissionStatus(status)
              resolve(status)
            },
            { timeout: 1000 },
          )
        })
      }
    } catch (error) {
      setPermissionStatus("unknown")
      return "unknown"
    }
  }, [isLocationSupported])

  const getCurrentLocation = useCallback(
    async (forceRefresh = false): Promise<LocationData> => {
      if (!isLocationSupported) {
        const error: LocationError = {
          code: 0,
          message: "Geolocation is not supported by this browser",
          type: "unsupported",
        }
        setError(error)
        throw new Error(error.message)
      }

      setIsLoading(true)
      setError(null)

      // Clear old location if forcing refresh or if location is old
      if (forceRefresh || (location && Date.now() - location.timestamp > 60000)) {
        setLocation(null)
        setGeofenceResult(null)
      }

      return new Promise((resolve, reject) => {
        const options: PositionOptions = {
          enableHighAccuracy: config.enableHighAccuracy,
          timeout: config.timeout,
          maximumAge: forceRefresh ? 0 : config.maximumAge, // Force fresh location if requested
        }

        console.log("Getting current location with options:", options)

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              console.log("Location obtained:", position.coords)

              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: Date.now(),
              }

              // Try to get address
              if (config.fetchAddress) {
                try {
                  locationData.address = await fetchAddressFromCoordinates(
                    locationData.latitude,
                    locationData.longitude,
                  )
                } catch (addressError) {
                  console.log("Could not fetch address, continuing without it")
                }
              }

              // Check geofence
              const geofence = checkGeofenceInternal(locationData)
              setGeofenceResult(geofence)

              console.log("Geofence check result:", geofence)

              // Check if user is within office
              if (!geofence.isWithinOffice) {
                const geofenceError: LocationError = {
                  code: 0,
                  message: `You are ${geofence.distance}m away from ${geofence.office.name}. Please get within ${geofence.office.radius}m to clock in.`,
                  type: "geofence",
                }
                setError(geofenceError)
                setIsLoading(false)

                // Still update location even if outside geofence
                setLocation(locationData)
                setPermissionStatus("granted")

                // Save to localStorage
                if (typeof window !== "undefined") {
                  localStorage.setItem("userLocation", JSON.stringify(locationData))
                }

                throw new Error(geofenceError.message)
              }

              // Update state
              setLocation(locationData)
              setPermissionStatus("granted")
              setIsLoading(false)

              // Save to localStorage
              if (typeof window !== "undefined") {
                localStorage.setItem("userLocation", JSON.stringify(locationData))
              }

              console.log("Location successfully updated and within geofence")
              resolve(locationData)
            } catch (error) {
              setIsLoading(false)
              if (error instanceof Error && error.message.includes("office")) {
                // Re-throw geofence errors
                throw error
              }
              const locationError: LocationError = {
                code: 0,
                message: "Failed to process location data",
                type: "unavailable",
              }
              setError(locationError)
              reject(new Error(locationError.message))
            }
          },
          (geolocationError) => {
            console.error("Geolocation error:", geolocationError)
            setIsLoading(false)
            const locationError = createLocationError(geolocationError)
            setError(locationError)

            // Update permission status
            if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
              setPermissionStatus("blocked")
            }

            reject(new Error(locationError.message))
          },
          options,
        )
      })
    },
    [isLocationSupported, location],
  )

  const refreshLocation = useCallback(async (): Promise<void> => {
    try {
      await getCurrentLocation(true) // Force refresh
    } catch (error) {
      // Error is already handled in getCurrentLocation
      console.error("Failed to refresh location:", error)
    }
  }, [getCurrentLocation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getBrowserInstructions = useCallback(() => {
    if (typeof navigator === "undefined") {
      return {
        browser: "Unknown Browser",
        icon: "🔒",
        steps: ["Please enable location permissions in your browser settings"],
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes("chrome")) {
      return {
        browser: "Chrome",
        icon: "🔒",
        steps: [
          "Click the lock icon (🔒) or location icon in the address bar",
          'Select "Site settings" or click on "Location"',
          'Change location permission from "Block" to "Allow"',
          "Refresh the page and try again",
        ],
      }
    } else if (userAgent.includes("firefox")) {
      return {
        browser: "Firefox",
        icon: "🛡️",
        steps: [
          "Click the shield icon or location icon in the address bar",
          'Click on "Connection secure" then "More information"',
          'Go to "Permissions" tab',
          'Find "Access your location" and select "Allow"',
          "Refresh the page and try again",
        ],
      }
    } else if (userAgent.includes("safari")) {
      return {
        browser: "Safari",
        icon: "⚙️",
        steps: [
          "Go to Safari menu > Preferences > Websites",
          'Click on "Location" in the left sidebar',
          'Find this website and change permission to "Allow"',
          "Refresh the page and try again",
        ],
      }
    } else if (userAgent.includes("edge")) {
      return {
        browser: "Edge",
        icon: "🔒",
        steps: [
          "Click the lock icon (🔒) in the address bar",
          'Click on "Permissions for this site"',
          'Change location permission from "Block" to "Allow"',
          "Refresh the page and try again",
        ],
      }
    } else {
      return {
        browser: "Your Browser",
        icon: "🔒",
        steps: [
          "Look for a location or lock icon in the address bar",
          "Click on it and find location permissions",
          'Change the setting from "Block" to "Allow"',
          "Refresh the page and try again",
        ],
      }
    }
  }, [])

  return {
    // State
    location,
    permissionStatus,
    isLoading,
    error,
    geofenceResult,

    // Actions
    getCurrentLocation,
    checkPermissionStatus,
    clearError,
    refreshLocation,
    checkGeofence,

    // Utilities
    isLocationSupported,
    isPermissionBlocked,
    isWithinOffice,
    getBrowserInstructions,
  }
}

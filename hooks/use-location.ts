"use client"

import { useState, useEffect, useCallback } from "react"

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
  workStationCoords?: {
    latitude: number
    longitude: number
  }
  geofenceRadius?: number // in meters
}

export interface GeofenceResult {
  isWithinGeofence: boolean
  distance: number
  workStationCoords: {
    latitude: number
    longitude: number
  }
  requiredRadius: number
}

export interface UseLocationReturn {
  // State
  location: LocationData | null
  permissionStatus: LocationPermissionStatus
  isLoading: boolean
  error: LocationError | null
  geofenceResult: GeofenceResult | null

  // Actions
  getCurrentLocation: () => Promise<LocationData>
  checkPermissionStatus: () => Promise<LocationPermissionStatus>
  clearError: () => void
  refreshLocation: () => Promise<void>
  checkGeofence: (userLocation?: LocationData) => GeofenceResult | null

  // Utilities
  isLocationSupported: boolean
  isPermissionBlocked: boolean
  isWithinWorkStation: boolean
  getBrowserInstructions: () => {
    browser: string
    icon: string
    steps: string[]
  }
}

const DEFAULT_OPTIONS: Required<UseLocationOptions> = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watchPosition: false,
  fetchAddress: true,
  workStationCoords: {
    latitude: 6.849760,
    longitude: 79.919754,
  },
  geofenceRadius: 15, // 15 meters
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in meters
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

  // Check if user is within work station
  const isWithinWorkStation = geofenceResult?.isWithinGeofence ?? false

  // Load saved location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocation = localStorage.getItem("userLocation")
      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation)
          setLocation(parsedLocation)
          // Check geofence for saved location
          const geofence = checkGeofenceInternal(parsedLocation)
          setGeofenceResult(geofence)
        } catch (error) {
          console.error("Error parsing saved location:", error)
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
        message = "Location information is unavailable"
        type = "unavailable"
        break
      case geolocationError.TIMEOUT:
        message = "Location request timed out. Please try again"
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
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      config.workStationCoords.latitude,
      config.workStationCoords.longitude,
    )

    return {
      isWithinGeofence: distance <= config.geofenceRadius,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
      workStationCoords: config.workStationCoords,
      requiredRadius: config.geofenceRadius,
    }
  }

  const checkGeofence = useCallback(
    (userLocation?: LocationData): GeofenceResult | null => {
      const locationToCheck = userLocation || location
      if (!locationToCheck) return null

      return checkGeofenceInternal(locationToCheck)
    },
    [location, config.workStationCoords, config.geofenceRadius],
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

  const getCurrentLocation = useCallback(async (): Promise<LocationData> => {
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

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge,
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now(),
            }

            // Try to get address
            if (config.fetchAddress) {
              locationData.address = await fetchAddressFromCoordinates(locationData.latitude, locationData.longitude)
            }

            // Check geofence
            const geofence = checkGeofenceInternal(locationData)
            setGeofenceResult(geofence)

            // Check if user is within work station
            if (!geofence.isWithinGeofence) {
              const geofenceError: LocationError = {
                code: 0,
                message: `You are ${geofence.distance}m away from the work station. Please get within ${geofence.requiredRadius}m to clock in.`,
                type: "geofence",
              }
              setError(geofenceError)
              setIsLoading(false)
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

            resolve(locationData)
          } catch (error) {
            setIsLoading(false)
            if (error instanceof Error && error.message.includes("work station")) {
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
  }, [isLocationSupported])

  const refreshLocation = useCallback(async (): Promise<void> => {
    try {
      await getCurrentLocation()
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

  // Start watching position if enabled
  useEffect(() => {
    if (config.watchPosition && isLocationSupported && permissionStatus === "granted") {
      const options: PositionOptions = {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge,
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          }

          if (config.fetchAddress) {
            locationData.address = await fetchAddressFromCoordinates(locationData.latitude, locationData.longitude)
          }

          // Check geofence for watched position
          const geofence = checkGeofenceInternal(locationData)
          setGeofenceResult(geofence)

          setLocation(locationData)

          if (typeof window !== "undefined") {
            localStorage.setItem("userLocation", JSON.stringify(locationData))
          }
        },
        (error) => {
          const locationError = createLocationError(error)
          setError(locationError)
        },
        options,
      )

      setWatchId(id)

      return () => {
        navigator.geolocation.clearWatch(id)
        setWatchId(null)
      }
    }
  }, [isLocationSupported, permissionStatus])

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
    isWithinWorkStation,
    getBrowserInstructions,
  }
}
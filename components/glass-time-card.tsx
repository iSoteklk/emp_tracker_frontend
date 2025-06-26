"use client"
import { useState, useEffect } from "react"
import { Play, Pause, Square, MapPin, X } from "lucide-react"
import { workTimeConfig } from "@/lib/work-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

interface GlassTimeCardProps {
  showSeconds?: boolean
  showTimezone?: boolean
}

export function GlassTimeCard(props: GlassTimeCardProps) {
  const config = workTimeConfig.getConfig()
  const { showSeconds = config.showSeconds, showTimezone = false } = props

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [timezoneName, setTimezoneName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)

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

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          }

          // Try to get address from coordinates (optional)
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locationData.latitude}&longitude=${locationData.longitude}&localityLanguage=en`,
            )
            const addressData = await response.json()
            locationData.address = `${addressData.city}, ${addressData.principalSubdivision}, ${addressData.countryName}`
          } catch (addressError) {
            console.log("Could not fetch address:", addressError)
            // Address is optional, so we continue without it
          }

          resolve(locationData)
        },
        (error) => {
          let errorMessage = "Unable to retrieve your location"

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "You have to allow the geolocation request to start the shift"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again"
              break
          }

          reject(new Error(errorMessage))
        },
        options,
      )
    })
  }

  const handleClockIn = async () => {
    setIsLoading(true)
    setError("")
    setLocationError("")

    try {
      // First, get the user's location
      setIsGettingLocation(true)
      const locationData = await getCurrentLocation()

      // Store location data
      localStorage.setItem("userLocation", JSON.stringify(locationData))

      console.log("Location obtained:", locationData)

      // Now proceed with clock in API call using our internal route
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please login first")
        setIsLoading(false)
        return
      }

      console.log("Attempting to clock in...")

      const response = await fetch("/api/shift/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: locationData,
        }),
      })

      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        const now = new Date()
        setStartTime(now)
        setIsTracking(true)
        setElapsedTime(0)
        setError("")
        console.log("Clock in successful:", data)
      } else {
        console.error("Clock in failed:", data)
        setError(data.message || data.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Location or clock-in error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Check if it's a location permission error
      if (errorMessage.includes("geolocation request")) {
        setLocationError(errorMessage)
        setShowLocationModal(true)
      } else {
        setError(`Error: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
      setIsGettingLocation(false)
    }
  }

  const handlePause = () => {
    setIsTracking(false)
  }

  const handleStop = () => {
    setIsTracking(false)
    setStartTime(null)
    setElapsedTime(0)
  }

  const handleCloseLocationModal = () => {
    setShowLocationModal(false)
    setLocationError("")
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
    return workTimeConfig.formatTime(date)
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

  // Use configuration for late detection
  const isLate = startTime && workTimeConfig.isLate(startTime)

  // Use configuration for overtime detection
  const workedHours = elapsedTime / 3600
  const isOvertime = workTimeConfig.isOvertime(workedHours)

  return (
    <>
      <div className="w-96 text-white bg-white/20 shadow-xl backdrop-blur-xl p-6 rounded-lg border border-white/10">
        <div className="flex flex-col gap-4 items-center">
          {/* Current Time */}
          <div className="text-center">
            <div className="text-sm opacity-80">{formatDate(currentTime)}</div>
            <div className="text-2xl font-bold tabular-nums">{formatTime(currentTime)}</div>
            {showTimezone && <div className="text-xs text-white/70">{timezoneName}</div>}
          </div>

          {/* Work Schedule Info */}
          <div className="text-center text-xs opacity-70">
            <div>Work Hours: {workTimeConfig.getWorkingHoursText()}</div>
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
              {isGettingLocation && (
                <div className="flex items-center gap-1 text-blue-300">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-xs">Getting Location...</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm max-w-full break-words">
                <div className="font-semibold mb-1">Error:</div>
                <div className="text-xs">{error}</div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-3">
              {!isTracking ? (
                <button
                  onClick={handleClockIn}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm">
                    {isLoading ? (isGettingLocation ? "Getting Location..." : "Clocking In...") : "Clock In"}
                  </span>
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
                <Square className="w-4 w-4" />
                <span className="text-sm">Stop</span>
              </button>
            </div>

            {/* Start Time Display */}
            {startTime && (
              <div className="mt-3 text-xs opacity-70">Clocked in at: {workTimeConfig.formatTime(startTime)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg">Location Required</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseLocationModal} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <MapPin className="h-4 w-4" />
                <AlertDescription className="font-medium">{locationError}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To start your shift, you need to allow location access. This helps us:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Verify your work location</li>
                  <li>• Track attendance accurately</li>
                  <li>• Ensure security compliance</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">To enable location access:</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Click the location icon in your browser's address bar</li>
                  <li>2. Select "Allow" for location permissions</li>
                  <li>3. Try clicking "Clock In" again</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCloseLocationModal} className="flex-1">
                  I'll Enable Location
                </Button>
                <Button variant="outline" onClick={handleCloseLocationModal} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
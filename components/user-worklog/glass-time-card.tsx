"use client"
import { useState, useEffect } from "react"
import { Play, Pause, Square, X, AlertTriangle, Navigation, Building } from "lucide-react"
import { workTimeConfig } from "@/lib/work-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocation } from "@/hooks/use-location"

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
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [clockInError, setClockInError] = useState("")
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showGeofenceModal, setShowGeofenceModal] = useState(false)

  // Use the location hook
  const {
    location,
    permissionStatus,
    isLoading: isGettingLocation,
    error: locationError,
    geofenceResult,
    getCurrentLocation,
    clearError,
    isPermissionBlocked,
    isWithinOffice,
    getBrowserInstructions,
  } = useLocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000,
    fetchAddress: true,
    autoRefreshOnClockIn: true,
  })

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

  const handleClockIn = async () => {
    setIsClockingIn(true)
    setClockInError("")
    clearError()

    try {
      console.log("Starting clock in process...")

      // Always get fresh location when clocking in
      const locationData = await getCurrentLocation(true) // Force refresh

      console.log("Fresh location obtained:", locationData)
      console.log("Geofence result:", geofenceResult)

      // Now proceed with clock in API call
      const token = localStorage.getItem("token")
      if (!token) {
        setClockInError("Please login first")
        return
      }

      console.log("Attempting to clock in with fresh location...")

      const response = await fetch("/api/shift/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: locationData,
          geofence: geofenceResult,
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
        setClockInError("")
        console.log("Clock in successful:", data)
      } else {
        console.error("Clock in failed:", data)
        setClockInError(data.message || data.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Location or clock-in error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Check if it's a location permission error
      if (locationError?.type === "permission" || isPermissionBlocked) {
        setShowLocationModal(true)
      } else if (locationError?.type === "geofence" || errorMessage.includes("office")) {
        setShowGeofenceModal(true)
      } else {
        setClockInError(`Error: ${errorMessage}`)
      }
    } finally {
      setIsClockingIn(false)
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
    clearError()
  }

  const handleCloseGeofenceModal = () => {
    setShowGeofenceModal(false)
    clearError()
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

  const isLoading = isClockingIn || isGettingLocation

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

          {/* Location Status Indicators */}
          <div className="flex flex-wrap justify-center gap-2">
            {isPermissionBlocked && (
              <Badge variant="destructive" className="gap-2">
                <AlertTriangle className="h-3 w-3" />
                Location Blocked
              </Badge>
            )}

            {isWithinOffice && geofenceResult && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 gap-2">
                <Building className="h-3 w-3" />
                At {geofenceResult.office.name}
              </Badge>
            )}

            {location && !isWithinOffice && geofenceResult && (
              <Badge variant="destructive" className="gap-2">
                <Navigation className="h-3 w-3" />
                {geofenceResult.distance}m from office
              </Badge>
            )}
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
            {clockInError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm max-w-full break-words">
                <div className="font-semibold mb-1">Error:</div>
                <div className="text-xs">{clockInError}</div>
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
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg">Location Access Blocked</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseLocationModal} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {locationError?.message || "Location access has been permanently blocked for this site."}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getBrowserInstructions().icon}</span>
                  <h3 className="font-semibold">How to Fix This in {getBrowserInstructions().browser}:</h3>
                </div>

                <ol className="space-y-2">
                  {getBrowserInstructions().steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
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

      {/* Geofence Modal */}
      {showGeofenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Get Closer to Office</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseGeofenceModal} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <Navigation className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {locationError?.message || "You need to be within the office area to clock in."}
                </AlertDescription>
              </Alert>

              {geofenceResult && (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Distance Information:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Current Distance:</span>
                        <span className="font-medium text-blue-900">{geofenceResult.distance}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Required Distance:</span>
                        <span className="font-medium text-blue-900">≤ {geofenceResult.office.radius}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Move Closer By:</span>
                        <span className="font-medium text-red-600">
                          {Math.max(0, geofenceResult.distance - geofenceResult.office.radius).toFixed(1)}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">Office Location:</h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>
                        <strong>{geofenceResult.office.name}</strong>
                      </div>
                      {geofenceResult.office.address && <div>{geofenceResult.office.address}</div>}
                      <div>
                        Coordinates: {geofenceResult.office.latitude.toFixed(6)},{" "}
                        {geofenceResult.office.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleClockIn} disabled={isLoading} className="flex-1 gap-2">
                  <Navigation className="h-4 w-4" />
                  {isLoading ? "Checking..." : "Try Again"}
                </Button>
                <Button variant="outline" onClick={handleCloseGeofenceModal} className="flex-1">
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

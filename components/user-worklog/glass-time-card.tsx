"use client"
import { useState, useEffect } from "react"
import { Play, Pause, Square, X, AlertTriangle, Navigation, Building, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLocation } from "@/hooks/use-location"
import { LocationPermissionModal } from "@/components/modals/location-permission-modal"
import { GeofenceModal } from "@/components/modals/geofence-modal"
import { ClockOutGeofenceModal } from "@/components/modals/clock-out-geofence-modal"
import { EarlyClockOutModal } from "@/components/modals/early-clock-out-modal"
import {
  formatElapsedTime,
  formatTime,
  formatDate,
  formatTimezone,
  calculateTimeDifference,
  isLateTime,
  isOvertimeHours,
  getWorkingHoursText,
} from "@/lib/date-time-utils"

interface GlassTimeCardProps {
  showSeconds?: boolean
  showTimezone?: boolean
}

export function GlassTimeCard(props: GlassTimeCardProps) {
  const { showSeconds = true, showTimezone = false } = props

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const [clockInError, setClockInError] = useState("")
  const [clockOutError, setClockOutError] = useState("")
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showGeofenceModal, setShowGeofenceModal] = useState(false)
  const [showClockOutGeofenceModal, setShowClockOutGeofenceModal] = useState(false)
  const [showEarlyClockOutModal, setShowEarlyClockOutModal] = useState(false)
  const [clockInNotes, setClockInNotes] = useState("Starting my shift")
  const [clockOutNotes, setClockOutNotes] = useState("Completed daily tasks")

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
    refreshLocation,
  } = useLocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000,
    fetchAddress: true,
    autoRefreshOnClockIn: true,
  })

  // Load saved timer state on mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem("timerState")
    if (savedTimerState) {
      try {
        const timerState = JSON.parse(savedTimerState)
        if (timerState.isTracking && timerState.startTime) {
          const savedStartTime = new Date(timerState.startTime)
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - savedStartTime.getTime()) / 1000)

          setIsTracking(true)
          setStartTime(savedStartTime)
          setElapsedTime(elapsed)
        }
      } catch (error) {
        console.error("Error loading timer state:", error)
        localStorage.removeItem("timerState")
      }
    }
  }, [])

  // Save timer state when it changes
  useEffect(() => {
    if (isTracking && startTime) {
      const timerState = {
        isTracking,
        startTime: startTime.toISOString(),
        elapsedTime,
      }
      localStorage.setItem("timerState", JSON.stringify(timerState))
    } else {
      localStorage.removeItem("timerState")
    }
  }, [isTracking, startTime, elapsedTime])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())

      if (isTracking && startTime) {
        const timeDiff = calculateTimeDifference(startTime)
        setElapsedTime(timeDiff.totalSeconds)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTracking, startTime])

  // Reset states when modals are closed
  const resetClockInState = () => {
    setIsClockingIn(false)
    setClockInError("")
    clearError()
  }

  const resetClockOutState = () => {
    setIsClockingOut(false)
    setClockOutError("")
    clearError()
  }

  const handleClockIn = async () => {
    setIsClockingIn(true)
    setClockInError("")
    clearError()

    try {
      // Always get fresh location when clocking in
      const locationData = await getCurrentLocation(true) // Force refresh

      // Now proceed with clock in API call
      const token = localStorage.getItem("token")
      if (!token) {
        setClockInError("Please login first")
        setIsClockingIn(false) // Reset button state
        return
      }

      const requestBody = {
        location: locationData,
        geofence: geofenceResult,
        notes: clockInNotes,
      }

      const response = await fetch("/api/shift/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok && data.success === "true") {
        // Use the clock-in time from the server response or current time
        const clockInTime = data.clockInTime ? new Date(data.clockInTime) : new Date()

        setStartTime(clockInTime)
        setIsTracking(true)
        setElapsedTime(0)
        setClockInError("")
        setIsClockingIn(false) // Reset button state

        // Show success message briefly
        setTimeout(() => {
          // You could add a success toast here if needed
        }, 1000)
      } else {
        setClockInError(data.message || data.error || `Server error: ${response.status}`)
        setIsClockingIn(false) // Reset button state
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Reset button state first
      setIsClockingIn(false)

      // Check if it's a location permission error
      if (locationError?.type === "permission" || isPermissionBlocked) {
        setShowLocationModal(true)
      } else if (locationError?.type === "geofence" || errorMessage.includes("office")) {
        setShowGeofenceModal(true)
      } else {
        setClockInError(`Error: ${errorMessage}`)
      }
    }
  }

  const handleClockOut = async () => {
    // Check if user has worked less than 8 hours (28,800 seconds)
    const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60 // 28,800 seconds

    if (elapsedTime < EIGHT_HOURS_IN_SECONDS) {
      setShowEarlyClockOutModal(true)
      return
    }

    // Proceed with normal clock out
    await performClockOut()
  }

  const performClockOut = async () => {
    setIsClockingOut(true)
    setClockOutError("")
    clearError()

    try {
      // Always get fresh location when clocking out
      const locationData = await getCurrentLocation(true) // Force refresh

      // Check if user is within office for clock out
      if (!geofenceResult?.isWithinOffice) {
        setIsClockingOut(false)
        setShowClockOutGeofenceModal(true)
        return
      }

      // Now proceed with clock out API call
      const token = localStorage.getItem("token")
      if (!token) {
        setClockOutError("Please login first")
        setIsClockingOut(false)
        return
      }

      const requestBody = {
        location: locationData,
        geofence: geofenceResult,
        notes: clockOutNotes,
      }

      const response = await fetch("/api/shift/clock-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok && data.success === "true") {
        // Successfully clocked out - stop the timer
        setIsTracking(false)
        setStartTime(null)
        setElapsedTime(0)
        setClockOutError("")
        setIsClockingOut(false)

        // Clear saved timer state
        localStorage.removeItem("timerState")

        // Show success message briefly
        setTimeout(() => {
          // You could add a success toast here if needed
        }, 1000)
      } else {
        setClockOutError(data.message || data.error || `Server error: ${response.status}`)
        setIsClockingOut(false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Reset button state first
      setIsClockingOut(false)

      // Check if it's a geofence error
      if (locationError?.type === "geofence" || errorMessage.includes("office")) {
        setShowClockOutGeofenceModal(true)
      } else {
        setClockOutError(`Error: ${errorMessage}`)
      }
    }
  }

  const handleConfirmEarlyClockOut = async () => {
    setShowEarlyClockOutModal(false)
    await performClockOut()
  }

  const handleCancelEarlyClockOut = () => {
    setShowEarlyClockOutModal(false)
  }

  const handlePause = () => {
    setIsTracking(false)
    // Keep the start time so we can resume
  }

  const handleResume = () => {
    setIsTracking(true)
  }

  const handleStop = () => {
    // For stop button, we need to clock out properly
    handleClockOut()
  }

  const handleRefresh = async () => {
    try {
      await refreshLocation()
    } catch (error) {
      console.error("Failed to refresh location:", error)
    }
  }

  const handleCloseLocationModal = () => {
    setShowLocationModal(false)
    resetClockInState() // Reset all states
  }

  const handleCloseGeofenceModal = () => {
    setShowGeofenceModal(false)
    resetClockInState() // Reset all states
  }

  const handleCloseClockOutGeofenceModal = () => {
    setShowClockOutGeofenceModal(false)
    resetClockOutState() // Reset all states
  }

  const handleRetryFromLocationModal = async () => {
    setShowLocationModal(false)
    // Small delay to allow modal to close
    setTimeout(() => {
      handleClockIn()
    }, 100)
  }

  const handleRetryFromGeofenceModal = async () => {
    setShowGeofenceModal(false)
    // Small delay to allow modal to close
    setTimeout(() => {
      handleClockIn()
    }, 100)
  }

  const handleRetryFromClockOutGeofenceModal = async () => {
    setShowClockOutGeofenceModal(false)
    // Small delay to allow modal to close
    setTimeout(() => {
      performClockOut()
    }, 100)
  }

  const clearClockInError = () => {
    setClockInError("")
  }

  const clearClockOutError = () => {
    setClockOutError("")
  }

  // Use utility functions for calculations
  const isLate = startTime && isLateTime(startTime)
  const workedHours = elapsedTime / 3600
  const isOvertime = isOvertimeHours(workedHours)

  const isLoading = isClockingIn || isClockingOut || isGettingLocation

  // Determine if clock-in button should be disabled
  const isClockInDisabled = isLoading || isTracking

  // Determine if stop button should be disabled
  const isStopDisabled = !startTime || isLoading

  // Calculate remaining time to complete 8 hours
  const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60
  const remainingTime = Math.max(0, EIGHT_HOURS_IN_SECONDS - elapsedTime)
  const hoursWorked = Math.floor(elapsedTime / 3600)
  const minutesWorked = Math.floor((elapsedTime % 3600) / 60)

  return (
    <>
      <div className="w-96 text-white bg-white/20 shadow-xl backdrop-blur-xl p-6 rounded-lg border border-white/10">
        <div className="flex flex-col gap-4 items-center">
          {/* Current Time */}
          <div className="text-center">
            <div className="text-sm opacity-80">{formatDate(currentTime, { includeWeekday: true })}</div>
            <div className="text-2xl font-bold tabular-nums">{formatTime(currentTime, { showSeconds })}</div>
            {showTimezone && <div className="text-xs text-white/70">{formatTimezone()}</div>}
          </div>

          {/* Work Schedule Info */}
          <div className="text-center text-xs opacity-70">
            <div>Work Hours: {getWorkingHoursText()}</div>
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
            <div className="text-4xl font-bold tabular-nums mb-4">{formatElapsedTime(elapsedTime, showSeconds)}</div>

            {/* Work Progress Info */}
            {startTime && elapsedTime < EIGHT_HOURS_IN_SECONDS && (
              <div className="mb-4 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-blue-200 text-xs">
                <div className="font-semibold">
                  Progress: {hoursWorked}h {minutesWorked}m / 8h
                </div>
                <div className="opacity-80">Remaining: {formatElapsedTime(remainingTime, false)}</div>
              </div>
            )}

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
              {isClockingOut && (
                <div className="flex items-center gap-1 text-orange-300">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                  <span className="text-xs">Clocking Out...</span>
                </div>
              )}
              {isTracking && !isClockingOut && (
                <div className="flex items-center gap-1 text-green-300">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs">Active</span>
                </div>
              )}
            </div>

            {/* Error Messages with Dismiss Button */}
            {clockInError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm max-w-full break-words relative">
                <button
                  onClick={clearClockInError}
                  className="absolute top-1 right-1 text-red-300 hover:text-red-100 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="font-semibold mb-1">Clock In Error:</div>
                <div className="text-xs pr-6">{clockInError}</div>
                <button onClick={clearClockInError} className="mt-2 text-xs text-red-300 hover:text-red-100 underline">
                  Try Again
                </button>
              </div>
            )}

            {clockOutError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm max-w-full break-words relative">
                <button
                  onClick={clearClockOutError}
                  className="absolute top-1 right-1 text-red-300 hover:text-red-100 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="font-semibold mb-1">Clock Out Error:</div>
                <div className="text-xs pr-6">{clockOutError}</div>
                <button onClick={clearClockOutError} className="mt-2 text-xs text-red-300 hover:text-red-100 underline">
                  Try Again
                </button>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-2">
              {!isTracking ? (
                <>
                  {!startTime ? (
                    <button
                      onClick={handleClockIn}
                      disabled={isClockInDisabled}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">
                        {isLoading ? (isGettingLocation ? "Getting Location..." : "Clocking In...") : "Clock In"}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleResume}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Resume</span>
                    </button>
                  )}
                </>
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
                className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isStopDisabled}
              >
                <Square className="w-4 w-4" />
                <span className="text-sm">{isClockingOut ? "Clocking Out..." : "Clock Out"}</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isGettingLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh location and geofence status"
              >
                <RefreshCw className={`w-4 h-4 ${isGettingLocation ? "animate-spin" : ""}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>

            {/* Start Time Display */}
            {startTime && (
              <div className="mt-3 text-xs opacity-70">
                Clocked in at: {formatTime(startTime)}
                {isLate && <span className="text-red-300 ml-2">(Late)</span>}
              </div>
            )}

            {/* Timer State Info */}
            {startTime && !isTracking && !isClockingOut && (
              <div className="mt-2 text-xs opacity-70 text-yellow-300">Timer paused - Click Resume to continue</div>
            )}
          </div>
        </div>
      </div>

      {/* Early Clock Out Confirmation Modal */}
      <EarlyClockOutModal
        isOpen={showEarlyClockOutModal}
        onClose={handleCancelEarlyClockOut}
        onConfirm={handleConfirmEarlyClockOut}
        elapsedTime={elapsedTime}
        isLoading={isClockingOut}
      />

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={handleCloseLocationModal}
        onRetry={handleRetryFromLocationModal}
        locationError={locationError}
        getBrowserInstructions={getBrowserInstructions}
      />

      {/* Clock In Geofence Modal */}
      <GeofenceModal
        isOpen={showGeofenceModal}
        onClose={handleCloseGeofenceModal}
        onRetry={handleRetryFromGeofenceModal}
        locationError={locationError}
        geofenceResult={geofenceResult}
        isLoading={isLoading}
      />

      {/* Clock Out Geofence Modal */}
      <ClockOutGeofenceModal
        isOpen={showClockOutGeofenceModal}
        onClose={handleCloseClockOutGeofenceModal}
        onRetry={handleRetryFromClockOutGeofenceModal}
        locationError={locationError}
        geofenceResult={geofenceResult}
        isLoading={isLoading}
      />
    </>
  )
}

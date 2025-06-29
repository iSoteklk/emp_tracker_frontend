"use client"
import { useState, useEffect } from "react"
import { Play, Square, X, AlertTriangle, Navigation, Building, RefreshCw } from "lucide-react"
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
  getTodayDateString,
} from "@/lib/date-time-utils"

interface GlassTimeCardProps {
  showSeconds?: boolean
  showTimezone?: boolean
}

interface ShiftData {
  _id: string
  email: string
  date: string
  clockInTime?: string
  clockOutTime?: string
  clockInLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  clockOutLocation?: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  totalHours: string
  status: "clocked-in" | "clocked-out"
  notes: string
  createdAt: string
  updatedAt: string
}

interface ShiftStatusResponse {
  success: string
  data: ShiftData[]
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

  // Shift status state
  const [shiftStatus, setShiftStatus] = useState<"loading" | "no-shift" | "clocked-in" | "clocked-out">("loading")
  const [shiftData, setShiftData] = useState<ShiftData | null>(null)
  const [isLoadingShiftStatus, setIsLoadingShiftStatus] = useState(true)

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

  // Fetch shift status on component mount
  useEffect(() => {
    fetchShiftStatus()
  }, [])

  // Load saved timer state on mount (only if clocked in)
  useEffect(() => {
    if (shiftStatus === "clocked-in" && shiftData) {
      // Calculate elapsed time from clock in time
      const clockInTime = new Date(shiftData.clockInTime!)
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - clockInTime.getTime()) / 1000)

      setIsTracking(true)
      setStartTime(clockInTime)
      setElapsedTime(elapsed)
    } else {
      // Clear any saved timer state if not clocked in
      setIsTracking(false)
      setStartTime(null)
      setElapsedTime(0)
      localStorage.removeItem("timerState")
    }
  }, [shiftStatus, shiftData])

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

  const fetchShiftStatus = async () => {
    setIsLoadingShiftStatus(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found")
        setShiftStatus("no-shift")
        setIsLoadingShiftStatus(false)
        return
      }

      const todayDate = getTodayDateString()
      console.log("Fetching shift status for date:", todayDate)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/me/date/${todayDate}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data: ShiftStatusResponse = await response.json()
      console.log("Shift status response:", data)

      if (response.ok && data.success === "true") {
        if (data.data && data.data.length > 0) {
          const shift = data.data[0]
          setShiftData(shift)
          setShiftStatus(shift.status === "clocked-in" ? "clocked-in" : "clocked-out")
        } else {
          // Empty data array means no shift for today
          setShiftStatus("no-shift")
          setShiftData(null)
        }
      } else {
        console.error("Failed to fetch shift status:", data)
        setShiftStatus("no-shift")
      }
    } catch (error) {
      console.error("Error fetching shift status:", error)
      setShiftStatus("no-shift")
    } finally {
      setIsLoadingShiftStatus(false)
    }
  }

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
        // Successfully clocked in - refresh shift status
        await fetchShiftStatus()
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
        // Successfully clocked out - refresh shift status
        await fetchShiftStatus()
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

  const handleRefresh = async () => {
    try {
      await refreshLocation()
      await fetchShiftStatus()
    } catch (error) {
      console.error("Failed to refresh:", error)
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

  const isLoading = isClockingIn || isClockingOut || isGettingLocation || isLoadingShiftStatus

  // Calculate remaining time to complete 8 hours
  const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60
  const remainingTime = Math.max(0, EIGHT_HOURS_IN_SECONDS - elapsedTime)
  const hoursWorked = Math.floor(elapsedTime / 3600)
  const minutesWorked = Math.floor((elapsedTime % 3600) / 60)

  // Render different content based on shift status
  const renderShiftContent = () => {
    if (isLoadingShiftStatus) {
      return (
        <div className="text-center">
          <div className="text-sm text-slate-600 mb-2">Loading shift status...</div>
          <div className="text-2xl font-bold tabular-nums mb-4 text-slate-700">--:--:--</div>
        </div>
      )
    }

    if (shiftStatus === "clocked-out") {
      return (
        <div className="text-center">
          <div className="text-sm text-slate-600 mb-2">Shift Status</div>
          <div className="text-xl font-bold mb-4 text-emerald-600">Your shift is over for today</div>
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            <div className="font-semibold">Shift Completed</div>
            {shiftData && (
              <div className="text-xs mt-1">
                Total Hours: {shiftData.totalHours}
                {shiftData.clockOutTime && <div>Clocked out at: {formatTime(new Date(shiftData.clockOutTime))}</div>}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (shiftStatus === "clocked-in") {
      return (
        <div className="text-center w-full">
          <div className="text-sm text-slate-600 mb-2">Active Shift</div>
          <div className="text-4xl font-bold tabular-nums mb-4 text-slate-800">
            {formatElapsedTime(elapsedTime, showSeconds)}
          </div>

          {/* Work Progress Info */}
          {elapsedTime < EIGHT_HOURS_IN_SECONDS && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <div className="font-semibold">
                Progress: {hoursWorked}h {minutesWorked}m / 8h
              </div>
              <div className="text-blue-600">Remaining: {formatElapsedTime(remainingTime, false)}</div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex justify-center gap-4 mb-4">
            {isLate && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-medium">Late</span>
              </div>
            )}
            {isOvertime && (
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium">Overtime</span>
              </div>
            )}
            {isGettingLocation && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium">Getting Location...</span>
              </div>
            )}
            {isClockingOut && (
              <div className="flex items-center gap-1 text-orange-600">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-xs font-medium">Clocking Out...</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium">Active</span>
            </div>
          </div>

          {/* Start Time Display */}
          {startTime && (
            <div className="mt-3 text-xs text-slate-600">
              Clocked in at: {formatTime(startTime)}
              {isLate && <span className="text-red-600 ml-2 font-medium">(Late)</span>}
            </div>
          )}
        </div>
      )
    }

    // Default case: no shift (show clock in option)
    return (
      <div className="text-center w-full">
        <div className="text-sm text-slate-600 mb-2">Ready to Start</div>
        <div className="text-4xl font-bold tabular-nums mb-4 text-slate-800">00:00:00</div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <div className="font-semibold">No active shift</div>
          <div className="text-xs text-blue-600">Click Clock In to start your shift</div>
        </div>
      </div>
    )
  }

  // Render control buttons based on shift status
  const renderControlButtons = () => {
    if (shiftStatus === "clocked-out") {
      // Only show refresh button when shift is completed
      return (
        <div className="flex justify-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isGettingLocation || isLoadingShiftStatus}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${isGettingLocation || isLoadingShiftStatus ? "animate-spin" : ""}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      )
    }

    if (shiftStatus === "clocked-in") {
      // Only show clock out and refresh buttons when clocked in
      return (
        <div className="flex justify-center gap-3">
          <button
            onClick={handleClockOut}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
            disabled={isClockingOut}
          >
            <Square className="w-4 h-4" />
            <span className="text-sm">{isClockingOut ? "Clocking Out..." : "Clock Out"}</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isGettingLocation || isLoadingShiftStatus}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
            title="Refresh location and status"
          >
            <RefreshCw className={`w-4 h-4 ${isGettingLocation || isLoadingShiftStatus ? "animate-spin" : ""}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      )
    }

    // Default case: no shift (show clock in and refresh buttons)
    return (
      <div className="flex justify-center gap-3">
        <button
          onClick={handleClockIn}
          disabled={isClockingIn || isLoadingShiftStatus}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
        >
          <Play className="w-4 h-4" />
          <span className="text-sm">
            {isClockingIn ? (isGettingLocation ? "Getting Location..." : "Clocking In...") : "Clock In"}
          </span>
        </button>

        <button
          onClick={handleRefresh}
          disabled={isGettingLocation || isLoadingShiftStatus}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
          title="Refresh location and status"
        >
          <RefreshCw className={`w-4 h-4 ${isGettingLocation || isLoadingShiftStatus ? "animate-spin" : ""}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="w-96 bg-gradient-to-br from-blue-50 to-sky-100 shadow-xl p-6 rounded-2xl border border-blue-200/50">
        <div className="flex flex-col gap-4 items-center">
          {/* Current Time */}
          <div className="text-center">
            <div className="text-sm text-slate-600 font-medium">
              {formatDate(currentTime, { includeWeekday: true })}
            </div>
            <div className="text-3xl font-bold tabular-nums text-slate-800">
              {formatTime(currentTime, { showSeconds })}
            </div>
            {showTimezone && <div className="text-xs text-slate-500">{formatTimezone()}</div>}
          </div>

          {/* Work Schedule Info */}
          <div className="text-center text-xs text-slate-600 bg-white/50 px-3 py-1 rounded-full">
            <div>Work Hours: {getWorkingHoursText()}</div>
          </div>

          {/* Location Status Indicators */}
          <div className="flex flex-wrap justify-center gap-2">
            {isPermissionBlocked && (
              <Badge variant="destructive" className="gap-2 bg-red-100 text-red-700 border-red-200">
                <AlertTriangle className="h-3 w-3" />
                Location Blocked
              </Badge>
            )}

            {isWithinOffice && geofenceResult && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-2">
                <Building className="h-3 w-3" />
                At {geofenceResult.office.name}
              </Badge>
            )}

            {location && !isWithinOffice && geofenceResult && (
              <Badge variant="destructive" className="gap-2 bg-orange-100 text-orange-700 border-orange-200">
                <Navigation className="h-3 w-3" />
                {geofenceResult.distance}m from office
              </Badge>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>

          {/* Shift Content */}
          {renderShiftContent()}

          {/* Error Messages with Dismiss Button */}
          {clockInError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-full break-words relative">
              <button
                onClick={clearClockInError}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="font-semibold mb-1">Clock In Error:</div>
              <div className="text-xs pr-6">{clockInError}</div>
              <button
                onClick={clearClockInError}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {clockOutError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-full break-words relative">
              <button
                onClick={clearClockOutError}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="font-semibold mb-1">Clock Out Error:</div>
              <div className="text-xs pr-6">{clockOutError}</div>
              <button
                onClick={clearClockOutError}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Control Buttons */}
          {renderControlButtons()}
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
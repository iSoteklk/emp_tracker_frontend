"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, RefreshCw, CheckCircle, AlertTriangle, Building } from "lucide-react"
import { useLocation } from "@/hooks/use-location"
import { workStationConfig } from "@/lib/work-station-config"
import { useState, useEffect } from "react"

interface GeofenceStatusProps {
  showRefresh?: boolean
}

export function GeofenceStatus({ showRefresh = false }: GeofenceStatusProps) {
  const { location, geofenceResult, isLoading, isWithinOffice, refreshLocation } = useLocation()
  const [workStationOffice, setWorkStationOffice] = useState(workStationConfig.getMainOffice())
  const [hasValidConfig, setHasValidConfig] = useState(workStationConfig.hasValidConfiguration())

  // Update work station office info when component mounts or configuration changes
  useEffect(() => {
    const updateOfficeInfo = () => {
      const newOfficeInfo = workStationConfig.getMainOffice()
      const isValid = workStationConfig.hasValidConfiguration()
      console.log("🏢 GeofenceStatus: Updating office info:", newOfficeInfo)
      console.log("✅ GeofenceStatus: Config valid:", isValid)
      setWorkStationOffice(newOfficeInfo)
      setHasValidConfig(isValid)
    }
    
    updateOfficeInfo()
    
    // Listen for storage changes in case configuration is updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "workStationConfig") {
        console.log("🔄 GeofenceStatus: Work station config changed, updating...")
        updateOfficeInfo()
      }
    }
    
    // Listen for custom events as well
    const handleConfigUpdate = () => {
      console.log("🔄 GeofenceStatus: Custom config update event received")
      updateOfficeInfo()
    }
    
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("workStationConfigUpdated", handleConfigUpdate)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("workStationConfigUpdated", handleConfigUpdate)
    }
  }, [])

  const getStatusIcon = () => {
    if (!hasValidConfig) return <MapPin className="h-5 w-5 text-gray-500" />
    if (!location) return <MapPin className="h-5 w-5 text-gray-500" />
    if (isWithinOffice) return <CheckCircle className="h-5 w-5 text-green-600" />
    return <AlertTriangle className="h-5 w-5 text-orange-600" />
  }

  const getStatusBadge = () => {
    if (!hasValidConfig) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">No Location Assigned</Badge>
    }
    if (!location) {
      return <Badge variant="outline">No Location</Badge>
    }
    if (isWithinOffice && geofenceResult) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          At {geofenceResult.office.name}
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Outside {workStationOffice.name}
      </Badge>
    )
  }

  // Show loading/configuration message if no valid config
  if (!hasValidConfig) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Work Location Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            {getStatusBadge()}
          </div>

          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-800">
              <div className="font-medium mb-1">⚠️ No Work Location Assigned</div>
              <div className="text-xs">
                Please contact your administrator to assign you to a work location.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Work Location Status
          </CardTitle>
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLocation}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Check
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {geofenceResult && (
          <div className="space-y-3">
            {/* Current Status */}
            {isWithinOffice ? (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">Currently At {geofenceResult.office.name}:</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div className="font-medium">{geofenceResult.office.name}</div>
                  <div>
                    Distance: {geofenceResult.distance}m (within {geofenceResult.office.radius}m radius)
                  </div>
                  {geofenceResult.office.address && <div className="text-xs">{geofenceResult.office.address}</div>}
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-800 mb-2">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-medium">Distance to {geofenceResult.office.name}:</span>
                </div>
                <div className="text-sm text-orange-700 space-y-1">
                  <div className="font-medium">{geofenceResult.office.name}</div>
                  <div>Current Distance: {geofenceResult.distance}m</div>
                  <div>Required: ≤ {geofenceResult.office.radius}m</div>
                  <div className="text-red-600 font-medium">
                    Move {Math.max(0, geofenceResult.distance - geofenceResult.office.radius).toFixed(1)}m closer to
                    clock in
                  </div>
                </div>
              </div>
            )}

            {/* Work Location Info */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-2">Work Location Information:</div>
              <div className="space-y-1 text-sm text-blue-700">
                <div>
                  <strong>Name:</strong> {geofenceResult.office.name}
                </div>
                {geofenceResult.office.address && (
                  <div>
                    <strong>Address:</strong> {geofenceResult.office.address}
                  </div>
                )}
                <div>
                  <strong>Geofence Radius:</strong> {geofenceResult.office.radius} meters
                </div>
              </div>
            </div>
          </div>
        )}

        {!location && (
          <div className="text-center text-muted-foreground text-sm">
            Location will be checked when you attempt to clock in
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw, Info, Building2 } from "lucide-react"
import { useLocation } from "@/hooks/use-location"
import { workStationConfig } from "@/lib/work-station-config"
import { useState, useEffect } from "react"

interface LocationDisplayProps {
  showRefresh?: boolean
}

export function LocationDisplay({ showRefresh = false }: LocationDisplayProps) {
  const { location, isLoading, refreshLocation, geofenceResult } = useLocation({
    fetchAddress: true,
  })

  const [workStationOffice, setWorkStationOffice] = useState(workStationConfig.getMainOffice())
  const [hasValidConfig, setHasValidConfig] = useState(workStationConfig.hasValidConfiguration())

  // Update work station office info when component mounts or configuration changes
  useEffect(() => {
    const updateOfficeInfo = () => {
      const newOfficeInfo = workStationConfig.getMainOffice()
      const isValid = workStationConfig.hasValidConfiguration()
      console.log("📍 LocationDisplay: Updating office info:", newOfficeInfo)
      console.log("✅ LocationDisplay: Config valid:", isValid)
      setWorkStationOffice(newOfficeInfo)
      setHasValidConfig(isValid)
    }
    
    updateOfficeInfo()
    
    // Listen for storage changes in case configuration is updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "workStationConfig") {
        console.log("🔄 LocationDisplay: Work station config changed, updating...")
        updateOfficeInfo()
      }
    }
    
    // Listen for custom events as well
    const handleConfigUpdate = () => {
      console.log("🔄 LocationDisplay: Custom config update event received")
      updateOfficeInfo()
    }
    
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("workStationConfigUpdated", handleConfigUpdate)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("workStationConfigUpdated", handleConfigUpdate)
    }
  }, [])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  // Show configuration error if no valid config
  if (!hasValidConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Configuration Error */}
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">No Work Location Assigned</span>
              </div>
              <div className="text-sm text-orange-700">
                <div className="font-medium">Contact your administrator</div>
                <div className="text-orange-600 text-xs mt-1">
                  You need to be assigned to a work location before you can clock in.
                </div>
              </div>
            </div>

            {/* Current Location Status */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <span className="text-sm">Location tracking is disabled until work location is assigned</span>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Setup Required
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Work Station Configuration */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Assigned Work Location</span>
              </div>
              <div className="text-sm text-blue-700">
                <div className="font-medium">{workStationOffice.name}</div>
                {workStationOffice.address && (
                  <div className="text-blue-600">{workStationOffice.address}</div>
                )}
                <div className="text-blue-600 mt-1">
                  Geofence: {workStationOffice.radius}m radius
                </div>
              </div>
            </div>

            {/* Current Location Status */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <span className="text-sm">Location will be requested when you clock in</span>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Ready to Track
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Status
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshLocation}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Work Station Configuration */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Assigned Work Location</span>
            </div>
            <div className="text-sm text-blue-700">
              <div className="font-medium">{workStationOffice.name}</div>
              {workStationOffice.address && (
                <div className="text-blue-600">{workStationOffice.address}</div>
              )}
              <div className="text-blue-600 mt-1">
                Geofence: {workStationOffice.radius}m radius
              </div>
            </div>
          </div>

          {/* Current Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Location</span>
              {geofenceResult && (
                <Badge 
                  variant={geofenceResult.isWithinOffice ? "default" : "destructive"}
                  className={geofenceResult.isWithinOffice ? "bg-green-500" : ""}
                >
                  {geofenceResult.isWithinOffice ? `Within ${geofenceResult.office.name}` : `${geofenceResult.distance}m away`}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div>📍 {formatCoordinates(location.latitude, location.longitude)}</div>
              {location.address && <div>📍 {location.address}</div>}
              <div>🎯 Accuracy: ±{location.accuracy}m</div>
              <div>🕒 {formatTimestamp(location.timestamp)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

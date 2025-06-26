"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, RefreshCw, CheckCircle, AlertTriangle, Building } from "lucide-react"
import { useLocation } from "@/hooks/use-location"

interface GeofenceStatusProps {
  showRefresh?: boolean
}

export function GeofenceStatus({ showRefresh = false }: GeofenceStatusProps) {
  const { location, geofenceResult, isLoading, isWithinOffice, refreshLocation } = useLocation()

  const getStatusIcon = () => {
    if (!location) return <MapPin className="h-5 w-5 text-gray-500" />
    if (isWithinOffice) return <CheckCircle className="h-5 w-5 text-green-600" />
    return <AlertTriangle className="h-5 w-5 text-orange-600" />
  }

  const getStatusBadge = () => {
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
        Outside Office
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Office Proximity
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
                  <span className="text-sm font-medium">Currently At Office:</span>
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
                  <span className="text-sm font-medium">Distance to Office:</span>
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

            {/* Office Info */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-2">Office Information:</div>
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

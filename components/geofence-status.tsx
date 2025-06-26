"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { useLocation } from "@/hooks/use-location"

interface GeofenceStatusProps {
  showRefresh?: boolean
}

export function GeofenceStatus({ showRefresh = false }: GeofenceStatusProps) {
  const { location, geofenceResult, isLoading, isWithinWorkStation, refreshLocation } = useLocation({
    workStationCoords: {
      latitude: 6.849659,
      longitude: 79.920077,
    },
    geofenceRadius: 15,
  })

  const getStatusIcon = () => {
    if (!location) return <MapPin className="h-5 w-5 text-gray-500" />
    if (isWithinWorkStation) return <CheckCircle className="h-5 w-5 text-green-600" />
    return <AlertTriangle className="h-5 w-5 text-orange-600" />
  }

  const getStatusBadge = () => {
    if (!location) {
      return <Badge variant="outline">No Location</Badge>
    }
    if (isWithinWorkStation) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Within Work Station
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Outside Work Station
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Work Station Proximity
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Current Distance</div>
                <div className="font-semibold text-lg">{geofenceResult.distance}m</div>
              </div>
              <div>
                <div className="text-muted-foreground">Required Distance</div>
                <div className="font-semibold text-lg">≤ {geofenceResult.requiredRadius}m</div>
              </div>
            </div>

            {!isWithinWorkStation && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-800">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Move {Math.max(0, geofenceResult.distance - geofenceResult.requiredRadius).toFixed(1)}m closer to
                    clock in
                  </span>
                </div>
              </div>
            )}

            {isWithinWorkStation && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">You're within the work station area. Ready to clock in!</span>
                </div>
              </div>
            )}
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
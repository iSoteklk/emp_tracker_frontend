"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw, Info } from "lucide-react"
import { useLocation } from "@/hooks/use-location"

interface LocationDisplayProps {
  showRefresh?: boolean
}

export function LocationDisplay({ showRefresh = false }: LocationDisplayProps) {
  const { location, isLoading, refreshLocation } = useLocation({
    fetchAddress: true,
  })

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
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
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Info className="h-4 w-4" />
              <span className="text-sm">Location will be requested when you clock in</span>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Ready to Track
            </Badge>
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
            <MapPin className="h-5 w-5" />
            Current Location
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
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Location Active
          </Badge>
          <span className="text-sm text-muted-foreground">Accuracy: ±{Math.round(location.accuracy)}m</span>
        </div>

        {location.address && (
          <div>
            <div className="text-sm font-medium">Address</div>
            <div className="text-sm text-muted-foreground">{location.address}</div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium">Coordinates</div>
          <div className="text-sm text-muted-foreground font-mono">
            {formatCoordinates(location.latitude, location.longitude)}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Last Updated</div>
          <div className="text-sm text-muted-foreground">{formatTimestamp(location.timestamp)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

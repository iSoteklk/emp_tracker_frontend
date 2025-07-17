"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Navigation, X } from "lucide-react"
import type { LocationError, GeofenceResult } from "@/hooks/use-location"

interface GeofenceModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  locationError: LocationError | null
  geofenceResult: GeofenceResult | null
  isLoading: boolean
}

export function GeofenceModal({
  isOpen,
  onClose,
  onRetry,
  locationError,
  geofenceResult,
  isLoading,
}: GeofenceModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">
                Get Closer to {geofenceResult?.office.name || "Work Location"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <Navigation className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {locationError?.message || `You need to be within ${geofenceResult?.office.name || "the work location"} area to clock in.`}
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
            <Button onClick={onRetry} disabled={isLoading} className="flex-1 gap-2">
              <Navigation className="h-4 w-4" />
              {isLoading ? "Checking..." : "Try Again"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

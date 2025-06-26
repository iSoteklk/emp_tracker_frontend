"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw, Info } from "lucide-react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

interface LocationDisplayProps {
  showRefresh?: boolean
  onLocationUpdate?: (location: LocationData) => void
}

export function LocationDisplay({ showRefresh = false, onLocationUpdate }: LocationDisplayProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation")

    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation))
      } catch (error) {
        console.error("Error parsing saved location:", error)
      }
    }
  }, [])

  const refreshLocation = async () => {
    setIsRefreshing(true)
    setError("")

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      }

      // Try to get address
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locationData.latitude}&longitude=${locationData.longitude}&localityLanguage=en`,
        )
        const addressData = await response.json()
        locationData.address = `${addressData.city}, ${addressData.principalSubdivision}, ${addressData.countryName}`
      } catch (addressError) {
        console.log("Could not fetch address:", addressError)
      }

      setLocation(locationData)
      localStorage.setItem("userLocation", JSON.stringify(locationData))

      onLocationUpdate?.(locationData)
    } catch (error) {
      setError("Failed to get current location")
    } finally {
      setIsRefreshing(false)
    }
  }

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
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
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

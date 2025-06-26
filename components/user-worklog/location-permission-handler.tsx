"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface LocationPermissionHandlerProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export function LocationPermissionHandler({ onPermissionGranted, onPermissionDenied }: LocationPermissionHandlerProps) {
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown")
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    checkLocationPermission()
  }, [])

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState("denied")
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: "geolocation" })
      setPermissionState(permission.state)

      if (permission.state === "granted") {
        onPermissionGranted?.()
      } else if (permission.state === "denied") {
        onPermissionDenied?.()
      }

      permission.addEventListener("change", () => {
        setPermissionState(permission.state)
        if (permission.state === "granted") {
          onPermissionGranted?.()
        } else if (permission.state === "denied") {
          onPermissionDenied?.()
        }
      })
    } catch (error) {
      console.log("Permission API not supported")
      setPermissionState("prompt")
    }
  }

  const requestLocationPermission = async () => {
    setIsRequesting(true)

    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      setPermissionState("granted")
      onPermissionGranted?.()
    } catch (error) {
      setPermissionState("denied")
      onPermissionDenied?.()
    } finally {
      setIsRequesting(false)
    }
  }

  const getPermissionIcon = () => {
    switch (permissionState) {
      case "granted":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "denied":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "prompt":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />
    }
  }

  const getPermissionMessage = () => {
    switch (permissionState) {
      case "granted":
        return {
          title: "Location Access Granted",
          description: "Your location will be captured when you clock in.",
          variant: "default" as const,
        }
      case "denied":
        return {
          title: "Location Access Denied",
          description: "Please enable location access in your browser settings to use clock-in functionality.",
          variant: "destructive" as const,
        }
      case "prompt":
        return {
          title: "Location Permission Required",
          description: "We need access to your location to record where you clock in from.",
          variant: "default" as const,
        }
      default:
        return {
          title: "Checking Location Permissions",
          description: "Please wait while we check your location settings.",
          variant: "default" as const,
        }
    }
  }

  if (permissionState === "granted") {
    return null // Don't show anything if permission is already granted
  }

  const message = getPermissionMessage()

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPermissionIcon()}
          Location Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant={message.variant}>
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>{message.title}</strong>
                <p className="mt-1">{message.description}</p>
              </div>

              {permissionState === "prompt" && (
                <Button onClick={requestLocationPermission} disabled={isRequesting} className="w-full">
                  {isRequesting ? "Requesting Permission..." : "Grant Location Access"}
                </Button>
              )}

              {permissionState === "denied" && (
                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>To enable location access:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Click the location icon in your browser's address bar</li>
                    <li>Select "Allow" for location access</li>
                    <li>Refresh the page</li>
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

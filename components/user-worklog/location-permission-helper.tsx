"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings, HelpCircle } from "lucide-react"
import { useLocation } from "@/hooks/use-location"

interface LocationPermissionHelperProps {
  onPermissionChange?: (status: "granted" | "denied" | "blocked" | "unknown") => void
}

export function LocationPermissionHelper({ onPermissionChange }: LocationPermissionHelperProps) {
  const [showHelp, setShowHelp] = useState(false)

  const { permissionStatus, isLoading, checkPermissionStatus, isLocationSupported, getBrowserInstructions } =
    useLocation()

  // Notify parent of permission changes
  React.useEffect(() => {
    onPermissionChange?.(permissionStatus)
  }, [permissionStatus, onPermissionChange])

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case "granted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "denied":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <HelpCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = () => {
    if (!isLocationSupported) {
      return <Badge variant="destructive">Not Supported</Badge>
    }

    switch (permissionStatus) {
      case "granted":
        return <Badge className="bg-green-100 text-green-800">Location Allowed</Badge>
      case "blocked":
        return <Badge variant="destructive">Location Blocked</Badge>
      case "denied":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Permission Needed
          </Badge>
        )
      default:
        return <Badge variant="outline">Checking...</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Permission Status
          </CardTitle>
          <Button variant="outline" size="sm" onClick={checkPermissionStatus} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Current Status:</span>
          </div>
          {getStatusBadge()}
        </div>

        {!isLocationSupported && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Geolocation is not supported by this browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        )}

        {permissionStatus === "blocked" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Location access has been blocked. You need to manually enable it in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {(permissionStatus === "blocked" || permissionStatus === "denied") && (
          <div className="space-y-3">
            <Button variant="outline" onClick={() => setShowHelp(!showHelp)} className="w-full gap-2">
              <Settings className="h-4 w-4" />
              {showHelp ? "Hide" : "Show"} Fix Instructions
            </Button>

            {showHelp && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getBrowserInstructions().icon}</span>
                  <h3 className="font-semibold text-blue-900">Fix for {getBrowserInstructions().browser}:</h3>
                </div>

                <ol className="space-y-2">
                  {getBrowserInstructions().steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-blue-700">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Alternative:</strong> Try opening this page in an incognito/private window, or use a
                    different browser if the problem persists.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {permissionStatus === "granted" && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">✅ Location access is enabled. You can now clock in successfully!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

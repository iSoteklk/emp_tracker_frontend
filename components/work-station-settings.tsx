"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { workStationConfig, type WorkStationConfig } from "@/lib/work-station-config"
import { MapPin, Save, RotateCcw } from "lucide-react"

interface WorkStationSettingsProps {
  onConfigUpdate?: () => void
}

export function WorkStationSettings({ onConfigUpdate }: WorkStationSettingsProps) {
  const [config, setConfig] = useState<WorkStationConfig>(workStationConfig.getConfig())
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const currentConfig = workStationConfig.getConfig()
    setConfig(currentConfig)
  }, [])

  const handleMainOfficeChange = (key: keyof typeof config.mainOffice, value: any) => {
    setConfig((prev) => ({
      ...prev,
      mainOffice: { ...prev.mainOffice, [key]: value },
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    workStationConfig.updateMainOffice(config.mainOffice)
    setHasChanges(false)
    onConfigUpdate?.()
  }

  const handleReset = () => {
    const defaultConfig = workStationConfig.getConfig()
    setConfig(defaultConfig)
    setHasChanges(false)
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <CardTitle>Main Office Location</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Configure the main office location and geofencing settings</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Office Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Office Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="officeName">Office Name</Label>
              <Input
                id="officeName"
                value={config.mainOffice.name}
                onChange={(e) => handleMainOfficeChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeAddress">Office Address</Label>
              <Input
                id="officeAddress"
                value={config.mainOffice.address || ""}
                onChange={(e) => handleMainOfficeChange("address", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={config.mainOffice.latitude}
                onChange={(e) => handleMainOfficeChange("latitude", Number.parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={config.mainOffice.longitude}
                onChange={(e) => handleMainOfficeChange("longitude", Number.parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="1000"
                value={config.mainOffice.radius}
                onChange={(e) => handleMainOfficeChange("radius", Number.parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Coordinates:</strong>{" "}
              {formatCoordinates(config.mainOffice.latitude, config.mainOffice.longitude)}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Geofence Radius:</strong> {config.mainOffice.radius} meters
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={!hasChanges} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {hasChanges && (
          <Alert>
            <AlertDescription>You have unsaved changes. Click "Save Changes" to apply them.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

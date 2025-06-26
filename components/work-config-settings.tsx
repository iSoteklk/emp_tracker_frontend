"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { workTimeConfig, type WorkTimeConfig } from "@/lib/work-config"
import { Clock, Save, RotateCcw } from "lucide-react"

interface WorkConfigSettingsProps {
  onConfigUpdate?: () => void
}

export function WorkConfigSettings({ onConfigUpdate }: WorkConfigSettingsProps) {
  const [config, setConfig] = useState<WorkTimeConfig>(workTimeConfig.getConfig())
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const currentConfig = workTimeConfig.getConfig()
    setConfig(currentConfig)
  }, [])

  const handleConfigChange = (key: keyof WorkTimeConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    workTimeConfig.updateConfig(config)
    setHasChanges(false)
    onConfigUpdate?.()
  }

  const handleReset = () => {
    const defaultConfig = workTimeConfig.getConfig()
    setConfig(defaultConfig)
    setHasChanges(false)
  }

  const weekDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Work Time Configuration</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure standard work hours, break times, and overtime settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Standard Work Hours */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Standard Work Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={config.standardStartTime}
                onChange={(e) => handleConfigChange("standardStartTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={config.standardEndTime}
                onChange={(e) => handleConfigChange("standardEndTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHours">Full Working Hours</Label>
              <Input
                id="workingHours"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={config.fullWorkingHours}
                onChange={(e) => handleConfigChange("fullWorkingHours", Number.parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Schedule:</strong> {workTimeConfig.getWorkingHoursText()}
            </p>
          </div>
        </div>

        <Separator />

        {/* Break Times */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Break Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lunchBreak">Lunch Break (minutes)</Label>
              <Input
                id="lunchBreak"
                type="number"
                min="0"
                max="120"
                value={config.lunchBreakDuration}
                onChange={(e) => handleConfigChange("lunchBreakDuration", Number.parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortBreak">Short Break (minutes)</Label>
              <Input
                id="shortBreak"
                type="number"
                min="0"
                max="60"
                value={config.shortBreakDuration}
                onChange={(e) => handleConfigChange("shortBreakDuration", Number.parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Late and Overtime Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Late & Overtime Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lateThreshold">Late Threshold (minutes after start)</Label>
              <Input
                id="lateThreshold"
                type="number"
                min="0"
                max="60"
                value={config.lateThresholdMinutes}
                onChange={(e) => handleConfigChange("lateThresholdMinutes", Number.parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtimeAfter">Overtime After (hours)</Label>
              <Input
                id="overtimeAfter"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={config.overtimeAfterHours}
                onChange={(e) => handleConfigChange("overtimeAfterHours", Number.parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Weekend Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Weekend Days</h3>
          <div className="flex flex-wrap gap-2">
            {weekDayNames.map((day, index) => (
              <Badge
                key={index}
                variant={config.weekendDays.includes(index) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const newWeekendDays = config.weekendDays.includes(index)
                    ? config.weekendDays.filter((d) => d !== index)
                    : [...config.weekendDays, index]
                  handleConfigChange("weekendDays", newWeekendDays)
                }}
              >
                {day}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Display Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>24-Hour Format</Label>
                <p className="text-sm text-muted-foreground">Use 24-hour time format instead of AM/PM</p>
              </div>
              <Switch
                checked={config.use24HourFormat}
                onCheckedChange={(checked) => handleConfigChange("use24HourFormat", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Seconds</Label>
                <p className="text-sm text-muted-foreground">Display seconds in time format</p>
              </div>
              <Switch
                checked={config.showSeconds}
                onCheckedChange={(checked) => handleConfigChange("showSeconds", checked)}
              />
            </div>
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
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">You have unsaved changes. Click "Save Changes" to apply them.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Clock, Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

interface WorkConfigData {
  name: string
  standardStartTime: string
  standardEndTime: string
  fullWorkingHours: number
  lunchBreakDuration: number
  shortBreakDuration: number
  lateThresholdMinutes: number
  overtimeAfterHours: number
  weekendDays: number[]
  use24HourFormat: boolean
  showSeconds: boolean
}

const defaultConfig: WorkConfigData = {
  name: "Standard Shift",
  standardStartTime: "08:30",
  standardEndTime: "17:30",
  fullWorkingHours: 8,
  lunchBreakDuration: 60,
  shortBreakDuration: 15,
  lateThresholdMinutes: 5,
  overtimeAfterHours: 8,
  weekendDays: [0, 6], // Sunday and Saturday
  use24HourFormat: true,
  showSeconds: false,
}

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export default function WorkConfigPage() {
  const [config, setConfig] = useState<WorkConfigData>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check authentication and admin role
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    try {
      const user = JSON.parse(userData)
      if (user.role !== "admin") {
        router.push("/dashboard")
        return
      }
      setIsAuthenticated(true)
      fetchCurrentConfig()
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login")
    }
  }, [router])

  const fetchCurrentConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/public/work-time/config/active`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setConfig({
            name: data.data.name,
            standardStartTime: data.data.standardStartTime,
            standardEndTime: data.data.standardEndTime,
            fullWorkingHours: data.data.fullWorkingHours,
            lunchBreakDuration: data.data.lunchBreakDuration,
            shortBreakDuration: data.data.shortBreakDuration,
            lateThresholdMinutes: data.data.lateThresholdMinutes,
            overtimeAfterHours: data.data.overtimeAfterHours,
            weekendDays: data.data.weekendDays,
            use24HourFormat: data.data.use24HourFormat,
            showSeconds: data.data.showSeconds,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching config:", error)
      setMessage({ type: "error", text: "Failed to load current configuration" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/work-time/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Work configuration updated successfully!" })
        // Refresh the config to get the latest data
        setTimeout(() => {
          fetchCurrentConfig()
        }, 1000)
      } else {
        throw new Error(data.message || "Failed to update configuration")
      }
    } catch (error) {
      console.error("Error saving config:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save configuration",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof WorkConfigData, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleWeekendDay = (day: number) => {
    setConfig((prev) => ({
      ...prev,
      weekendDays: prev.weekendDays.includes(day)
        ? prev.weekendDays.filter((d) => d !== day)
        : [...prev.weekendDays, day].sort(),
    }))
  }

  if (!isAuthenticated) {
    return <AuthGuard requiredRole="admin">{null}</AuthGuard>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Work Configuration</h1>
        </div>
        <p className="text-gray-600">
          Configure work time settings, break durations, and overtime policies for your organization.
        </p>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Set the basic configuration details for work shifts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Day Shift, Night Shift"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Work Hours</CardTitle>
            <CardDescription>Define standard working hours and duration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Standard Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={config.standardStartTime}
                  onChange={(e) => handleInputChange("standardStartTime", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">Standard End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={config.standardEndTime}
                  onChange={(e) => handleInputChange("standardEndTime", e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="workingHours">Full Working Hours</Label>
              <Input
                id="workingHours"
                type="number"
                min="1"
                max="24"
                value={config.fullWorkingHours}
                onChange={(e) => handleInputChange("fullWorkingHours", Number.parseInt(e.target.value))}
                required
              />
              <p className="text-sm text-gray-500 mt-1">Total hours per day</p>
            </div>
          </CardContent>
        </Card>

        {/* Break Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Break Configuration</CardTitle>
            <CardDescription>Set break durations and policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lunchBreak">Lunch Break Duration (minutes)</Label>
                <Input
                  id="lunchBreak"
                  type="number"
                  min="0"
                  max="180"
                  value={config.lunchBreakDuration}
                  onChange={(e) => handleInputChange("lunchBreakDuration", Number.parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shortBreak">Short Break Duration (minutes)</Label>
                <Input
                  id="shortBreak"
                  type="number"
                  min="0"
                  max="60"
                  value={config.shortBreakDuration}
                  onChange={(e) => handleInputChange("shortBreakDuration", Number.parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Policies</CardTitle>
            <CardDescription>Configure late arrival and overtime policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                <Input
                  id="lateThreshold"
                  type="number"
                  min="0"
                  max="60"
                  value={config.lateThresholdMinutes}
                  onChange={(e) => handleInputChange("lateThresholdMinutes", Number.parseInt(e.target.value))}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Minutes after start time to mark as late</p>
              </div>
              <div>
                <Label htmlFor="overtimeAfter">Overtime After (hours)</Label>
                <Input
                  id="overtimeAfter"
                  type="number"
                  min="1"
                  max="24"
                  value={config.overtimeAfterHours}
                  onChange={(e) => handleInputChange("overtimeAfterHours", Number.parseInt(e.target.value))}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Hours after which overtime applies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekend Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Weekend Configuration</CardTitle>
            <CardDescription>Select which days are considered weekends.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <Badge
                  key={day.value}
                  variant={config.weekendDays.includes(day.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    config.weekendDays.includes(day.value) ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50"
                  }`}
                  onClick={() => toggleWeekendDay(day.value)}
                >
                  {day.label}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected days:{" "}
              {config.weekendDays.length === 0
                ? "None"
                : config.weekendDays.map((d) => weekDays.find((day) => day.value === d)?.label).join(", ")}
            </p>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>Configure how time is displayed in the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="24hour">Use 24-Hour Format</Label>
                <p className="text-sm text-gray-500">Display time in 24-hour format (e.g., 14:30 instead of 2:30 PM)</p>
              </div>
              <Switch
                id="24hour"
                checked={config.use24HourFormat}
                onCheckedChange={(checked) => handleInputChange("use24HourFormat", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="seconds">Show Seconds</Label>
                <p className="text-sm text-gray-500">Display seconds in time format</p>
              </div>
              <Switch
                id="seconds"
                checked={config.showSeconds}
                onCheckedChange={(checked) => handleInputChange("showSeconds", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={fetchCurrentConfig} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

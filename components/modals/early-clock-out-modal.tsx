"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, Clock } from "lucide-react"

interface EarlyClockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  elapsedTime: number
  isLoading?: boolean
}

export function EarlyClockOutModal({
  isOpen,
  onClose,
  onConfirm,
  elapsedTime,
  isLoading = false,
}: EarlyClockOutModalProps) {
  if (!isOpen) return null

  // Calculate hours and minutes worked
  const hoursWorked = Math.floor(elapsedTime / 3600)
  const minutesWorked = Math.floor((elapsedTime % 3600) / 60)

  // Calculate remaining time to complete 8 hours
  const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60
  const remainingTime = Math.max(0, EIGHT_HOURS_IN_SECONDS - elapsedTime)
  const remainingHours = Math.floor(remainingTime / 3600)
  const remainingMinutes = Math.floor((remainingTime % 3600) / 60)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Early Clock Out Warning</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0" disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Work Progress Summary */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 text-orange-800 mb-3">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Work Progress Summary</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-orange-700">Time Worked:</span>
                <span className="font-medium text-orange-900">
                  {hoursWorked}h {minutesWorked}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Required Hours:</span>
                <span className="font-medium text-orange-900">8h 0m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Remaining Time:</span>
                <span className="font-medium text-red-600">
                  {remainingHours}h {remainingMinutes}m
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Attendance Warning:</strong> Clocking out before completing your full work day may affect your
              attendance record and could impact your performance evaluation.
            </p>
          </div>

          {/* Confirmation Question */}
          <div className="text-center">
            <p className="text-gray-700 font-medium mb-2">Are you sure you want to clock out early?</p>
            <p className="text-sm text-gray-600">
              You can continue working to complete your full shift, or clock out now if necessary.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1 bg-transparent">
              Continue Working
            </Button>
            <Button onClick={onConfirm} disabled={isLoading} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
              {isLoading ? "Clocking Out..." : "Clock Out Anyway"}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>This action will be recorded in your timesheet with the actual hours worked.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

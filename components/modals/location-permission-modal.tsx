"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import type { LocationError } from "@/hooks/use-location"

interface LocationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  locationError: LocationError | null
  getBrowserInstructions: () => {
    browser: string
    icon: string
    steps: string[]
  }
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  onRetry,
  locationError,
  getBrowserInstructions,
}: LocationPermissionModalProps) {
  if (!isOpen) return null

  const instructions = getBrowserInstructions()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Location Access Blocked</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {locationError?.message || "Location access has been permanently blocked for this site."}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{instructions.icon}</span>
              <h3 className="font-semibold">How to Fix This in {instructions.browser}:</h3>
            </div>

            <ol className="space-y-2">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={onRetry} className="flex-1">
              Try Again
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

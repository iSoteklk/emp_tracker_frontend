"use client"

import { useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GlassTimeCard } from "@/components/user-worklog/time-card"
import { WorkLogTable } from "@/components/work-log-table"
import { LocationDisplay } from "@/components/user-worklog/location-display"
import { LocationPermissionHelper } from "@/components//user-worklog/location-permission-helper"
import { GeofenceStatus } from "@/components/geofence-status"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

function UserDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<
    "granted" | "denied" | "blocked" | "unknown"
  >("unknown")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Redirect admin users to admin dashboard
      if (parsedUser.role === "admin") {
        router.push("/admin")
      }
    }

    // Dispatch auth change event to ensure sidebar updates
    window.dispatchEvent(new Event("auth-change"))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("contact")
    localStorage.removeItem("userLocation")
    localStorage.removeItem("locationSkipped")

    // Dispatch custom event to notify sidebar
    window.dispatchEvent(new Event("auth-change"))

    router.push("/login")
  }

  if (!user || user.role === "admin") {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold  bg-clip-text text-transparent">
                Time Tracking Dashboard
              </h1>
              {user && (
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.fname} {user.lname}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Task Timer and Location */}
          <div className="xl:col-span-1 space-y-6">
            {/* Task Timer */}
            <div className="flex justify-center items-start">
              <div className="relative">
                {/* Background gradient for glass effect */}
                <div className="absolute inset-0 rounded-lg blur-xl opacity-30"></div>
                <div className="relative">
                  <GlassTimeCard showSeconds showTimezone />
                </div>
              </div>
            </div>

            {/* Geofence Status */}
            <GeofenceStatus showRefresh={true} />

            {/* Location Permission Helper - Show if location is blocked */}
            {(locationPermissionStatus === "blocked" || locationPermissionStatus === "denied") && (
              <LocationPermissionHelper onPermissionChange={setLocationPermissionStatus} />
            )}

            {/* Location Display - Only show if location has been obtained */}
            <LocationDisplay showRefresh={true} />
          </div>

          {/* Right Column - Work Log Table */}
          <div className="xl:col-span-2">
            <WorkLogTable />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="employee">
      <UserDashboardContent />
    </AuthGuard>
  )
}
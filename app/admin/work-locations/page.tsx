"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Plus,
  Edit2,
  X
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { refreshWorkStationConfig } from "@/lib/work-station-config"

interface WorkLocation {
  _id?: string
  latitude: number
  longitude: number
  address: string
  radius: number
  name?: string
  createdAt?: string
  updatedAt?: string
}

interface WorkLocationForm {
  latitude: string
  longitude: string
  address: string
  radius: string
  name: string
}

const defaultFormData: WorkLocationForm = {
  latitude: "",
  longitude: "",
  address: "",
  radius: "",
  name: "",
}

function WorkLocationsContent() {
  const router = useRouter()
  const [formData, setFormData] = useState<WorkLocationForm>(defaultFormData)
  const [locations, setLocations] = useState<WorkLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<WorkLocationForm>(defaultFormData)
  const [isUpdating, setIsUpdating] = useState(false)

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
      fetchLocations()
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login")
    }
  }, [router])

  const fetchLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch("/api/work-locations/getall", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success === "true" && data.data && data.data.data) {
          setLocations(data.data.data)
        }
      } else {
        console.error("Failed to fetch locations:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      setMessage({ type: "error", text: "Failed to load work locations" })
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const handleInputChange = (field: keyof WorkLocationForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear messages when user starts typing
    if (message) setMessage(null)
  }

  const handleNameInputChange = (value: string) => {
    // Filter out invalid characters in real-time
    const filteredValue = value.replace(/[^a-zA-Z0-9_-]/g, '')
    handleInputChange("name", filteredValue)
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Location name is required"
    }

    // Validate location name - only allow letters, numbers, underscores, and hyphens
    const nameRegex = /^[a-zA-Z0-9_-]+$/
    if (!nameRegex.test(formData.name.trim())) {
      return "Location name can only contain letters, numbers, underscores (_), and hyphens (-). No spaces or special characters allowed."
    }

    if (!formData.address.trim()) {
      return "Address is required"
    }

    const latitude = parseFloat(formData.latitude)
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude must be a valid number between -90 and 90"
    }

    const longitude = parseFloat(formData.longitude)
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude must be a valid number between -180 and 180"
    }

    const radius = parseInt(formData.radius)
    if (isNaN(radius) || radius <= 0) {
      return "Radius must be a positive number"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setMessage({ type: "error", text: validationError })
      return
    }

    setIsSaving(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const requestBody = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address.trim(),
        radius: parseInt(formData.radius),
        name: formData.name.trim(),
      }

      console.log("Creating work location:", requestBody)

      const response = await fetch("/api/work-locations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Work location created successfully!" })
        
        // Reset form
        setFormData(defaultFormData)
        
        // Refresh locations list
        fetchLocations()

        // Refresh work station configuration to update geofencing
        try {
          console.log("Refreshing work station configuration after location creation")
          await refreshWorkStationConfig()
        } catch (error) {
          console.error("Failed to refresh work station config:", error)
        }
      } else {
        throw new Error(data.message || "Failed to create work location")
      }
    } catch (error) {
      console.error("Error creating location:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create work location",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGoBack = () => {
    router.push("/admin")
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
          setIsLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setMessage({ type: "error", text: "Unable to get current location" })
          setIsLoading(false)
        }
      )
    } else {
      setMessage({ type: "error", text: "Geolocation is not supported by this browser" })
    }
  }

  const startEditing = (location: WorkLocation) => {
    setEditingLocation(location._id || location.address)
    setEditFormData({
      name: location.name || "",
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius.toString(),
    })
    setMessage(null)
  }

  const cancelEditing = () => {
    setEditingLocation(null)
    setEditFormData(defaultFormData)
    setMessage(null)
  }

  const handleEditInputChange = (field: keyof WorkLocationForm, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (message) setMessage(null)
  }

  const handleEditNameInputChange = (value: string) => {
    // Filter out invalid characters in real-time for edit form
    const filteredValue = value.replace(/[^a-zA-Z0-9_-]/g, '')
    handleEditInputChange("name", filteredValue)
  }

  const handleUpdateLocation = async (originalAddress: string) => {
    setMessage(null)

    // Validate form
    const validationError = validateEditForm()
    if (validationError) {
      setMessage({ type: "error", text: validationError })
      return
    }

    setIsUpdating(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const requestBody = {
        latitude: parseFloat(editFormData.latitude),
        longitude: parseFloat(editFormData.longitude),
        address: editFormData.address.trim(),
        radius: parseInt(editFormData.radius),
        name: editFormData.name.trim(),
      }

      console.log("Updating work location:", requestBody)

      const response = await fetch(`/api/work-locations/update/${originalAddress}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Work location updated successfully!" })
        
        // Reset edit state
        setEditingLocation(null)
        setEditFormData(defaultFormData)
        
        // Refresh locations list
        fetchLocations()

        // Refresh work station configuration to update geofencing
        try {
          console.log("Refreshing work station configuration after location update")
          await refreshWorkStationConfig()
        } catch (error) {
          console.error("Failed to refresh work station config:", error)
        }
      } else {
        throw new Error(data.message || "Failed to update work location")
      }
    } catch (error) {
      console.error("Error updating location:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update work location",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const validateEditForm = (): string | null => {
    if (!editFormData.name.trim()) {
      return "Location name is required"
    }

    // Validate location name - only allow letters, numbers, underscores, and hyphens
    const nameRegex = /^[a-zA-Z0-9_-]+$/
    if (!nameRegex.test(editFormData.name.trim())) {
      return "Location name can only contain letters, numbers, underscores (_), and hyphens (-). No spaces or special characters allowed."
    }

    if (!editFormData.address.trim()) {
      return "Address is required"
    }

    const latitude = parseFloat(editFormData.latitude)
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude must be a valid number between -90 and 90"
    }

    const longitude = parseFloat(editFormData.longitude)
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude must be a valid number between -180 and 180"
    }

    const radius = parseInt(editFormData.radius)
    if (isNaN(radius) || radius <= 0) {
      return "Radius must be a positive number"
    }

    return null
  }

  if (!isAuthenticated) {
    return <AuthGuard requiredRole="admin">{null}</AuthGuard>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Work Locations
              </h1>
              <p className="text-sm text-slate-600">Manage work locations and geofencing</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2 bg-white/80 border-blue-200 text-blue-700 hover:bg-blue-50">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Location Form */}
          <Card className="bg-white/80 border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <CardTitle>Add New Location</CardTitle>
              </div>
              <CardDescription>Create a new work location with geofencing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameInputChange(e.target.value)}
                    placeholder="e.g., Headquarters, Main_Office, Branch-01"
                    required
                    disabled={isSaving}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Only letters, numbers, underscores (_), and hyphens (-) allowed. No spaces.
                  </p>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="e.g., Main Office Building"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange("latitude", e.target.value)}
                      placeholder="6.927079"
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange("longitude", e.target.value)}
                      placeholder="79.861243"
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="radius">Radius (meters) *</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    value={formData.radius}
                    onChange={(e) => handleInputChange("radius", e.target.value)}
                    placeholder="100"
                    required
                    disabled={isSaving}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Geofencing radius in meters
                  </p>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={isLoading || isSaving}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    Use Current Location
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Location
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Locations */}
          <Card className="bg-white/80 border-blue-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <CardTitle>Existing Locations</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLocations}
                  disabled={isLoadingLocations}
                  className="bg-transparent"
                >
                  {isLoadingLocations ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription>
                {locations.length} location{locations.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Loading locations...</span>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No work locations configured yet</p>
                  <p className="text-sm">Add your first location using the form</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {locations.map((location) => (
                    <div key={location._id || location.name} className="border rounded-lg p-4 bg-slate-50">
                      {editingLocation === (location._id || location.address) ? (
                        // Edit Form
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`edit-name-${location._id}`}>Location Name</Label>
                            <Input
                              id={`edit-name-${location._id}`}
                              value={editFormData.name}
                              onChange={(e) => handleEditNameInputChange(e.target.value)}
                              placeholder="e.g., Headquarters, Main_Office, Branch-01"
                              disabled={isUpdating}
                            />
                            <p className="text-sm text-slate-500 mt-1">
                              Only letters, numbers, underscores (_), and hyphens (-) allowed. No spaces.
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`edit-address-${location._id}`}>Address *</Label>
                            <Input
                              id={`edit-address-${location._id}`}
                              value={editFormData.address}
                              onChange={(e) => handleEditInputChange("address", e.target.value)}
                              placeholder="e.g., Main Office Building"
                              required
                              disabled={isUpdating}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`edit-latitude-${location._id}`}>Latitude *</Label>
                              <Input
                                id={`edit-latitude-${location._id}`}
                                type="number"
                                step="any"
                                value={editFormData.latitude}
                                onChange={(e) => handleEditInputChange("latitude", e.target.value)}
                                placeholder="6.927079"
                                required
                                disabled={isUpdating}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-longitude-${location._id}`}>Longitude *</Label>
                              <Input
                                id={`edit-longitude-${location._id}`}
                                type="number"
                                step="any"
                                value={editFormData.longitude}
                                onChange={(e) => handleEditInputChange("longitude", e.target.value)}
                                placeholder="79.861243"
                                required
                                disabled={isUpdating}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor={`edit-radius-${location._id}`}>Radius (meters) *</Label>
                            <Input
                              id={`edit-radius-${location._id}`}
                              type="number"
                              min="1"
                              value={editFormData.radius}
                              onChange={(e) => handleEditInputChange("radius", e.target.value)}
                              placeholder="100"
                              required
                              disabled={isUpdating}
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateLocation(location.address)}
                              disabled={isUpdating}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isUpdating ? (
                                <>
                                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-1 h-3 w-3" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={isUpdating}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{location.name || "Unnamed Location"}</h4>
                            <p className="text-sm text-slate-600 mb-2">{location.address}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                              <span>Lat: {location.latitude}</span>
                              <span>Lng: {location.longitude}</span>
                              <span>Radius: {location.radius}m</span>
                              <span>
                                <Badge variant="outline" className="text-xs">
                                  Active
                                </Badge>
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(location)}
                            className="ml-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function WorkLocationsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <WorkLocationsContent />
    </AuthGuard>
  )
} 
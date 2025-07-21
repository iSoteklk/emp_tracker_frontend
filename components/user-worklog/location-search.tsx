"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useLocation } from "@/hooks/use-location"

interface LocationSearchProps {
  onLocationSelect: (location: WorkLocation) => void
  className?: string
}

interface WorkLocation {
  _id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number
  createdAt: string
  updatedAt: string
}

export function LocationSearch({ onLocationSelect, className }: LocationSearchProps) {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<WorkLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const { location: userLocation, geofenceResult } = useLocation()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setIsLoading(true)
      setError(null)

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

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success === "true" && data.data && data.data.data) {
        setLocations(data.data.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch locations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (location: WorkLocation) => {
    setSelectedLocation(location)
    setOpen(false)

    // Update workStationConfig with selected location
    const config = {
      mainOffice: {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius,
        address: location.address,
        name: location.name,
      }
    }

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("workStationConfig", JSON.stringify(config))
      
      // Dispatch event to notify other components
      window.dispatchEvent(new StorageEvent("storage", {
        key: "workStationConfig",
        newValue: JSON.stringify(config),
        storageArea: localStorage
      }))
      window.dispatchEvent(new CustomEvent("workStationConfigUpdated"))
    }

    onLocationSelect(location)
  }

  const getLocationStatus = (location: WorkLocation) => {
    if (!userLocation) return null

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    )

    const isWithin = distance <= location.radius

    return {
      isWithin,
      distance: Math.round(distance),
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in meters
  }

  const displayedLocations = showAll ? locations : locations.slice(0, 3)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {selectedLocation ? (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedLocation.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{isLoading ? "Loading locations..." : "Select location"}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandEmpty>No locations found.</CommandEmpty>
          <CommandGroup className="max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
            {displayedLocations.map((location) => {
              const status = getLocationStatus(location)
              return (
                <CommandItem
                  key={location._id}
                  value={location.name}
                  onSelect={() => handleSelect(location)}
                  className="flex flex-col items-start py-3 border-b last:border-b-0 border-gray-100"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLocation?._id === location._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {location.address}
                      </div>
                    </div>
                  </div>
                  {status && (
                    <div className="ml-6 mt-1">
                      <Badge
                        variant={status.isWithin ? "secondary" : "outline"}
                        className={cn(
                          "text-xs",
                          status.isWithin
                            ? "bg-green-100 text-green-800"
                            : "text-orange-800"
                        )}
                      >
                        {status.isWithin
                          ? "You are here"
                          : `${status.distance}m away`}
                      </Badge>
                    </div>
                  )}
                </CommandItem>
              )
            })}
            {!showAll && locations.length > 3 && (
              <CommandItem
                onSelect={() => setShowAll(true)}
                className="py-2 text-sm text-blue-600 hover:text-blue-800 text-center cursor-pointer"
              >
                Show {locations.length - 3} more locations...
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
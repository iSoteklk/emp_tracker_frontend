"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, MapPin, Building, Loader2 } from "lucide-react"
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

export interface LocationSearchProps {
  onLocationSelect: (location: WorkLocation) => void
  className?: string
  defaultValue?: WorkLocation | null
}

export function LocationSearch({ onLocationSelect, className, defaultValue }: LocationSearchProps) {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<WorkLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(defaultValue || null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch locations when component mounts
  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    // Update selected location when defaultValue changes
    setSelectedLocation(defaultValue || null)
  }, [defaultValue])

  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found")
        return
      }

      const response = await fetch("/api/work-locations/getall", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      console.log("Locations response:", data) // Debug log

      if (response.ok && data.success === "true" && data.data && Array.isArray(data.data.data)) {
        setLocations(data.data.data)
        console.log("Loaded locations:", data.data.data) // Debug log
      } else {
        console.error("Failed to fetch locations:", data)
        setLocations([]) // Reset locations on error
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      setLocations([]) // Reset locations on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (location: WorkLocation) => {
    setSelectedLocation(location)
    onLocationSelect(location)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onClick={() => {
            setOpen(!open)
            if (!open) {
              fetchLocations()
            }
          }}
        >
          {selectedLocation ? (
            <>
              <Building className="mr-2 h-4 w-4" />
              {selectedLocation.name}
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Select work location...
            </>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search work locations..." />
          <CommandEmpty>
            {locations.length === 0 ? (
              <div className="p-4 text-sm text-center text-gray-500">
                No work locations available. Please contact your administrator.
              </div>
            ) : (
              <div className="p-4 text-sm text-center text-gray-500">
                No location found with that name.
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {isLoading ? (
              <CommandItem disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading work locations...
              </CommandItem>
            ) : locations.length === 0 ? (
              <CommandItem disabled>
                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                No locations available
              </CommandItem>
            ) : (
              locations.map((location) => (
                <CommandItem
                  key={location._id}
                  value={location._id}
                  onSelect={() => handleSelect(location)}
                >
                  <Building className="mr-2 h-4 w-4" />
                  {location.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedLocation?._id === location._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
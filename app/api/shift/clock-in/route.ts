import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, geofence, notes } = body

    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: "false", message: "Authorization token required" }, { status: 401 })
    }

    // Validate location data
    if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
      return NextResponse.json(
        {
          success: "false",
          message: "Valid location data (latitude, longitude) is required",
        },
        { status: 400 },
      )
    }

    // Create the request body in the expected format
    const clockInData = {
      date: new Date().toISOString(), // Today's date at midnight
      clockInTime: new Date().toISOString(), // Current timestamp
      clockInLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || "Location not available",
        accuracy: location.accuracy || 10,
      },
      notes: notes || "Clock in via web app",
    }

    console.log("Sending clock-in request with data:", clockInData)

    // Make the API call to the external clock-in endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/clock-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(clockInData),
    })

    const data = await response.json()
    console.log("External API response:", data)

    // Return the response from the external API
    if (response.ok) {
      return NextResponse.json(
        {
          success: "true",
          message: "Clock in successful",
          data: data,
          clockInTime: clockInData.clockInTime,
          location: clockInData.clockInLocation,
        },
        { status: 200 },
      )
    } else {
      console.error("External API error:", data)
      return NextResponse.json(
        {
          success: "false",
          message: data.message || data.error || "Clock in failed",
          error: data,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Clock-in API error:", error)
    return NextResponse.json(
      {
        success: "false",
        message: "Internal server error. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

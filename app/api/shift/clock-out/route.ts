import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, workLocationId, workLocationName, notes } = body

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

    // Validate work location data
    if (!workLocationId || !workLocationName) {
      return NextResponse.json(
        {
          success: "false",
          message: "Work location ID and name are required",
        },
        { status: 400 },
      )
    }

    // Get current date in user's timezone and format consistently
    const now = new Date()
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Create date at start of day in user's timezone, then convert to UTC
    const todayInUserTz = new Date(now.toLocaleDateString("en-CA")) // YYYY-MM-DD format
    const dateAtMidnightUTC = new Date(todayInUserTz.getTime() - todayInUserTz.getTimezoneOffset() * 60000)

    // Create the request body in the expected format
    const clockOutData = {
      date: dateAtMidnightUTC.toISOString(), // Use consistent date format
      clockOutTime: now.toISOString(), // Current timestamp
      clockOutLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || "Location not available",
        accuracy: location.accuracy || 10,
        name: workLocationName, // Add work location name
      },
      workLocationId: workLocationId, // Include work location ID
      notes: notes || "Clock out via web app",
    }

    console.log("Sending clock-out request with data:", clockOutData)
    console.log("Date being used:", clockOutData.date)
    console.log("Clock out time:", clockOutData.clockOutTime)
    console.log("Work location:", { id: workLocationId, name: workLocationName })

    // Make the API call to the external clock-out endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/clock-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(clockOutData),
    })

    const data = await response.json()
    console.log("External API response:", data)

    // Return the response from the external API
    if (response.ok) {
      return NextResponse.json(
        {
          success: "true",
          message: "Clock out successful",
          data: data,
          clockOutTime: clockOutData.clockOutTime,
          location: clockOutData.clockOutLocation,
          workLocationId: workLocationId,
        },
        { status: 200 },
      )
    } else {
      console.error("External API error:", data)
      return NextResponse.json(
        {
          success: "false",
          message: data.message || data.error || "Clock out failed",
          error: data,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Clock-out API error:", error)
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

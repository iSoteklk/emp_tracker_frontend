import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("✅ Create work location API route called")

  try {
    const body = await request.json()
    console.log("📝 Request body received:", body)

    const { latitude, longitude, address, radius, name } = body

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🔑 Auth header present:", !!authHeader)

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid authorization header")
      return NextResponse.json(
        {
          success: "false",
          message: "Authorization token required",
        },
        { status: 401 },
      )
    }

    // Validate required fields
    if (!latitude || !longitude || !address || !radius) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: "false",
          message: "All fields are required: latitude, longitude, address, radius",
        },
        { status: 400 },
      )
    }

    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          success: "false",
          message: "Latitude must be between -90 and 90",
        },
        { status: 400 },
      )
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: "false",
          message: "Longitude must be between -180 and 180",
        },
        { status: 400 },
      )
    }

    // Validate radius
    if (radius <= 0) {
      return NextResponse.json(
        {
          success: "false",
          message: "Radius must be a positive number",
        },
        { status: 400 },
      )
    }

    console.log("🚀 Sending request to backend API...")

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address.trim(),
        radius: parseInt(radius),
        name: name?.trim() || "",
      }),
    })

    console.log("📡 Backend response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error("❌ Backend API error:", response.status, errorData)
      
      return NextResponse.json(
        {
          success: "false",
          message: errorData?.message || `Backend API error: ${response.status}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ Backend response data:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("💥 Error creating work location:", error)

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: "false",
          message: "Cannot connect to backend server. Please ensure the backend is running on http://localhost:4000",
        },
        { status: 503 },
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: "false",
          message: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: "false",
        message: "Failed to create work location",
      },
      { status: 500 },
    )
  }
} 
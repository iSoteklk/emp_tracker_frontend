import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        {
          success: "false",
          message: "No token provided",
        },
        { status: 401 },
      )
    }

    console.log("Fetching user profile from backend API...")

    const response = await fetch("http://localhost:4000/api/v1/users/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("Backend response status:", response.status)

    if (!response.ok) {
      console.error("Backend API error:", response.status, response.statusText)
      return NextResponse.json(
        {
          success: "false",
          message: `Backend API error: ${response.status}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Backend response data:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching user profile:", error)

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: "false",
          message: "Cannot connect to backend server. Please ensure the backend is running on http://localhost:4000",
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        success: "false",
        message: "Failed to fetch user profile",
      },
      { status: 500 },
    )
  }
}
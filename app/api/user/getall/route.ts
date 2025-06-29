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

    console.log("Fetching users from backend API...")

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/getall`, {
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
    console.error("Error fetching users:", error)

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
        message: "Failed to fetch users",
      },
      { status: 500 },
    )
  }
}

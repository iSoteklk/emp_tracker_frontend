import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params

    // Get the authorization token from the request headers
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: "false", message: "Authorization token required" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Make request to external API
    const response = await fetch(`http://localhost:4000/api/v1/shift/attendance/${date}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ success: "false", message: "Unauthorized" }, { status: 401 })
      }

      if (response.status === 404) {
        return NextResponse.json(
          { success: "true", data: [], message: "No attendance records found for this date" },
          { status: 200 },
        )
      }

      throw new Error(`External API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: "true",
      data: data.data || [],
      message: data.message || "Attendance data retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json(
      {
        success: "false",
        message: "Failed to fetch attendance data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
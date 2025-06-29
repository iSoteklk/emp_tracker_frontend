import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the date from query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { success: "false", message: "Date parameter is required" },
        { status: 400 }
      )
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: "false", message: "Authorization token required" },
        { status: 401 }
      )
    }

    console.log("Fetching shift status for date:", date)

    // Make the API call to the external shift status endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/me/date/${date}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    const data = await response.json()
    console.log("External API response:", data)

    // Return the response from the external API
    if (response.ok) {
      return NextResponse.json(data, { status: 200 })
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error("Shift status API error:", error)
    return NextResponse.json(
      {
        success: "false",
        message: "Internal server error. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
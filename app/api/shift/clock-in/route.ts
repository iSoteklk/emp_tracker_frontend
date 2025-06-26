import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location } = body

    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: "false", message: "Authorization token required" }, { status: 401 })
    }

    // Make the API call to the external clock-in endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/clock-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        location,
        timestamp: new Date().toISOString(),
      }),
    })

    const data = await response.json()

    // Return the response from the external API
    if (response.ok) {
      return NextResponse.json(data, { status: 200 })
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error("Clock-in API error:", error)
    return NextResponse.json(
      {
        success: "false",
        message: "Internal server error. Please try again later.",
      },
      { status: 500 },
    )
  }
}
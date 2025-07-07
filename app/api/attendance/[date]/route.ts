import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ success: "false", message: "Authorization header missing" }, { status: 401 })
    }

    // Forward the request to your external API
    const externalApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/shift/attendance/${date}`

    const response = await fetch(externalApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json(
      {
        success: "false",
        message: "Failed to fetch attendance data",
        data: [],
      },
      { status: 500 },
    )
  }
}

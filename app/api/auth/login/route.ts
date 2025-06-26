import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ success: "false", message: "Email and password are required" }, { status: 400 })
    }

    // Make the API call to the external login endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
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
    console.error("Login API error:", error)
    return NextResponse.json(
      {
        success: "false",
        message: "Internal server error. Please try again later.",
      },
      { status: 500 },
    )
  }
}

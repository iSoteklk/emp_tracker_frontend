import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: "false", message: "Authorization token required" }, { status: 401 })
    }

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: "false",
          message: "Current password and new password are required",
        },
        { status: 400 },
      )
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: "false",
          message: "New password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    console.log("Resetting password for user...")

    // Make the API call to the external reset password endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/resetPassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })

    const data = await response.json()
    console.log("External API response:", data)

    // Return the response from the external API
    if (response.ok) {
      return NextResponse.json(
        {
          success: "true",
          message: data.message || "Password reset successfully",
          data: data.data,
        },
        { status: 200 },
      )
    } else {
      console.error("External API error:", data)
      return NextResponse.json(
        {
          success: "false",
          message: data.message || data.error || "Failed to reset password",
          error: data,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Reset password API error:", error)
    
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: "false",
          message: "Cannot connect to backend server. Please ensure the backend is running.",
        },
        { status: 503 },
      )
    }

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
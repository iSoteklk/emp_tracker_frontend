import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: "false", message: "Authorization token required" }, { status: 401 })
    }

    // Validate email
    if (!email) {
      return NextResponse.json(
        {
          success: "false",
          message: "Email is required",
        },
        { status: 400 },
      )
    }

    console.log("Deleting user with email:", email)

    // Make the API call to the external delete user endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/deleteUser`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()
    console.log("External API response:", data)

    // Return the response from the external API
    if (response.ok) {
      return NextResponse.json(
        {
          success: "true",
          message: data.message || "User deleted successfully",
          data: data,
        },
        { status: 200 },
      )
    } else {
      console.error("External API error:", data)
      return NextResponse.json(
        {
          success: "false",
          message: data.message || data.error || "Failed to delete user",
          error: data,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Delete user API error:", error)
    
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
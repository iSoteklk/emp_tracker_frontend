import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("✅ Create user API route called")

  try {
    const body = await request.json()
    console.log("📝 Request body received:", { ...body, password: "[HIDDEN]" })

    const { email, fname, lname, contact, role, password } = body

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
    if (!email || !fname || !lname || !contact || !role || !password) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: "false",
          message: "All fields are required: email, fname, lname, contact, role, password",
        },
        { status: 400 },
      )
    }

    // Validate role
    if (!["admin", "employee"].includes(role)) {
      console.log("❌ Invalid role:", role)
      return NextResponse.json(
        {
          success: "false",
          message: "Role must be either 'admin' or 'employee'",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email)
      return NextResponse.json(
        {
          success: "false",
          message: "Please enter a valid email address",
        },
        { status: 400 },
      )
    }

    // Validate contact (basic phone number validation)
    const contactRegex = /^\d{10,15}$/
    if (!contactRegex.test(contact)) {
      console.log("Invalid contact format:", contact)
      return NextResponse.json(
        {
          success: "false",
          message: "Contact must be 10-15 digits",
        },
        { status: 400 },
      )
    }

    // Validate password length
    if (password.length < 6) {
      console.log("Password too short")
      return NextResponse.json(
        {
          success: "false",
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Create the request body for external API
    const createUserData = {
      email: email.toLowerCase().trim(),
      fname: fname.trim(),
      lname: lname.trim(),
      contact: contact.trim(),
      role: role.toLowerCase(),
      password: password,
    }

    const externalApiUrl = `http://localhost:4000/api/v1/users/create`
    console.log("🌐 Calling external API:", externalApiUrl)
    console.log("📤 Sending data:", { ...createUserData, password: "[HIDDEN]" })

    // Make the API call to the external create user endpoint
    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(createUserData),
    })

    console.log("📡 External API response status:", response.status)

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("❌ External API returned non-JSON response")
      const textResponse = await response.text()
      console.error("📄 Response text:", textResponse.substring(0, 500))

      return NextResponse.json(
        {
          success: "false",
          message: "External API returned invalid response format",
          error: "Non-JSON response received from external API",
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("📥 External API response data:", data)

    // Return the response from the external API
    if (response.ok) {
      console.log("✅ User created successfully")
      return NextResponse.json(
        {
          success: "true",
          message: "User created successfully",
          data: data,
        },
        { status: 200 },
      )
    } else {
      console.error("❌ External API error:", data)
      return NextResponse.json(
        {
          success: "false",
          message: data.message || data.error || "Failed to create user",
          error: data,
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("💥 Create user API error:", error)

    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        {
          success: "false",
          message: "Invalid JSON in request or response",
          error: error.message,
        },
        { status: 400 },
      )
    }

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: "false",
          message: "Cannot connect to external API. Please check if the backend server is running.",
          error: error.message,
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

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

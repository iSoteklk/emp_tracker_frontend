"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth-guard"
import { Loader2, UserPlus, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"

interface CreateUserForm {
  email: string
  fname: string
  lname: string
  contact: string
  role: "admin" | "employee" | ""
  password: string
  confirmPassword: string
}

function CreateUserContent() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateUserForm>({
    email: "",
    fname: "",
    lname: "",
    contact: "",
    role: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  const validateForm = (): string | null => {
    // Check required fields
    if (
      !formData.email ||
      !formData.fname ||
      !formData.lname ||
      !formData.contact ||
      !formData.role ||
      !formData.password
    ) {
      return "All fields are required"
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address"
    }

    // Validate contact (basic phone number validation)
    const contactRegex = /^\d{10,15}$/
    if (!contactRegex.test(formData.contact)) {
      return "Contact must be 10-15 digits"
    }

    // Validate password length
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long"
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please login first")
        setIsLoading(false)
        return
      }

      const requestBody = {
        email: formData.email,
        fname: formData.fname,
        lname: formData.lname,
        contact: formData.contact,
        role: formData.role,
        password: formData.password,
      }

      console.log("Sending create user request to backend:", { ...requestBody, password: "[HIDDEN]" })

      // Updated URL to point to your backend server
      const backendUrl = "http://localhost:4000/api/v1/users/create"
      console.log("Making request to:", backendUrl)

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Received non-JSON response")
        const textResponse = await response.text()
        console.error("Response text:", textResponse.substring(0, 500))
        setError("Server returned invalid response format. Please check the console for details.")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        // Check for success based on your backend's response format
        // Adjust this condition based on how your backend responds
        if (data.success || data.message === "User created successfully" || response.status === 201) {
          setSuccess(`User ${formData.fname} ${formData.lname} created successfully!`)

          // Reset form
          setFormData({
            email: "",
            fname: "",
            lname: "",
            contact: "",
            role: "",
            password: "",
            confirmPassword: "",
          })

          // Auto redirect after 2 seconds
          setTimeout(() => {
            router.push("/admin")
          }, 2000)
        } else {
          setError(data.message || data.error || "User creation failed")
        }
      } else {
        setError(data.message || data.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Create user error:", error)

      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError("Cannot connect to backend server. Please ensure the backend is running on http://localhost:4000")
      } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        setError("Server returned invalid response format. Please check if the API is running correctly.")
      } else {
        setError("Network error. Please check your connection and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    router.push("/admin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New User
              </h1>
              <p className="text-sm text-muted-foreground">Add a new employee or admin to the system</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <CardTitle>User Information</CardTitle>
              </div>
              <CardDescription>Fill in the details below to create a new user account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fname">First Name *</Label>
                      <Input
                        id="fname"
                        type="text"
                        placeholder="Enter first name"
                        value={formData.fname}
                        onChange={(e) => handleInputChange("fname", e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lname">Last Name *</Label>
                      <Input
                        id="lname"
                        type="text"
                        placeholder="Enter last name"
                        value={formData.lname}
                        onChange={(e) => handleInputChange("lname", e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number *</Label>
                    <Input
                      id="contact"
                      type="tel"
                      placeholder="Enter 10-15 digit phone number"
                      value={formData.contact}
                      onChange={(e) => handleInputChange("contact", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Role & Access</h3>

                  <div className="space-y-2">
                    <Label htmlFor="role">User Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "admin" | "employee") => handleInputChange("role", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Employee: Can track time and view own data. Admin: Full system access.
                    </p>
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security</h3>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password (min 6 characters)"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create User
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoBack}
                    disabled={isLoading}
                    className="bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CreateUserPage() {
  return (
    <AuthGuard requiredRole="admin">
      <CreateUserContent />
    </AuthGuard>
  )
}
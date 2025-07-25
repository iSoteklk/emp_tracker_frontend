"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Clock, Users, BarChart3 } from "lucide-react"
import { refreshWorkStationConfig } from "@/lib/work-station-config"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Call our internal API route instead of external API directly
      const response = await fetch("/api/auth/login", {
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

      if (response.ok && data.success === "true") {
        // Store token and user info in localStorage
        localStorage.setItem("token", data.token)
        localStorage.setItem("contact", data.contact)

        // Store location data if provided by backend
        if (data.location) {
          localStorage.setItem("userLocation", JSON.stringify(data.location))
          console.log("Location data stored:", data.location)
        }

        // Decode JWT to get user info (basic decode, not verification)
        const tokenPayload = JSON.parse(atob(data.token.split(".")[1]))

        // Store comprehensive user data
        const userData = {
          id: tokenPayload.id,
          email: data.email || tokenPayload.email,
          fname: tokenPayload.fname,
          lname: tokenPayload.lname,
          contact: data.contact || tokenPayload.contact,
          role: data.role || tokenPayload.role,
          name: data.name || `${tokenPayload.fname} ${tokenPayload.lname}`,
          location: data.location || null, // Include location in user data
        }

        localStorage.setItem("user", JSON.stringify(userData))

        // Refresh work station configuration with user's location
        try {
          console.log("Refreshing work station configuration for user location:", userData.location)
          await refreshWorkStationConfig()
        } catch (error) {
          console.error("Failed to refresh work station config:", error)
          // Continue with login flow even if config refresh fails
        }

        // Dispatch custom event to notify sidebar and other components
        window.dispatchEvent(new Event("auth-change"))

        // Small delay to ensure event is processed
        setTimeout(() => {
          // Role-based routing - direct redirect without location step
          if (userData.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        }, 100)
      } else {
        setError(data.message || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/carwash.png')`
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600/90 p-4 rounded-full shadow-lg backdrop-blur-sm">
                <Clock className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Employee Time
              <br />
              <span className="text-blue-400">Tracking System</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-md leading-relaxed">
              Streamline workforce management with our comprehensive employee tracking solution
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="grid gap-4 mt-8">
            <div className="flex items-center space-x-3 text-slate-200">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Employee Management</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-200">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>Time Tracking</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-200">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <span>Analytics & Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="Company Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            
          </div>

          {/* Login Form */}
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Login to your Account
                </h3>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your Email here"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 bg-gray-100 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200 rounded-lg text-slate-800 placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your Password here"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 bg-gray-100 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200 rounded-lg text-slate-800 placeholder:text-gray-500 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-slate-500 text-sm">
            <p>© 2025 Bnscarwash. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

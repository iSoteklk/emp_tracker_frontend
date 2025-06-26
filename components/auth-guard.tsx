"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "employee"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasRequiredRole, setHasRequiredRole] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      try {
        // Basic token validation (check if it's expired)
        const tokenPayload = JSON.parse(atob(token.split(".")[1]))
        const currentTime = Date.now() / 1000

        if (tokenPayload.exp < currentTime) {
          // Token expired
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("contact")
          router.push("/login")
          return
        }

        const userData = localStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)

          // Check role-based access
          if (requiredRole) {
            if (requiredRole === "admin" && user.role !== "admin") {
              router.push("/dashboard")
              return
            }
            if (requiredRole === "employee" && user.role === "admin") {
              router.push("/admin")
              return
            }
          }

          setHasRequiredRole(true)
        }

        setIsAuthenticated(true)
      } catch (error) {
        // Invalid token
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("contact")
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || (requiredRole && !hasRequiredRole)) {
    return null
  }

  return <>{children}</>
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")

      if (!token || !userData) {
        router.push("/login")
        return
      }

      try {
        const user = JSON.parse(userData)

        // Role-based routing
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        router.push("/login")
      }
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

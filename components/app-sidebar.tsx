"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Home,
  Settings,
  Users,
  BarChart3,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Shield,
  User,
  LogOut,
  UserPlus,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { SidebarUserNav } from "@/components/sidebar-user-nav"

// Admin navigation items
const adminNavigationItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Create User",
    url: "/admin/create-user",
    icon: UserPlus,
  },
  {
    title: "Employee Management",
    url: "/admin/employees",
    icon: Users,
  },
  {
    title: "Time Reports",
    url: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Work Stations",
    url: "/admin/stations",
    icon: MapPin,
  },
  {
    title: "System Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

// Employee navigation items
const employeeNavigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Time Tracking",
    url: "/dashboard/time",
    icon: Clock,
  },
  {
    title: "My Schedule",
    url: "/dashboard/schedule",
    icon: Calendar,
  },
  {
    title: "Work Logs",
    url: "/dashboard/logs",
    icon: FileText,
  },
]

// Common navigation items (available to both roles)
const commonNavigationItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
]

interface AppUser {
  id: string
  email: string
  fname: string
  lname: string
  contact: string
  role: "admin" | "employee"
  name: string
}

export function AppSidebar() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = () => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      setIsAuthenticated(false)
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      // Basic token validation
      const tokenPayload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000

      if (tokenPayload.exp < currentTime) {
        // Token expired
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("contact")
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setIsAuthenticated(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("contact")
      setIsAuthenticated(false)
      setUser(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial auth check
    checkAuth()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        checkAuth()
      }
    }

    // Listen for custom auth events (for same-tab login)
    const handleAuthChange = () => {
      checkAuth()
    }

    // Add event listeners
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("auth-change", handleAuthChange)

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [])

  // Also check auth when pathname changes (navigation)
  useEffect(() => {
    checkAuth()
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("contact")
    localStorage.removeItem("userLocation")
    localStorage.removeItem("locationSkipped")
    localStorage.removeItem("timerState")
    setIsAuthenticated(false)
    setUser(null)

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("auth-change"))

    router.push("/login")
  }

  // Show loading state briefly
  if (isLoading) {
    return null
  }

  // Don't render sidebar if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (user.role === "admin") {
      return adminNavigationItems
    }
    return employeeNavigationItems
  }

  const navigationItems = getNavigationItems()

  // Check if current path is active
  const isActiveRoute = (url: string) => {
    if (url === "/dashboard" && pathname === "/dashboard") return true
    if (url === "/admin" && pathname === "/admin") return true
    if (url !== "/dashboard" && url !== "/admin" && pathname.startsWith(url)) return true
    return pathname === url
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r border-blue-200">
      <SidebarHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={user.role === "admin" ? "/admin" : "/dashboard"}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-md">
                  {user.role === "admin" ? <Shield className="size-4" /> : <Clock className="size-4" />}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-blue-800">
                    {user.role === "admin" ? "Admin Panel" : "Time Tracker"}
                  </span>
                  <span className="truncate text-xs text-blue-600">
                    {user.role === "admin" ? "Management" : "Employee"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-gradient-to-b from-blue-50/50 to-sky-50/30">
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-medium">
            {user.role === "admin" ? "Administration" : "My Workspace"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveRoute(item.url)}
                    className="hover:bg-blue-100 data-[active=true]:bg-blue-200 data-[active=true]:text-blue-800"
                  >
                    <a href={item.url}>
                      <item.icon className="text-blue-600" />
                      <span className="text-slate-700">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-blue-200" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-medium">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveRoute(item.url)}
                    className="hover:bg-blue-100 data-[active=true]:bg-blue-200 data-[active=true]:text-blue-800"
                  >
                    <a href={item.url}>
                      <item.icon className="text-blue-600" />
                      <span className="text-slate-700">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Logout"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-gradient-to-r from-blue-50 to-sky-50 border-t border-blue-200">
        <SidebarUserNav user={user} onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
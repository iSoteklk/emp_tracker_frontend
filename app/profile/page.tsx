"use client"

import { useEffect, useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth-guard"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit,
  RefreshCw,
  Clock,
  Building,
  UserCheck,
  Settings,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface UserProfile {
  _id: string
  email: string
  fname: string
  lname: string
  contact: string
  role: string
  createdAt: string
  updatedAt: string
}

interface PasswordChangeResponse {
  success: string
  message: string
}

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const response = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success === "true" && data.data) {
        setProfile(data.data)
      } else {
        setError("Failed to fetch profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleRefresh = () => {
    fetchProfile()
  }

  const handlePasswordChangeClick = () => {
    setShowPasswordDialog(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  const handlePasswordChangeCancel = () => {
    setShowPasswordDialog(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  const validatePasswordForm = () => {
    if (!currentPassword) {
      setPasswordError("Current password is required")
      return false
    }
    if (!newPassword) {
      setPasswordError("New password is required")
      return false
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      return false
    }
    if (!confirmPassword) {
      setPasswordError("Please confirm your new password")
      return false
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return false
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password")
      return false
    }
    return true
  }

  const handlePasswordChangeSubmit = async () => {
    if (!validatePasswordForm()) {
      return
    }

    try {
      setIsChangingPassword(true)
      setPasswordError(null)
      setPasswordSuccess(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setPasswordError("No authentication token found")
        return
      }

      const response = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data: PasswordChangeResponse = await response.json()

      if (response.ok && data.success === "true") {
        setPasswordSuccess(data.message || "Password changed successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setShowPasswordDialog(false)
          setPasswordSuccess(null)
        }, 2000)
      } else {
        setPasswordError(data.message || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("Failed to change password. Please try again.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-1">
            <Shield className="h-3 w-3 mr-1" />
            Administrator
          </Badge>
        )
      case "employee":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-4 py-1">
            <UserCheck className="h-3 w-3 mr-1" />
            Employee
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFullName = (fname: string, lname: string) => {
    return `${fname} ${lname}`.trim()
  }

  const getInitials = (fname: string, lname: string) => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-sm text-muted-foreground">Loading your profile information...</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header Skeleton */}
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <div className="text-center md:text-left space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-slate-600 mb-4">Failed to load profile information</p>
                <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-sm text-muted-foreground">Manage your account information</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative -mt-16 md:-mt-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                    {getInitials(profile.fname, profile.lname)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* Profile Info */}
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">
                    {getFullName(profile.fname, profile.lname)}
                  </h2>
                  <p className="text-slate-600 mb-3">{profile.email}</p>
                  {getRoleBadge(profile.role)}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs text-blue-600 font-medium">Active</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <Building className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-xs text-green-600 font-medium">Verified</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">First Name</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                    <span className="text-slate-800">{profile.fname}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Last Name</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                    <span className="text-slate-800">{profile.lname}</span>
                  </div>
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-slate-600">Employee ID</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                    <span className="text-slate-800 font-mono">{profile._id.slice(-8).toUpperCase()}</span>
                  </div>
                </div> */}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-5 w-5 text-green-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Email Address</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-800">{profile.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone Number</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-800">{profile.contact}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Role</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border">{getRoleBadge(profile.role)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Member Since</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                    <span className="text-slate-800">{formatDate(profile.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Last Updated</label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                    <span className="text-slate-800">{formatDate(profile.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  Edit Profile Information
                </Button> */}
                <Button 
                  onClick={handlePasswordChangeClick}
                  variant="outline" 
                  className="w-full justify-start gap-2 bg-transparent hover:bg-orange-50 border-orange-200 text-orange-700"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
                {/* <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Button> */}
                {/* {profile.role.toLowerCase() === "admin" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Settings
                  </Button>
                )} */}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info for Admins */}
          {profile.role.toLowerCase() === "admin" && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Shield className="h-5 w-5" />
                  Administrator Privileges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-900">User Management</div>
                    <div className="text-xs text-blue-600">Full Access</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-900">Time Tracking</div>
                    <div className="text-xs text-blue-600">Monitor All</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <Settings className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-900">System Settings</div>
                    <div className="text-xs text-blue-600">Configure</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Lock className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">{passwordSuccess}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handlePasswordChangeCancel}
              variant="outline"
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChangeSubmit}
              disabled={isChangingPassword}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, differenceInDays } from "date-fns"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  totalDays: number
  comments?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface LeaveRequestFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: LeaveRequest
}

const leaveTypes = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
]

export function LeaveRequestForm({ isOpen, onClose, onSuccess, editData }: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    reason: "",
    comments: "",
  })
  const [totalDays, setTotalDays] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (editData) {
      setFormData({
        leaveType: editData.leaveType,
        startDate: new Date(editData.startDate),
        endDate: new Date(editData.endDate),
        reason: editData.reason,
        comments: editData.comments || "",
      })
      setTotalDays(editData.totalDays)
    } else {
      // Reset form for new request
      setFormData({
        leaveType: "",
        startDate: null,
        endDate: null,
        reason: "",
        comments: "",
      })
      setTotalDays(0)
    }
    setError("")
  }, [editData, isOpen])

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = differenceInDays(formData.endDate, formData.startDate) + 1
      setTotalDays(Math.max(0, days))
    } else {
      setTotalDays(0)
    }
  }, [formData.startDate, formData.endDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.endDate < formData.startDate) {
      setError("End date must be after start date")
      return
    }

    if (totalDays <= 0) {
      setError("Invalid date range")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"

      const requestBody = {
        leaveType: formData.leaveType,
        startDate: format(formData.startDate, "yyyy-MM-dd"),
        endDate: format(formData.endDate, "yyyy-MM-dd"),
        reason: formData.reason.trim(),
        totalDays,
        comments: formData.comments.trim() || undefined,
      }

      let url = `${baseUrl}/leave/create`
      let method = "POST"

      if (editData) {
        url = `${baseUrl}/leave/update`
        method = "POST"
        Object.assign(requestBody, { id: editData.id })
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to submit leave request")
      }
    } catch (error) {
      console.error("Error submitting leave request:", error)
      setError("Failed to submit leave request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Leave Request" : "Create Leave Request"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <input
                type="date"
                value={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData({ 
                    ...formData, 
                    startDate: date,
                    // Reset end date if new start date is after current end date
                    endDate: formData.endDate && date && date > formData.endDate ? null : formData.endDate 
                  });
                }}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <input
                type="date"
                value={formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData({ ...formData, endDate: date });
                }}
                min={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                Total days: <span className="font-semibold">{totalDays}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for your leave request"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments</Label>
            <Textarea
              id="comments"
              placeholder="Any additional information (optional)"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editData ? "Update Request" : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

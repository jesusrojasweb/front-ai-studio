"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Edit3,
  Save,
  Upload,
  ChevronLeft,
  Info,
  Shield,
  ExternalLink,
  Loader2,
} from "lucide-react"

interface SafetyResult {
  status: "safe" | "needs-review" | "blocked"
  confidence: number
  reason?: string
  policyViolation?: string
  flaggedTimestamp?: number
  details?: string
}

interface PublishSettings {
  caption: string
  scheduledTime: string
  platforms: {
    fanvue: boolean
    tiktok: boolean
    instagram: boolean
  }
}

export default function SafetyCheck() {
  // Safety scan state
  const [isScanning, setIsScanning] = useState(true)
  const [safetyResult, setSafetyResult] = useState<SafetyResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Publish settings
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    caption: "Check out this amazing clip! 🔥 #content #creator",
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 hours from now
    platforms: {
      fanvue: true,
      tiktok: false,
      instagram: false,
    },
  })

  // UI states
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [showToast, setShowToast] = useState<{
    type: "info" | "warning" | "error" | "success"
    message: string
  } | null>(null)

  // Checklist state
  const [checklist, setChecklist] = useState({
    video: false,
    caption: false,
    schedule: false,
  })

  const captionRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Simulate safety scan
  useEffect(() => {
    const scanTimeout = setTimeout(() => {
      // Simulate different outcomes for demo
      const outcomes: SafetyResult[] = [
        {
          status: "safe",
          confidence: 0.93,
        },
        {
          status: "needs-review",
          confidence: 0.55,
          reason: "Low confidence detection",
          details: "Our AI detected potential policy concerns but isn't certain. A human reviewer can provide clarity.",
        },
        {
          status: "blocked",
          confidence: 0.85,
          policyViolation: "Adult content detected",
          flaggedTimestamp: 23.4,
          details: "Content appears to violate our community guidelines regarding adult material.",
        },
      ]

      // For demo, randomly select an outcome (weighted toward safe)
      const random = Math.random()
      let selectedOutcome
      if (random < 0.7) {
        selectedOutcome = outcomes[0] // Safe
      } else if (random < 0.9) {
        selectedOutcome = outcomes[1] // Needs review
      } else {
        selectedOutcome = outcomes[2] // Blocked
      }

      setSafetyResult(selectedOutcome)
      setIsScanning(false)

      // Update checklist
      setChecklist((prev) => ({
        ...prev,
        video: selectedOutcome.status !== "blocked",
      }))
    }, 3000)

    return () => clearTimeout(scanTimeout)
  }, [])

  // Update checklist when settings change
  useEffect(() => {
    setChecklist((prev) => ({
      ...prev,
      caption: publishSettings.caption.trim().length > 0,
      schedule: publishSettings.scheduledTime !== "",
    }))
  }, [publishSettings.caption, publishSettings.scheduledTime])

  // Handle caption edit
  const handleCaptionEdit = useCallback(() => {
    setIsEditingCaption(true)
    setTimeout(() => {
      captionRef.current?.focus()
    }, 0)
  }, [])

  const handleCaptionSave = useCallback(() => {
    setIsEditingCaption(false)
    setShowToast({
      type: "success",
      message: "Caption saved",
    })
    setTimeout(() => setShowToast(null), 3000)
  }, [])

  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPublishSettings((prev) => ({
      ...prev,
      caption: e.target.value,
    }))
  }, [])

  // Handle schedule change
  const handleScheduleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setPublishSettings((prev) => ({
      ...prev,
      scheduledTime: newTime,
    }))

    // Show engagement delta (simulated)
    const now = new Date()
    const scheduled = new Date(newTime)
    const hour = scheduled.getHours()

    let delta = 0
    if (hour >= 18 && hour <= 22) {
      delta = Math.floor(Math.random() * 20) + 5 // +5% to +25%
    } else if (hour >= 9 && hour <= 17) {
      delta = Math.floor(Math.random() * 10) - 5 // -5% to +5%
    } else {
      delta = Math.floor(Math.random() * 15) - 10 // -10% to +5%
    }

    if (delta !== 0) {
      setShowToast({
        type: "info",
        message: `Expected engagement: ${delta > 0 ? "+" : ""}${delta}%`,
      })
      setTimeout(() => setShowToast(null), 3000)
    }
  }, [])

  // Handle platform toggle
  const handlePlatformToggle = useCallback((platform: keyof PublishSettings["platforms"]) => {
    setPublishSettings((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform],
      },
    }))
  }, [])

  // Handle publish
  const handlePublish = useCallback(() => {
    if (!safetyResult || safetyResult.status === "blocked") return

    if (safetyResult.status === "needs-review") {
      setShowReviewModal(true)
      return
    }

    setShowPublishModal(true)
  }, [safetyResult])

  const confirmPublish = useCallback(() => {
    setShowPublishModal(false)
    setIsPublishing(true)

    // Simulate upload progress for each platform
    const activePlatforms = Object.entries(publishSettings.platforms)
      .filter(([_, active]) => active)
      .map(([platform]) => platform)

    activePlatforms.forEach((platform) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // Check if all uploads are complete
          setUploadProgress((prev) => {
            const newProgress = { ...prev, [platform]: 100 }
            const allComplete = activePlatforms.every((p) => newProgress[p] === 100)

            if (allComplete) {
              setTimeout(() => {
                setIsPublishing(false)
                setShowToast({
                  type: "success",
                  message: "Queued! We'll notify when live.",
                })
                setTimeout(() => {
                  router.push("/")
                }, 2000)
              }, 1000)
            }

            return newProgress
          })
        } else {
          setUploadProgress((prev) => ({
            ...prev,
            [platform]: progress,
          }))
        }
      }, 200)
    })
  }, [publishSettings.platforms, router])

  // Handle save as draft
  const handleSaveAsDraft = useCallback(() => {
    setShowToast({
      type: "success",
      message: "Saved as draft",
    })
    setTimeout(() => setShowToast(null), 3000)
  }, [])

  // Handle request review
  const handleRequestReview = useCallback(() => {
    setShowReviewModal(true)
  }, [])

  const submitReviewRequest = useCallback(() => {
    setShowReviewModal(false)
    setShowToast({
      type: "success",
      message: "Review request submitted. Expected response within 12 hours.",
    })
    setTimeout(() => setShowToast(null), 5000)
  }, [])

  // Handle back
  const handleBack = useCallback(() => {
    router.push("/clip-cutter/fine-tune")
  }, [router])

  // Format time for display
  const formatScheduledTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Get safety banner props
  const getSafetyBannerProps = () => {
    if (isScanning) {
      return {
        color: "bg-gray-900/50 text-gray-300",
        icon: <Loader2 size={20} className="animate-spin" />,
        title: "Running compliance scan...",
        subtitle: "Checking your content against our community guidelines",
      }
    }

    if (!safetyResult) return null

    switch (safetyResult.status) {
      case "safe":
        return {
          color: "bg-green-900/30 text-green-400 border border-green-500/30",
          icon: <Check size={20} />,
          title: "All good — compliant with policy",
          subtitle: `Confidence: ${(safetyResult.confidence * 100).toFixed(0)}%`,
        }
      case "needs-review":
        return {
          color: "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30",
          icon: <AlertTriangle size={20} />,
          title: `Low confidence (${safetyResult.confidence.toFixed(2)}) — manual review recommended`,
          subtitle: "Our AI isn't certain about this content",
        }
      case "blocked":
        return {
          color: "bg-red-900/30 text-red-400 border border-red-500/30",
          icon: <X size={20} />,
          title: `Policy violation: ${safetyResult.policyViolation}`,
          subtitle: "This content cannot be published in its current form",
        }
      default:
        return null
    }
  }

  const safetyBannerProps = getSafetyBannerProps()
  const canPublish = safetyResult?.status === "safe" && checklist.video && checklist.caption && checklist.schedule
  const needsReview = safetyResult?.status === "needs-review"
  const isBlocked = safetyResult?.status === "blocked"

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">4 / 4 · Finalize & publish</h1>
          <p className="text-sm text-gray-400">Last check before your audience sees it</p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Compliance panel (40%) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Safety & Compliance</h2>

            {/* Safety banner */}
            {safetyBannerProps && (
              <div className={`rounded-lg p-4 ${safetyBannerProps.color}`} role="status" aria-live="assertive">
                <div className="flex items-start gap-3">
                  {safetyBannerProps.icon}
                  <div className="flex-1">
                    <h3 className="font-medium">{safetyBannerProps.title}</h3>
                    <p className="text-sm opacity-80 mt-1">{safetyBannerProps.subtitle}</p>

                    {/* Action buttons */}
                    {needsReview && (
                      <button
                        onClick={handleRequestReview}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors"
                      >
                        Request human review
                      </button>
                    )}

                    {isBlocked && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
                        >
                          See why
                        </button>
                        <button
                          onClick={() => router.push("/clip-cutter/fine-tune")}
                          className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
                        >
                          Replace clip
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Details accordion */}
            {safetyResult && (safetyResult.details || safetyResult.flaggedTimestamp) && (
              <div className="bg-gray-900 rounded-lg">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span className="font-medium">Details & policy</span>
                  </div>
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showDetails && (
                  <div className="px-4 pb-4 space-y-3">
                    {safetyResult.details && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Reason</h4>
                        <p className="text-sm">{safetyResult.details}</p>
                      </div>
                    )}

                    {safetyResult.flaggedTimestamp && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Flagged content</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <span>Timestamp: {safetyResult.flaggedTimestamp}s</span>
                          <div className="w-16 h-9 bg-gray-800 rounded overflow-hidden">
                            <img
                              src="/placeholder.svg?height=36&width=64"
                              alt="Flagged frame"
                              className="w-full h-full object-cover blur-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <a href="#" className="text-green-400 hover:underline text-sm flex items-center gap-1">
                        Read full community guidelines
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Publish settings (35%) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Publish Settings</h2>

            {/* Caption */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Caption</h3>
                {!isEditingCaption ? (
                  <button
                    onClick={handleCaptionEdit}
                    className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCaptionSave}
                    className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                )}
              </div>

              {isEditingCaption ? (
                <textarea
                  ref={captionRef}
                  value={publishSettings.caption}
                  onChange={handleCaptionChange}
                  className="w-full bg-gray-800 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Write your caption..."
                />
              ) : (
                <p className="text-sm text-gray-300 bg-gray-800 rounded-md p-3">{publishSettings.caption}</p>
              )}
            </div>

            {/* Schedule */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium mb-3">Schedule</h3>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="datetime-local"
                  value={publishSettings.scheduledTime}
                  onChange={handleScheduleChange}
                  className="bg-gray-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm text-gray-400">({formatScheduledTime(publishSettings.scheduledTime)})</span>
              </div>
            </div>

            {/* Multi-platform */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium mb-3">Platforms</h3>
              <div className="space-y-3">
                {Object.entries(publishSettings.platforms).map(([platform, enabled]) => (
                  <label key={platform} className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        {platform === "fanvue" && "F"}
                        {platform === "tiktok" && "T"}
                        {platform === "instagram" && "I"}
                      </div>
                      <span className="capitalize">{platform}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={enabled}
                        onChange={() => handlePlatformToggle(platform as keyof PublishSettings["platforms"])}
                      />
                      <div className={`w-10 h-5 rounded-full ${enabled ? "bg-green-500" : "bg-gray-600"}`}></div>
                      <div
                        className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          enabled ? "transform translate-x-5" : ""
                        }`}
                      ></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Status footer (25%) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Ready to publish?</h2>

            {/* Checklist */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium mb-3">Checklist</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      checklist.video ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    {checklist.video && <Check size={12} />}
                  </div>
                  <span className={checklist.video ? "text-white" : "text-gray-400"}>
                    Video scan {checklist.video ? "passed" : "pending"}
                  </span>
                  {checklist.video && safetyResult && (
                    <span className="text-xs text-gray-400">
                      (Score: {(safetyResult.confidence * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      checklist.caption ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    {checklist.caption && <Check size={12} />}
                  </div>
                  <span className={checklist.caption ? "text-white" : "text-gray-400"}>
                    Caption {checklist.caption ? "ready" : "required"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      checklist.schedule ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    {checklist.schedule && <Check size={12} />}
                  </div>
                  <span className={checklist.schedule ? "text-white" : "text-gray-400"}>
                    Schedule {checklist.schedule ? "set" : "required"}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload progress */}
            {isPublishing && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-medium mb-3">Publishing...</h3>
                <div className="space-y-2">
                  {Object.entries(publishSettings.platforms)
                    .filter(([_, enabled]) => enabled)
                    .map(([platform]) => (
                      <div key={platform} className="flex items-center gap-3">
                        <span className="capitalize w-20">{platform}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[platform] || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">{Math.round(uploadProgress[platform] || 0)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-16 border-t border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-md hover:bg-gray-800 transition-colors flex items-center"
          >
            <ChevronLeft size={18} className="mr-1" />
            Back to editing
          </button>
          <button
            onClick={handleSaveAsDraft}
            className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
          >
            Save as draft
          </button>
        </div>

        <div className="flex items-center gap-3">
          {needsReview && (
            <button
              onClick={handleRequestReview}
              className="px-6 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-500 transition-colors"
            >
              Request review
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={!canPublish && !needsReview}
            className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} className="mr-1" />
            Publish
          </button>
        </div>
      </div>

      {/* Publish confirmation modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm publish</h3>
            <div className="space-y-3 mb-6">
              <p>
                Publish to <strong>Fanvue</strong> on{" "}
                <strong>{formatScheduledTime(publishSettings.scheduledTime)}</strong>
              </p>
              {Object.entries(publishSettings.platforms).some(
                ([platform, enabled]) => enabled && platform !== "fanvue",
              ) && <p>Other platforms will publish immediately.</p>}
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Auto-publish caption translations</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                className="px-4 py-2 bg-green-500 text-black rounded-md hover:bg-green-400 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review request modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Request human review</h3>
            <p className="mb-4">
              Our AI isn't certain about this content. A human reviewer can provide clarity within 12 hours.
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Additional context (optional)</label>
                <textarea
                  className="w-full bg-gray-800 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Provide any additional context that might help the reviewer..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supporting documents</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.png,.doc,.docx"
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-gray-800 file:text-white hover:file:bg-gray-700"
                />
                <p className="text-xs text-gray-400 mt-1">ID, release forms, or other relevant documents</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReviewRequest}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors"
              >
                Submit request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-fade-in ${
            showToast.type === "success"
              ? "bg-green-900/80 text-white"
              : showToast.type === "info"
                ? "bg-blue-900/80 text-white"
                : showToast.type === "warning"
                  ? "bg-yellow-900/80 text-white"
                  : "bg-red-900/80 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {showToast.type === "success" && <Check size={20} className="text-green-400" />}
          {showToast.type === "info" && <Info size={20} className="text-blue-400" />}
          {showToast.type === "warning" && <AlertTriangle size={20} className="text-yellow-400" />}
          {showToast.type === "error" && <AlertTriangle size={20} className="text-red-400" />}
          <div className="flex-1">{showToast.message}</div>
        </div>
      )}
    </div>
  )
}

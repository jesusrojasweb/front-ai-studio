'use client'

import type React from 'react'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAtom } from 'jotai'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react'

// Services
import { jobsService } from '@/lib/services/jobs.service'
import { clipsService } from '@/lib/services/clips.service'
import {
  websocketService,
  type JobDoneEvent
} from '@/lib/services/websocket.service'

// Store
import {
  currentVideoIdAtom,
  currentJobAtom,
  processingStateAtom,
  currentClipsAtom,
  selectedClipAtom,
  processingProgressAtom,
  processingErrorAtom,
  setCurrentVideoAction,
  setJobAction,
  setClipsAction,
  selectClipAction
} from '@/lib/store/clip-cutter.store'

// Types
import type { ClipEntity } from '@/lib/services/clips.service'

export default function ClipSuggestions() {
  // Router
  const router = useRouter()
  const searchParams = useSearchParams()

  // Store state
  const [currentVideoId] = useAtom(currentVideoIdAtom)
  const [currentJob] = useAtom(currentJobAtom)
  const [processingState, setProcessingState] = useAtom(processingStateAtom)
  const [currentClips] = useAtom(currentClipsAtom)
  const [selectedClip] = useAtom(selectedClipAtom)
  const [processingProgress, setProcessingProgress] = useAtom(
    processingProgressAtom
  )
  const [processingError, setProcessingError] = useAtom(processingErrorAtom)

  // Actions
  const [, setVideoAction] = useAtom(setCurrentVideoAction)
  const [, setJobActionFn] = useAtom(setJobAction)
  const [, setClipsActionFn] = useAtom(setClipsAction)
  const [, selectClipActionFn] = useAtom(selectClipAction)

  // Local state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [regenerateCount, setRegenerateCount] = useState(2)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showRationale, setShowRationale] = useState(false)
  const [showToast, setShowToast] = useState<{
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)

  // Get videoId from URL params and initialize
  useEffect(() => {
    const videoIdParam = searchParams.get('videoId')

    if (videoIdParam && videoIdParam !== currentVideoId) {
      console.log('🎬 Initializing video processing for:', videoIdParam)
      setVideoAction(videoIdParam)

      // Start processing job
      startVideoProcessing(videoIdParam)
    } else if (!videoIdParam) {
      // Redirect back if no video ID
      console.warn('⚠️ No videoId provided, redirecting to upload')
      router.push('/clip-cutter')
    }
  }, [searchParams, currentVideoId, setVideoAction, router])

  // WebSocket listener for job completion
  useEffect(() => {
    const unsubscribe = websocketService.on<JobDoneEvent>(
      'job.done',
      (event) => {
        console.log('📡 Received job.done event:', event)

        // Check if this event is for our current job
        if (currentJob && event.jobId === currentJob.id) {
          if (event.state === 'SUCCEEDED') {
            // Job completed successfully, fetch clips
            if (currentVideoId) {
              fetchClips(currentVideoId)
            }
          } else if (event.state === 'FAILED') {
            // Job failed
            setProcessingState('failed')
            setProcessingError(event.error || 'Video processing failed')
            setShowToast({
              type: 'error',
              message: 'Video processing failed. Please try again.'
            })
          }
        }
      }
    )

    return unsubscribe
  }, [currentJob, currentVideoId, setProcessingState, setProcessingError])

  // Start video processing
  const startVideoProcessing = async (videoId: string) => {
    try {
      setProcessingState('analyzing')
      setProcessingProgress(10)

      console.log('🚀 Starting cut job for video:', videoId)

      // Create cut job
      const { jobId } = await jobsService.createCutJob(videoId, { maxClips: 4 })

      console.log('✅ Cut job created:', jobId)

      // Get job details
      const job = await jobsService.getJobById(jobId)
      setJobActionFn(job)

      setShowToast({
        type: 'info',
        message: 'Video analysis started. This may take a few minutes...'
      })

      // Connect to WebSocket if not connected
      if (!websocketService.isConnected()) {
        websocketService.connect()
      }
    } catch (error) {
      console.error('❌ Failed to start video processing:', error)
      setProcessingState('failed')
      setProcessingError(
        error instanceof Error ? error.message : 'Failed to start processing'
      )
      setShowToast({
        type: 'error',
        message: 'Failed to start video analysis. Please try again.'
      })
    }
  }

  // Fetch clips after processing completes
  const fetchClips = async (videoId: string) => {
    try {
      console.log('📥 Fetching clips for video:', videoId)

      const clips = await clipsService.getClipsByVideoId(videoId, 'DRAFT')

      console.log('✅ Clips fetched:', clips.length)
      setClipsActionFn(clips)

      if (clips.length > 0) {
        setProcessingState('completed')
        setShowToast({
          type: 'success',
          message: `${clips.length} clips generated successfully!`
        })
      } else {
        setProcessingState('failed')
        setProcessingError('No clips were generated from this video')
        setShowToast({
          type: 'warning',
          message: 'No clips were generated. Try uploading a different video.'
        })
      }
    } catch (error) {
      console.error('❌ Failed to fetch clips:', error)
      setProcessingState('failed')
      setProcessingError(
        error instanceof Error ? error.message : 'Failed to fetch clips'
      )
      setShowToast({
        type: 'error',
        message: 'Failed to load clips. Please refresh the page.'
      })
    }
  }

  // Handle video playback with native video element (for pre-cut clips)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      if (selectedClip) {
        const videoCurrentTime = video.currentTime

        // For pre-cut clips, video time IS the relative time (starts at 0)
        setCurrentTime(videoCurrentTime)

        // Debug log (remove in production)
        if (Math.floor(videoCurrentTime * 10) % 10 === 0) {
          console.log(
            `⏰ Time update - Video: ${videoCurrentTime.toFixed(
              2
            )}s (pre-cut clip)`
          )
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleLoadedMetadata = () => {
      if (selectedClip) {
        console.log(
          `📼 Video metadata loaded for clip ${selectedClip.id}, duration: ${video.duration}s`
        )

        // For pre-cut clips, always start at 0
        video.currentTime = 0
        setCurrentTime(0)
      }
    }

    const handleCanPlay = () => {
      console.log(`🎵 Pre-cut clip can play, duration: ${video.duration}s`)
    }

    const handleError = (e: Event) => {
      console.error(`❌ Video error:`, e)
      setShowToast({
        type: 'error',
        message: 'Error loading video clip'
      })
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [selectedClip])

  // Set video when clip changes (for pre-cut clips)
  useEffect(() => {
    const video = videoRef.current
    if (video && selectedClip) {
      // Reset playing state first
      setIsPlaying(false)

      console.log(`🎬 Loading pre-cut clip ${selectedClip.id}:`, {
        originalStartMs: selectedClip.start_ms,
        originalEndMs: selectedClip.end_ms,
        clipDuration: selectedClip.duration_ms / 1000,
        file_url: selectedClip.file_url,
        thumb_url: selectedClip.thumb_url
      })

      // For pre-cut clips, reset to beginning
      setCurrentTime(0)
    }
  }, [selectedClip])

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video || !selectedClip) return

    if (isPlaying) {
      video.pause()
    } else {
      // For pre-cut clips, just play from current position
      video.play().catch((error) => {
        console.error('❌ Failed to play video:', error)
        setShowToast({
          type: 'error',
          message: 'Failed to play video clip'
        })
      })
    }
  }, [isPlaying, selectedClip])

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = Number.parseFloat(e.target.value)
      const video = videoRef.current

      if (selectedClip && video) {
        const clipDuration = selectedClip.duration_ms / 1000

        // Ensure we don't go beyond the clip duration
        const clampedTime = Math.min(newTime, clipDuration)

        // For pre-cut clips, directly set the video time (no offset needed)
        video.currentTime = clampedTime
        setCurrentTime(clampedTime)
      }
    },
    [selectedClip]
  )

  const handleClipSelect = useCallback(
    (clip: ClipEntity) => {
      const video = videoRef.current
      if (video) {
        video.pause()
      }

      selectClipActionFn(clip)
      setCurrentTime(0)
      setIsPlaying(false)
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [selectClipActionFn]
  )

  const handleRegenerate = useCallback(async () => {
    if (regenerateCount <= 0 || !currentVideoId) return

    setIsRegenerating(true)
    setRegenerateCount((prev) => prev - 1)

    try {
      // Create new cut job
      const { jobId } = await jobsService.createCutJob(currentVideoId, {
        maxClips: 4
      })
      const job = await jobsService.getJobById(jobId)
      setJobActionFn(job)

      setProcessingState('analyzing')
      setShowToast({
        type: 'info',
        message: 'Regenerating clips...'
      })
    } catch (error) {
      console.error('❌ Failed to regenerate clips:', error)
      setShowToast({
        type: 'error',
        message: 'Failed to regenerate clips. Please try again.'
      })
    } finally {
      setIsRegenerating(false)
    }
  }, [regenerateCount, currentVideoId, setJobActionFn, setProcessingState])

  const handleNext = useCallback(() => {
    if (selectedClip) {
      router.push('/clip-cutter/fine-tune')
    }
  }, [selectedClip, router])

  const handleBack = useCallback(() => {
    router.push('/clip-cutter')
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.round(seconds)
    if (totalSeconds < 60) {
      return `${totalSeconds}s`
    }
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    if (secs === 0) {
      return `${mins}m`
    }
    return `${mins}m ${secs}s`
  }

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) {
      return { color: 'bg-green-900/30 text-green-400', label: 'Great' }
    } else if (score >= 0.7) {
      return { color: 'bg-yellow-900/30 text-yellow-400', label: 'Good' }
    } else {
      return { color: 'bg-gray-900/30 text-gray-400', label: 'Fair' }
    }
  }

  // Auto-dismiss toasts
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Render loading state
  if (processingState === 'analyzing') {
    return (
      <div className="flex flex-col h-full bg-black text-white">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">2 / 4 · Choose your clip</h1>
            <p className="text-sm text-gray-400">Analyzing your video...</p>
          </div>
        </header>

        {/* Loading content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="relative">
              <Loader2
                size={64}
                className="animate-spin text-green-500 mx-auto"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Analyzing your video</h2>
              <p className="text-gray-400 mb-4">
                Our AI is finding the best moments in your video. This usually
                takes 1-3 minutes.
              </p>

              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {processingProgress}% complete
              </p>
            </div>

            {currentJob && (
              <div className="bg-gray-900/50 rounded-lg p-4 text-sm">
                <p className="text-gray-400">Job ID: {currentJob.id}</p>
                <p className="text-gray-400">Status: {currentJob.state}</p>
                {currentJob.attempts > 0 && (
                  <p className="text-gray-400">
                    Attempts: {currentJob.attempts}/{currentJob.max_attempts}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-16 border-t border-gray-800 px-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-md hover:bg-gray-800 transition-colors flex items-center"
          >
            <ChevronLeft size={18} className="mr-1" />
            Back
          </button>

          <button
            disabled
            className="px-6 py-2 bg-gray-600 text-gray-400 font-medium rounded-md cursor-not-allowed flex items-center"
          >
            Next
            <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
      </div>
    )
  }

  // Render error state
  if (processingState === 'failed') {
    return (
      <div className="flex flex-col h-full bg-black text-white">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">2 / 4 · Choose your clip</h1>
            <p className="text-sm text-gray-400">Processing failed</p>
          </div>
        </header>

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <AlertTriangle size={64} className="text-red-500 mx-auto" />

            <div>
              <h2 className="text-2xl font-bold mb-2">Processing failed</h2>
              <p className="text-gray-400 mb-4">
                {processingError ||
                  'Something went wrong while analyzing your video.'}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    currentVideoId && startVideoProcessing(currentVideoId)
                  }
                  className="w-full px-4 py-2 bg-green-500 text-black rounded-md hover:bg-green-400 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={handleBack}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Upload different video
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render clips (completed state)
  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">2 / 4 · Choose your clip</h1>
          <p className="text-sm text-gray-400">
            Pick the best ≤ 5 min highlight
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Preview rail (40%) */}
          <div className="bg-[#1A1A1A] border-b border-gray-800 p-6 flex flex-col justify-center">
            <div className="max-w-4xl mx-auto w-full">
              {/* Hero player */}
              <div
                className="relative bg-black rounded-lg overflow-hidden mb-4"
                style={{ aspectRatio: '16/9' }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster={selectedClip?.thumb_url}
                  muted={false}
                  loop={false}
                  controls={false}
                  preload="metadata"
                  src={selectedClip?.file_url}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Play/Pause overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? (
                      <Pause size={24} />
                    ) : (
                      <Play size={24} className="ml-1" />
                    )}
                  </button>
                </div>

                {/* Time overlay */}
                {selectedClip && (
                  <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded text-sm">
                    {formatTime(currentTime)} /{' '}
                    {formatTime(selectedClip.duration_ms / 1000)}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Scrub bar */}
                <div className="flex-1">
                  {selectedClip && (
                    <>
                      <input
                        type="range"
                        min="0"
                        max={selectedClip.duration_ms / 1000}
                        step="0.1"
                        value={currentTime}
                        onChange={handleScrub}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        aria-label="Video timeline"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>
                          {formatTime(selectedClip.duration_ms / 1000)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Regenerate button */}
                <button
                  onClick={handleRegenerate}
                  disabled={regenerateCount <= 0 || isRegenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Regenerate suggestions (${regenerateCount} remaining)`}
                >
                  <RotateCcw
                    size={16}
                    className={isRegenerating ? 'animate-spin' : ''}
                  />
                  <span>Regenerate ({regenerateCount} left)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid de sugerencias (60%) */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>

              {currentClips.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No clips available</p>
                </div>
              ) : (
                <fieldset>
                  <legend className="sr-only">Choose a clip suggestion</legend>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentClips.map((clip) => {
                      const isSelected = selectedClip?.id === clip.id
                      const scoreBadge = getScoreBadge(clip.score)

                      return (
                        <div
                          key={clip.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          className={`relative cursor-pointer rounded-lg overflow-hidden transition-all hover:scale-105 ${
                            isSelected
                              ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/20'
                              : 'hover:ring-1 hover:ring-green-400/50'
                          }`}
                          onClick={() => handleClipSelect(clip)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleClipSelect(clip)
                            }
                          }}
                          title="Click to preview in player"
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-video bg-gray-800">
                            <img
                              src={clip.thumb_url || '/placeholder.svg'}
                              alt={`Clip suggestion: ${formatTime(
                                clip.start_ms / 1000
                              )}-${formatTime(clip.end_ms / 1000)}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Time overlay */}
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                              {formatTime(clip.start_ms / 1000)}–
                              {formatTime(clip.end_ms / 1000)}
                            </div>

                            {/* Duration chip */}
                            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                              {formatDuration(clip.duration_ms / 1000)}
                            </div>

                            {/* Score badge */}
                            <div
                              className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs flex items-center ${scoreBadge.color}`}
                            >
                              <span className="mr-1">▲</span>
                              {clip.score.toFixed(2)}
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-green-400/10 flex items-center justify-center">
                                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                                  <Play
                                    size={16}
                                    className="text-black ml-0.5"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Label */}
                          <div className="p-3">
                            <p className="font-medium text-sm mb-1">
                              Clip {currentClips.indexOf(clip) + 1}
                            </p>
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded text-xs ${scoreBadge.color}`}
                            >
                              {scoreBadge.label}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </fieldset>
              )}

              {/* Need other options */}
              {regenerateCount <= 0 && (
                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">
                    Not satisfied with the suggestions?
                  </p>
                  <button
                    onClick={() => router.push('/clip-cutter/fine-tune')}
                    className="text-green-400 hover:underline text-sm"
                  >
                    Manual trim instead →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-80 border-l border-gray-800 p-6 overflow-y-auto">
          <div className="bg-[#1A1A1A] rounded-lg">
            <button
              onClick={() => setShowRationale(!showRationale)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-green-400" />
                <span className="font-medium">Why these clips?</span>
              </div>
              {showRationale ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {showRationale && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-sm text-gray-400 mb-3">
                  Our AI analyzes your video for optimal clip points using:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Movement activity peaks and natural transitions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Audio amplitude and speech pattern analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Visual composition and lighting quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Engagement prediction based on similar content</span>
                  </li>
                </ul>

                {selectedClip && (
                  <div className="mt-4 p-3 bg-gray-800/50 rounded">
                    <p className="text-xs text-gray-400 mb-1">
                      Selected clip details:
                    </p>
                    <p className="text-sm">
                      Score: {selectedClip.score.toFixed(2)} | Duration:{' '}
                      {formatDuration(selectedClip.duration_ms / 1000)} |
                      Safety: {selectedClip.safety_status}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-16 border-t border-gray-800 px-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-md hover:bg-gray-800 transition-colors flex items-center"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedClip}
          className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-fade-in ${
            showToast.type === 'info'
              ? 'bg-blue-900/80 text-white'
              : showToast.type === 'warning'
              ? 'bg-yellow-900/80 text-white'
              : showToast.type === 'success'
              ? 'bg-green-900/80 text-white'
              : 'bg-red-900/80 text-white'
          }`}
        >
          {showToast.type === 'success' && (
            <Check size={20} className="text-green-400" />
          )}
          {showToast.type === 'info' && (
            <Loader2 size={20} className="text-blue-400" />
          )}
          {showToast.type === 'warning' && (
            <AlertTriangle size={20} className="text-yellow-400" />
          )}
          {showToast.type === 'error' && (
            <AlertTriangle size={20} className="text-red-400" />
          )}
          <div className="flex-1">{showToast.message}</div>
          <button
            onClick={() => setShowToast(null)}
            className="text-gray-300 hover:text-white"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

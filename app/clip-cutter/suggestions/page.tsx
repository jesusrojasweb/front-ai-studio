'use client'

import type React from 'react'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react'

interface ClipSuggestion {
  id: string
  startTime: number
  endTime: number
  duration: number
  score: number
  thumbnail: string
  label: string
  reasoning: string
}

export default function ClipSuggestions() {
  const [suggestions] = useState<ClipSuggestion[]>([
    {
      id: '1',
      startTime: 5,
      endTime: 45,
      duration: 40,
      score: 0.89,
      thumbnail: '/placeholder.svg?height=180&width=320',
      label: 'Scene change at 00:32',
      reasoning: 'High movement activity and natural transition point detected'
    },
    {
      id: '2',
      startTime: 12,
      endTime: 58,
      duration: 46,
      score: 0.83,
      thumbnail: '/placeholder.svg?height=180&width=320',
      label: 'Audio peak sequence',
      reasoning: 'Strong audio engagement with clear speech patterns'
    },
    {
      id: '3',
      startTime: 25,
      endTime: 60,
      duration: 35,
      score: 0.76,
      thumbnail: '/placeholder.svg?height=180&width=320',
      label: 'Action highlight',
      reasoning: 'Peak visual activity with good lighting conditions'
    },
    {
      id: '4',
      startTime: 2,
      endTime: 42,
      duration: 40,
      score: 0.72,
      thumbnail: '/placeholder.svg?height=180&width=320',
      label: 'Opening sequence',
      reasoning: 'Strong opening with consistent framing'
    }
  ])

  const [selectedClip, setSelectedClip] = useState<ClipSuggestion>(
    suggestions[0]
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [regenerateCount, setRegenerateCount] = useState(2)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showRationale, setShowRationale] = useState(false)
  const [showToast, setShowToast] = useState<{
    type: 'info' | 'warning' | 'error'
    message: string
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  // Simulate video playback
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1
          if (newTime >= selectedClip.duration) {
            setIsPlaying(false)
            return 0 // Loop back to start
          }
          return newTime
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isPlaying, selectedClip.duration])

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseFloat(e.target.value)
    if (newTime > 60) {
      setShowToast({
        type: 'warning',
        message: 'Clips are limited to 60 seconds'
      })
      setTimeout(() => setShowToast(null), 3000)
      return
    }
    setCurrentTime(newTime)
  }, [])

  const handleClipSelect = useCallback((clip: ClipSuggestion) => {
    setSelectedClip(clip)
    setCurrentTime(0)
    setIsPlaying(false)
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRegenerate = useCallback(() => {
    if (regenerateCount <= 0) return

    setIsRegenerating(true)
    setRegenerateCount((prev) => prev - 1)

    // Simulate regeneration delay
    setTimeout(() => {
      setIsRegenerating(false)
      setShowToast({
        type: 'info',
        message: 'New suggestions generated'
      })
      setTimeout(() => setShowToast(null), 3000)
    }, 2000)
  }, [regenerateCount])

  const handleNext = useCallback(() => {
    // Pass selected clip data to next step
    router.push('/clip-cutter/fine-tune')
  }, [router])

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

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) {
      return { color: 'bg-green-900/30 text-green-400', label: 'Great' }
    } else if (score >= 0.7) {
      return { color: 'bg-yellow-900/30 text-yellow-400', label: 'Good' }
    } else {
      return { color: 'bg-gray-900/30 text-gray-400', label: 'Fair' }
    }
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">2 / 4 · Choose your clip</h1>
          <p className="text-sm text-gray-400">
            Pick the best ≤ 60 s highlight
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main panel */}
        <div className="flex-1 flex flex-col">
          {/* Preview rail (40%) */}
          <div className="h-[40%] bg-[#1A1A1A] border-b border-gray-800 p-6 flex flex-col justify-center">
            <div className="max-w-4xl mx-auto w-full">
              {/* Hero player */}
              <div
                className="relative bg-black rounded-lg overflow-hidden mb-4"
                style={{ aspectRatio: '16/9' }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster={selectedClip.thumbnail}
                  muted
                  loop={false}
                >
                  <source src="/placeholder-video.mp4" type="video/mp4" />
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
                <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded text-sm">
                  {formatTime(selectedClip.startTime + currentTime)} -{' '}
                  {formatTime(selectedClip.endTime)}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Scrub bar */}
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={selectedClip.duration}
                    step="0.1"
                    value={currentTime}
                    onChange={handleScrub}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    aria-label="Video timeline"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{selectedClip.duration}s</span>
                  </div>
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
          <div className="h-[60%] p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>

              {isRegenerating ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-800 rounded-lg aspect-video mb-2"></div>
                      <div className="h-4 bg-gray-800 rounded mb-1"></div>
                      <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <fieldset>
                  <legend className="sr-only">Choose a clip suggestion</legend>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {suggestions.map((clip) => {
                      const isSelected = selectedClip.id === clip.id
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
                              src={clip.thumbnail || '/placeholder.svg'}
                              alt={`Clip suggestion: ${clip.label}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Time overlay */}
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                              {formatTime(clip.startTime)}–
                              {formatTime(clip.endTime)}
                            </div>

                            {/* Duration chip */}
                            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                              {clip.duration}s
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
                              {clip.label}
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
                      Selected clip reasoning:
                    </p>
                    <p className="text-sm">{selectedClip.reasoning}</p>
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
              : 'bg-red-900/80 text-white'
          }`}
        >
          {showToast.type === 'warning' && (
            <AlertTriangle size={20} className="text-yellow-400" />
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

'use client'

import type React from 'react'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  Check,
  Info
} from 'lucide-react'

interface ClipState {
  startTime: number
  endTime: number
  originalStartTime: number
  originalEndTime: number
  quality: 'original' | 'compressed'
}

interface HistoryAction {
  startTime: number
  endTime: number
  description: string
}

export default function FineTuneClip() {
  // Clip state
  const [clipState, setClipState] = useState<ClipState>({
    startTime: 5,
    endTime: 45,
    originalStartTime: 5,
    originalEndTime: 45,
    quality: 'original'
  })

  // UI states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(clipState.startTime)
  const [zoomLevel, setZoomLevel] = useState(1) // 1-5 scale
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)
  const [showQualityWarning, setShowQualityWarning] = useState(false)
  const [showToast, setShowToast] = useState<{
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
  } | null>(null)

  // History for undo/redo
  const [history, setHistory] = useState<HistoryAction[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const startHandleRef = useRef<HTMLDivElement>(null)
  const endHandleRef = useRef<HTMLDivElement>(null)
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Calculate duration
  const duration = clipState.endTime - clipState.startTime

  // Generate waveform data (simulated)
  const generateWaveformData = useCallback(() => {
    const totalPoints = 100
    const data = []
    for (let i = 0; i < totalPoints; i++) {
      // Generate random amplitude between 0.1 and 1
      // With some patterns to simulate speech/silence
      let amplitude
      if (i % 15 === 0) {
        amplitude = 0.1 // Simulate silence
      } else if (i % 7 === 0) {
        amplitude = 0.9 // Simulate peak
      } else {
        amplitude = 0.3 + Math.random() * 0.5
      }
      data.push(amplitude)
    }
    return data
  }, [])

  const waveformData = generateWaveformData()

  // Simulate video playback
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1
          if (newTime >= clipState.endTime) {
            setIsPlaying(false)
            return clipState.startTime // Loop back to start
          }
          return newTime
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isPlaying, clipState.startTime, clipState.endTime])

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (currentTime >= clipState.endTime) {
      setCurrentTime(clipState.startTime)
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, currentTime, clipState.startTime, clipState.endTime])

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  // Handle timeline click
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const totalVideoDuration = 60 // Assuming 60s total video duration
      const clickTime =
        clipState.startTime +
        clickPosition * (clipState.endTime - clipState.startTime)

      // Clamp to valid range
      const newTime = Math.max(0, Math.min(clickTime, totalVideoDuration))
      setCurrentTime(newTime)

      if (videoRef.current) {
        videoRef.current.currentTime = newTime
      }
    },
    [clipState.startTime, clipState.endTime]
  )

  // Handle start handle drag
  const handleStartHandleDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDraggingStart(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const position = (moveEvent.clientX - rect.left) / rect.width
        const totalVideoDuration = 60 // Assuming 60s total video duration
        const newStartTime = Math.max(
          0,
          Math.min(position * totalVideoDuration, clipState.endTime - 1)
        )

        // Snap to nearest 0.1s
        const snappedStartTime = Math.round(newStartTime * 10) / 10

        setClipState((prev) => ({
          ...prev,
          startTime: snappedStartTime
        }))
        setCurrentTime(snappedStartTime)
      }

      const handleMouseUp = () => {
        setIsDraggingStart(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        // Add to history if changed
        if (clipState.startTime !== clipState.originalStartTime) {
          addToHistory({
            startTime: clipState.startTime,
            endTime: clipState.endTime,
            description: `Set start time to ${formatTime(clipState.startTime)}`
          })
          triggerAutosave()
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [clipState.endTime, clipState.startTime, clipState.originalStartTime]
  )

  // Handle end handle drag
  const handleEndHandleDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDraggingEnd(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const position = (moveEvent.clientX - rect.left) / rect.width
        const totalVideoDuration = 60 // Assuming 60s total video duration
        const newEndTime = Math.max(
          clipState.startTime + 1,
          Math.min(position * totalVideoDuration, totalVideoDuration)
        )

        // Snap to nearest 0.1s
        const snappedEndTime = Math.round(newEndTime * 10) / 10

        setClipState((prev) => ({
          ...prev,
          endTime: snappedEndTime
        }))
      }

      const handleMouseUp = () => {
        setIsDraggingEnd(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        // Add to history if changed
        if (clipState.endTime !== clipState.originalEndTime) {
          addToHistory({
            startTime: clipState.startTime,
            endTime: clipState.endTime,
            description: `Set end time to ${formatTime(clipState.endTime)}`
          })
          triggerAutosave()
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [clipState.startTime, clipState.endTime, clipState.originalEndTime]
  )

  // Handle zoom change
  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoomLevel(Number(e.target.value))
    },
    []
  )

  // Handle quality toggle
  const handleQualityToggle = useCallback(() => {
    if (clipState.quality === 'original') {
      setShowQualityWarning(true)
    } else {
      setClipState((prev) => ({
        ...prev,
        quality: 'original'
      }))
      addToHistory({
        startTime: clipState.startTime,
        endTime: clipState.endTime,
        description: 'Set quality to original'
      })
      triggerAutosave()
    }
  }, [clipState.quality, clipState.startTime, clipState.endTime])

  // Confirm quality change
  const confirmQualityChange = useCallback(() => {
    setClipState((prev) => ({
      ...prev,
      quality: 'compressed'
    }))
    setShowQualityWarning(false)
    addToHistory({
      startTime: clipState.startTime,
      endTime: clipState.endTime,
      description: 'Set quality to compressed'
    })
    triggerAutosave()
  }, [clipState.startTime, clipState.endTime])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Play/Pause with Space
      if (e.key === ' ') {
        e.preventDefault()
        handlePlayPause()
      }

      // Nudge start/end points with arrow keys
      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault()
        setClipState((prev) => ({
          ...prev,
          startTime: Math.max(0, prev.startTime - 0.1)
        }))
        addToHistory({
          startTime: Math.max(0, clipState.startTime - 0.1),
          endTime: clipState.endTime,
          description: `Nudged start time to ${formatTime(
            Math.max(0, clipState.startTime - 0.1)
          )}`
        })
        triggerAutosave()
      }

      if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault()
        setClipState((prev) => ({
          ...prev,
          startTime: Math.min(prev.endTime - 1, prev.startTime + 0.1)
        }))
        addToHistory({
          startTime: Math.min(clipState.endTime - 1, clipState.startTime + 0.1),
          endTime: clipState.endTime,
          description: `Nudged start time to ${formatTime(
            Math.min(clipState.endTime - 1, clipState.startTime + 0.1)
          )}`
        })
        triggerAutosave()
      }

      if (e.key === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault()
        setClipState((prev) => ({
          ...prev,
          endTime: Math.max(prev.startTime + 1, prev.endTime - 0.1)
        }))
        addToHistory({
          startTime: clipState.startTime,
          endTime: Math.max(clipState.startTime + 1, clipState.endTime - 0.1),
          description: `Nudged end time to ${formatTime(
            Math.max(clipState.startTime + 1, clipState.endTime - 0.1)
          )}`
        })
        triggerAutosave()
      }

      if (e.key === 'ArrowRight' && e.shiftKey) {
        e.preventDefault()
        setClipState((prev) => ({
          ...prev,
          endTime: Math.min(60, prev.endTime + 0.1)
        }))
        addToHistory({
          startTime: clipState.startTime,
          endTime: Math.min(60, clipState.endTime + 0.1),
          description: `Nudged end time to ${formatTime(
            Math.min(60, clipState.endTime + 0.1)
          )}`
        })
        triggerAutosave()
      }

      // Undo/Redo
      if (e.key === 'z' && e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }

      if (
        (e.key === 'z' && e.ctrlKey && e.shiftKey) ||
        (e.key === 'y' && e.ctrlKey)
      ) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePlayPause, clipState.startTime, clipState.endTime])

  // Add to history
  const addToHistory = useCallback(
    (action: HistoryAction) => {
      // If we're not at the end of the history, truncate
      if (historyIndex < history.length - 1) {
        setHistory(history.slice(0, historyIndex + 1))
      }

      setHistory((prev) => [...prev, action])
      setHistoryIndex((prev) => prev + 1)
    },
    [history, historyIndex]
  )

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const action = history[newIndex]
      setClipState((prev) => ({
        ...prev,
        startTime: action.startTime,
        endTime: action.endTime
      }))
      setHistoryIndex(newIndex)
      setShowToast({
        type: 'info',
        message: `Undo: ${action.description}`
      })
      setTimeout(() => setShowToast(null), 3000)
      triggerAutosave()
    }
  }, [history, historyIndex])

  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const action = history[newIndex]
      setClipState((prev) => ({
        ...prev,
        startTime: action.startTime,
        endTime: action.endTime
      }))
      setHistoryIndex(newIndex)
      setShowToast({
        type: 'info',
        message: `Redo: ${action.description}`
      })
      setTimeout(() => setShowToast(null), 3000)
      triggerAutosave()
    }
  }, [history, historyIndex])

  // Handle reset
  const handleReset = useCallback(() => {
    setClipState((prev) => ({
      ...prev,
      startTime: prev.originalStartTime,
      endTime: prev.originalEndTime,
      quality: 'original'
    }))
    addToHistory({
      startTime: clipState.originalStartTime,
      endTime: clipState.originalEndTime,
      description: 'Reset to original'
    })
    setShowToast({
      type: 'info',
      message: 'Reset to original clip'
    })
    setTimeout(() => setShowToast(null), 3000)
    triggerAutosave()
  }, [clipState.originalStartTime, clipState.originalEndTime])

  // Handle next
  const handleNext = useCallback(() => {
    if (duration > 60) {
      setShowToast({
        type: 'error',
        message: 'Clip duration cannot exceed 60 seconds'
      })
      setTimeout(() => setShowToast(null), 3000)
      return
    }

    if (duration <= 0) {
      setShowToast({
        type: 'error',
        message: 'Clip duration must be greater than 0'
      })
      setTimeout(() => setShowToast(null), 3000)
      return
    }

    // Save final state and navigate to next step
    router.push('/clip-cutter/safety-check')
  }, [duration, router])

  // Handle back
  const handleBack = useCallback(() => {
    router.push('/clip-cutter/suggestions')
  }, [router])

  // Autosave functionality
  const triggerAutosave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      // Simulate saving to local storage
      localStorage.setItem(
        'clipCutterState',
        JSON.stringify({
          startTime: clipState.startTime,
          endTime: clipState.endTime,
          quality: clipState.quality
        })
      )

      // Show autosave toast
      setShowToast({
        type: 'success',
        message: `Saved · ${new Date().toLocaleTimeString()}`
      })
      setTimeout(() => setShowToast(null), 3000)
    }, 2000)
  }, [clipState.startTime, clipState.endTime, clipState.quality])

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('clipCutterState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setClipState((prev) => ({
          ...prev,
          ...parsed
        }))
        setCurrentTime(parsed.startTime)
      } catch (e) {
        console.error('Failed to parse saved state', e)
      }
    }
  }, [])

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms}`
  }

  // Get duration color
  const getDurationColor = () => {
    if (duration > 60) return 'text-red-500'
    if (duration > 55) return 'text-yellow-400'
    return 'text-green-400'
  }

  // Calculate timeline positions
  const getStartHandlePosition = () => {
    return `${(clipState.startTime / 60) * 100}%`
  }

  const getEndHandlePosition = () => {
    return `${(clipState.endTime / 60) * 100}%`
  }

  const getCurrentTimePosition = () => {
    return `${(currentTime / 60) * 100}%`
  }

  // Generate timeline ticks based on zoom level
  const generateTicks = () => {
    const ticks = []
    const step = 1 / zoomLevel // Smaller step for higher zoom
    for (let i = 0; i <= 60; i += step) {
      const isMajor = i % 5 === 0
      ticks.push(
        <div
          key={i}
          className={`absolute h-${isMajor ? '3' : '2'} ${
            isMajor ? 'bg-gray-400' : 'bg-gray-600'
          }`}
          style={{
            left: `${(i / 60) * 100}%`,
            width: '1px',
            top: isMajor ? '0' : '4px'
          }}
        ></div>
      )

      // Add labels for major ticks
      if (isMajor) {
        ticks.push(
          <div
            key={`label-${i}`}
            className="absolute text-xs text-gray-400"
            style={{
              left: `${(i / 60) * 100}%`,
              transform: 'translateX(-50%)',
              top: '12px'
            }}
          >
            {formatTime(i)}
          </div>
        )
      }
    }
    return ticks
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">3 / 4 · Fine-tune your clip</h1>
          <p className="text-sm text-gray-400">
            Adjust start and end points precisely
          </p>
        </div>
        <div className={`font-mono text-lg ${getDurationColor()}`}>
          {formatTime(duration)}s
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main panel */}
        <div className="flex-1 flex flex-col">
          {/* Hero player (45%) */}
          <div className="h-[45%] bg-[#1A1A1A] p-6 flex flex-col justify-center">
            <div className="max-w-4xl mx-auto w-full">
              {/* Video player */}
              <div
                className="relative bg-black rounded-lg overflow-hidden mb-4"
                style={{ aspectRatio: '16/9' }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster="/placeholder.svg?height=360&width=640"
                  muted={isMuted}
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

                {/* Controls overlay */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    onClick={handleMuteToggle}
                    className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <button
                    className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="Fullscreen"
                  >
                    <Maximize size={18} />
                  </button>
                </div>

                {/* Time overlay */}
                <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded text-sm">
                  {formatTime(currentTime)}
                </div>
              </div>

              {/* Waveform timeline */}
              <div
                ref={timelineRef}
                className="relative h-16 bg-gray-900 rounded-lg mb-4 cursor-pointer"
                onClick={handleTimelineClick}
              >
                {/* Waveform visualization */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  {waveformData.map((amplitude, i) => {
                    const x = i
                    const height = amplitude * 30
                    const y = (30 - height) / 2

                    // Determine if this part is within the selected range
                    const position = i / waveformData.length
                    const timePosition = position * 60
                    const isSelected =
                      timePosition >= clipState.startTime &&
                      timePosition <= clipState.endTime

                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width="0.8"
                        height={height}
                        fill={isSelected ? '#4ade80' : '#666'}
                        rx="0.2"
                      />
                    )
                  })}
                </svg>

                {/* Selected region */}
                <div
                  className="absolute top-0 bottom-0 bg-green-500/20"
                  style={{
                    left: getStartHandlePosition(),
                    right: `${100 - (clipState.endTime / 60) * 100}%`
                  }}
                ></div>

                {/* Current time indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: getCurrentTimePosition() }}
                ></div>

                {/* Start handle */}
                <div
                  ref={startHandleRef}
                  className={`absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize flex items-center justify-center group ${
                    isDraggingStart ? 'w-1.5' : ''
                  }`}
                  style={{ left: getStartHandlePosition() }}
                  onMouseDown={handleStartHandleDrag}
                  title={`Start: ${formatTime(clipState.startTime)}`}
                >
                  <div className="w-1 h-8 bg-green-500 rounded-full group-hover:h-10 transition-all"></div>
                  <div className="absolute bottom-full mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Start: {formatTime(clipState.startTime)}
                  </div>
                </div>

                {/* End handle */}
                <div
                  ref={endHandleRef}
                  className={`absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize flex items-center justify-center group ${
                    isDraggingEnd ? 'w-1.5' : ''
                  }`}
                  style={{ left: getEndHandlePosition() }}
                  onMouseDown={handleEndHandleDrag}
                  title={`End: ${formatTime(clipState.endTime)}`}
                >
                  <div className="w-1 h-8 bg-green-500 rounded-full group-hover:h-10 transition-all"></div>
                  <div className="absolute bottom-full mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    End: {formatTime(clipState.endTime)}
                  </div>
                </div>
              </div>

              {/* Precision timeline */}
              <div className="relative h-12 bg-gray-900 rounded-lg overflow-hidden">
                <div className="absolute inset-0">{generateTicks()}</div>

                {/* Selected region */}
                <div
                  className="absolute top-0 bottom-0 bg-green-500/20"
                  style={{
                    left: getStartHandlePosition(),
                    right: `${100 - (clipState.endTime / 60) * 100}%`
                  }}
                ></div>

                {/* Current time indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: getCurrentTimePosition() }}
                ></div>

                {/* Start handle */}
                <div
                  className={`absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize ${
                    isDraggingStart ? 'w-1.5' : ''
                  }`}
                  style={{ left: getStartHandlePosition() }}
                  onMouseDown={handleStartHandleDrag}
                ></div>

                {/* End handle */}
                <div
                  className={`absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize ${
                    isDraggingEnd ? 'w-1.5' : ''
                  }`}
                  style={{ left: getEndHandlePosition() }}
                  onMouseDown={handleEndHandleDrag}
                ></div>
              </div>

              {/* Zoom control */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-gray-400">Zoom:</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={zoomLevel}
                  onChange={handleZoomChange}
                  className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-gray-400">{zoomLevel}x</span>
                <div className="ml-4 text-sm text-gray-400">
                  <span className="mr-2">Keyboard shortcuts:</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                    Space
                  </kbd>
                  <span className="mx-1">Play/Pause</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                    Ctrl+←/→
                  </kbd>
                  <span className="mx-1">Adjust start</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                    Shift+←/→
                  </kbd>
                  <span className="mx-1">Adjust end</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side toolbar (20%) */}
        <div className="w-80 border-l border-gray-800 p-6 overflow-y-auto">
          {/* Undo/Redo */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">History</h3>
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={
                  historyIndex > 0
                    ? `Undo: ${history[historyIndex]?.description}`
                    : 'Nothing to undo'
                }
              >
                <RotateCcw size={16} />
                <span>Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={
                  historyIndex < history.length - 1
                    ? `Redo: ${history[historyIndex + 1]?.description}`
                    : 'Nothing to redo'
                }
              >
                <RotateCw size={16} />
                <span>Redo</span>
              </button>
            </div>
          </div>

          {/* Duration badge */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Clip Duration
            </h3>
            <div className={`text-2xl font-mono ${getDurationColor()}`}>
              {formatTime(duration)}
              <span className="text-sm text-gray-400 ml-1">seconds</span>
            </div>
            {duration > 60 && (
              <div className="mt-2 text-sm text-red-400 flex items-center">
                <AlertTriangle size={14} className="mr-1" />
                <span>Maximum duration is 60 seconds</span>
              </div>
            )}
          </div>

          {/* Quality toggle */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Quality Settings
            </h3>
            <div className="flex items-center justify-between">
              <span>Preserve original quality</span>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={clipState.quality === 'original'}
                    onChange={handleQualityToggle}
                  />
                  <div
                    className={`w-10 h-5 rounded-full ${
                      clipState.quality === 'original'
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                  ></div>
                  <div
                    className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      clipState.quality === 'original'
                        ? 'transform translate-x-5'
                        : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
            {clipState.quality === 'compressed' && (
              <div className="mt-2 text-sm text-yellow-400 flex items-center">
                <AlertTriangle size={14} className="mr-1" />
                <span>Video will be compressed</span>
              </div>
            )}
          </div>

          {/* Reset button */}
          <div className="mb-6">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              <span>Reset to original clip</span>
            </button>
          </div>

          {/* Keyboard shortcuts */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Keyboard Shortcuts</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex justify-between">
                <span>Play/Pause</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Space</kbd>
              </li>
              <li className="flex justify-between">
                <span>Adjust start point</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">
                  Ctrl+←/→
                </kbd>
              </li>
              <li className="flex justify-between">
                <span>Adjust end point</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">
                  Shift+←/→
                </kbd>
              </li>
              <li className="flex justify-between">
                <span>Undo</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Ctrl+Z</kbd>
              </li>
              <li className="flex justify-between">
                <span>Redo</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">
                  Ctrl+Shift+Z
                </kbd>
              </li>
            </ul>
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
          disabled={duration > 60 || duration <= 0}
          className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      {/* Quality warning modal */}
      {showQualityWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <AlertTriangle size={20} className="text-yellow-400 mr-2" />
              Reduce Quality Warning
            </h3>
            <p className="mb-4">
              Turning off original quality will compress your video. This may
              reduce the quality for your fans but will save storage space.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowQualityWarning(false)}
                className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmQualityChange}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors"
              >
                Reduce Quality
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 left-6 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-fade-in ${
            showToast.type === 'success'
              ? 'bg-green-900/80 text-white'
              : showToast.type === 'info'
              ? 'bg-blue-900/80 text-white'
              : showToast.type === 'warning'
              ? 'bg-yellow-900/80 text-white'
              : 'bg-red-900/80 text-white'
          }`}
          role="status"
          aria-live="polite"
        >
          {showToast.type === 'success' && (
            <Check size={20} className="text-green-400" />
          )}
          {showToast.type === 'info' && (
            <Info size={20} className="text-blue-400" />
          )}
          {showToast.type === 'warning' && (
            <AlertTriangle size={20} className="text-yellow-400" />
          )}
          {showToast.type === 'error' && (
            <AlertTriangle size={20} className="text-red-400" />
          )}
          <div className="flex-1">{showToast.message}</div>
        </div>
      )}
    </div>
  )
}

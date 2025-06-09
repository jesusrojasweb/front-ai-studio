'use client'

import type React from 'react'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Info,
  Trash2,
  X,
  Check,
  Film
} from 'lucide-react'
import { videosService, type VideoEntity } from '@/lib/services/videos.service'

export default function ClipCutter() {
  const [files, setFiles] = useState<File[]>([])
  const [fileStatuses, setFileStatuses] = useState<{
    [key: string]: {
      progress: number
      status: 'uploading' | 'analyzing' | 'complete' | 'error'
      error?: string
      badges?: Array<'SD' | 'no-audio' | 'OK'>
      thumbnail?: string
      stage?: string
      videoId?: string
      videoData?: VideoEntity
    }
  }>({})
  const [dragOver, setDragOver] = useState(false)
  const [skipWarnings, setSkipWarnings] = useState(false)
  const [showToast, setShowToast] = useState<{
    type: 'success' | 'error'
    message: string
    action?: () => void
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files)
        handleFiles(selectedFiles)
      }
    },
    []
  )

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const validTypes = ['video/mp4', 'video/quicktime', 'video/webm']
      if (!validTypes.includes(file.type)) {
        setShowToast({
          type: 'error',
          message: `${file.name} is not a supported format. Use MP4, MOV, or WEBM.`,
          action: () => {}
        })
        return false
      }

      // Check file size (2GB limit)
      const maxSize = 2 * 1024 * 1024 * 1024 // 2GB in bytes
      if (file.size > maxSize) {
        setShowToast({
          type: 'error',
          message: `${file.name} is too large. Maximum file size is 2GB.`,
          action: () => {}
        })
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    setFiles((prev) => [...prev, ...validFiles])

    // Upload each valid file using the real API
    validFiles.forEach(async (file) => {
      try {
        // Initialize file status
        setFileStatuses((prev) => ({
          ...prev,
          [file.name]: {
            progress: 0,
            status: 'uploading',
            stage: 'Preparing...'
          }
        }))

        // Start video upload workflow
        const videoData = await videosService.uploadVideo(
          file,
          (stage: string, progress: number) => {
            setFileStatuses((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                progress,
                stage,
                status: progress < 100 ? 'uploading' : 'analyzing'
              }
            }))
          }
        )

        // Generate badges based on video metadata
        const badges: Array<'SD' | 'no-audio' | 'OK'> = []

        // Check resolution for SD badge
        if (videoData.resolution) {
          const [width] = videoData.resolution.split('x').map(Number)
          if (width < 1280) badges.push('SD')
        }

        // Check audio
        if (!videoData.has_audio) badges.push('no-audio')

        // Add OK badge if no issues
        if (badges.length === 0) badges.push('OK')

        // Mark as complete
        setFileStatuses((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 100,
            status: 'complete',
            badges,
            videoId: videoData.id,
            videoData,
            thumbnail: '/placeholder.svg?height=64&width=36' // TODO: Generate real thumbnail
          }
        }))

        console.log('✅ Video upload completed for:', file.name, videoData)

        // Check if all files are now complete and show success toast
        setTimeout(() => {
          setFileStatuses((currentStatuses) => {
            const allFiles = Object.values(currentStatuses)
            const allComplete = allFiles.every(
              (status) =>
                status.status === 'complete' || status.status === 'error'
            )
            const successCount = allFiles.filter(
              (status) => status.status === 'complete'
            ).length

            if (allComplete && successCount > 0) {
              setShowToast({
                type: 'success',
                message: `${successCount} video${
                  successCount > 1 ? 's' : ''
                } ready · 100% analyzed`,
                action: () => {}
              })
            }

            return currentStatuses
          })
        }, 100)
      } catch (error) {
        console.error('❌ Video upload failed for:', file.name, error)

        setFileStatuses((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          }
        }))

        setShowToast({
          type: 'error',
          message: `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          action: () => {}
        })
      }
    })
  }, [])

  const handleCancel = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName))
    setFileStatuses((prev) => {
      const newStatuses = { ...prev }
      delete newStatuses[fileName]
      return newStatuses
    })
  }, [])

  const handleCancelAll = useCallback(() => {
    setFiles([])
    setFileStatuses({})
  }, [])

  const handleNext = useCallback(() => {
    // Get the first completed video to proceed with
    const completedFiles = Object.values(fileStatuses).filter(
      (status) => status.status === 'complete' && status.videoData
    )

    if (completedFiles.length > 0) {
      const firstVideoData = completedFiles[0].videoData
      console.log(
        '🚀 Proceeding to suggestions with video:',
        firstVideoData?.id
      )

      // In a real implementation, you might want to pass the video ID via query params
      // or store it in a global state management solution
      router.push(`/clip-cutter/suggestions?videoId=${firstVideoData?.id}`)
    } else {
      router.push('/clip-cutter/suggestions')
    }
  }, [router, fileStatuses])

  const isNextDisabled =
    Object.values(fileStatuses).length === 0 ||
    !Object.values(fileStatuses).some(
      (status) => status.status === 'complete' && status.videoData
    )

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">1 / 4 · Upload your footage</h1>
          <div className="text-sm text-gray-400">
            <span className="text-white">Plan</span> › Upload › Edit › Publish
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main panel (70%) */}
        <div className="w-[70%] p-6 overflow-y-auto">
          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-all
              ${
                dragOver
                  ? 'border-green-400 bg-green-400/10 shadow-lg'
                  : 'border-gray-700 bg-[#1A1A1A]'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            tabIndex={0}
            role="button"
            aria-label="Drop video files here or click to browse"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleBrowseClick()
              }
            }}
          >
            <Film
              size={48}
              className={`mb-4 ${
                dragOver ? 'text-green-400' : 'text-gray-500'
              }`}
            />
            <p className="text-lg mb-2">
              Drop MP4 / MOV / WEBM here or{' '}
              <span className="text-green-400">Browse</span>
            </p>
            <p className="text-sm text-gray-400">
              Supported formats: MP4, MOV, WEBM
              <span
                className="ml-2 inline-flex items-center cursor-help"
                title="Maximum file size: 2GB"
              >
                <HelpCircle size={14} />
              </span>
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
              multiple
              onChange={handleFileInputChange}
            />
          </div>

          {/* Upload list */}
          {files.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Uploads</h2>
              <ul className="space-y-3" role="list">
                {files.map((file) => {
                  const fileStatus = fileStatuses[file.name]
                  if (!fileStatus) return null

                  return (
                    <li
                      key={file.name}
                      className={`flex items-center p-3 rounded-lg ${
                        fileStatus.status === 'error'
                          ? 'bg-red-900/20'
                          : 'bg-[#1A1A1A]'
                      }`}
                      role="status"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-9 bg-gray-800 rounded overflow-hidden mr-3 flex-shrink-0">
                        {fileStatus.thumbnail && (
                          <img
                            src={fileStatus.thumbnail || '/placeholder.svg'}
                            alt={`Thumbnail for ${file.name}`}
                            className={
                              fileStatus.status === 'error' ? 'blur-sm' : ''
                            }
                          />
                        )}
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="font-medium truncate">{file.name}</p>
                          <span className="ml-2 text-xs text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-1 w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              fileStatus.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${fileStatus.progress}%` }}
                            role="progressbar"
                            aria-valuenow={fileStatus.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>

                        {/* Status text */}
                        <div className="mt-1 flex items-center text-sm">
                          {fileStatus.status === 'uploading' && (
                            <span className="text-gray-400">
                              {fileStatus.stage || 'Uploading...'}{' '}
                              {fileStatus.progress.toFixed(0)}%
                            </span>
                          )}
                          {fileStatus.status === 'analyzing' && (
                            <span className="text-gray-400">
                              {fileStatus.stage || 'Analyzing video...'}
                            </span>
                          )}
                          {fileStatus.status === 'complete' && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 flex items-center">
                                <Check size={14} className="mr-1" />
                                Complete
                              </span>

                              {/* Badges */}
                              {fileStatus.badges?.map((badge) => (
                                <span
                                  key={badge}
                                  className={`text-xs px-2 py-0.5 rounded-full flex items-center ${
                                    badge === 'OK'
                                      ? 'bg-green-900/30 text-green-400'
                                      : badge === 'SD'
                                      ? 'bg-yellow-900/30 text-yellow-400'
                                      : 'bg-red-900/30 text-red-400'
                                  }`}
                                >
                                  {badge === 'OK' && (
                                    <Check size={10} className="mr-1" />
                                  )}
                                  {badge === 'SD' && (
                                    <AlertCircle size={10} className="mr-1" />
                                  )}
                                  {badge === 'no-audio' && (
                                    <AlertCircle size={10} className="mr-1" />
                                  )}
                                  {badge === 'OK'
                                    ? 'OK'
                                    : badge === 'SD'
                                    ? 'SD'
                                    : 'No audio'}
                                </span>
                              ))}
                            </div>
                          )}
                          {fileStatus.status === 'error' && (
                            <span className="text-red-400 flex items-center">
                              <AlertCircle size={14} className="mr-1" />
                              {fileStatus.error || 'Error processing file'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        className="ml-3 p-1 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancel(file.name)
                        }}
                        disabled={fileStatus.status === 'complete'}
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Side panel (30%) */}
        <div className="w-[30%] border-l border-gray-800 p-6 overflow-y-auto">
          {/* Tips card */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <Info size={16} className="mr-2 text-green-400" />
              Tips for shooting
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Learn how to capture footage that performs well on Fanvue.
            </p>
            <a href="#" className="text-sm text-green-400 hover:underline">
              Read our shooting guide →
            </a>
          </div>

          {/* Recommended specs */}
          <div className="bg-[#1A1A1A] rounded-lg p-4">
            <h3 className="font-semibold mb-3">Recommended specs</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-400" />
                <span>Resolution: 720p or higher</span>
              </li>
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-400" />
                <span>Audio: Stereo</span>
              </li>
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-400" />
                <span>File size: Up to 2 GB</span>
              </li>
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-400" />
                <span>Duration: Up to 60 minutes</span>
              </li>
            </ul>

            {/* Toggle */}
            <div className="mt-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={skipWarnings}
                    onChange={() => setSkipWarnings(!skipWarnings)}
                  />
                  <div
                    className={`w-10 h-5 rounded-full ${
                      skipWarnings ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  ></div>
                  <div
                    className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      skipWarnings ? 'transform translate-x-5' : ''
                    }`}
                  ></div>
                </div>
                <span className="ml-3 text-sm">Skip low-res warnings</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-16 border-t border-gray-800 px-6 flex items-center justify-between">
        <button
          className="px-4 py-2 text-white bg-transparent border border-gray-600 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCancelAll}
          disabled={files.length === 0}
        >
          Cancel All
        </button>
        <button
          className="px-6 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-fade-in ${
            showToast.type === 'success'
              ? 'bg-green-900/80 text-white'
              : 'bg-red-900/80 text-white'
          }`}
        >
          {showToast.type === 'success' ? (
            <Check size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-red-400" />
          )}
          <div className="flex-1">{showToast.message}</div>
          <button
            onClick={() => setShowToast(null)}
            className="text-gray-300 hover:text-white"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

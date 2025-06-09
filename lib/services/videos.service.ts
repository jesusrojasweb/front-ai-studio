// Videos service for video upload and management
// This service handles the complete video upload workflow

import { env } from '@/lib/config/env'
import { authStorage } from './auth-storage.service'

// DTOs based on the backend API
export interface CreateUploadUrlDto {
  filename: string
  contentType: string
}

export interface CompleteVideoDto {
  status: 'READY' | 'FAILED'
  duration_ms?: number
  has_audio?: boolean
  resolution?: string
  error_msg?: string
}

// Response interfaces based on backend API
export interface CreateSignedUploadUrlResponse {
  uploadUrl: string
  videoId: string
  expireAt: string
}

export interface VideoEntity {
  id: string
  user_id: string
  file_path: string
  status: 'UPLOADING' | 'READY' | 'FAILED'
  duration_ms?: number
  has_audio?: boolean
  resolution?: string
  error_msg?: string
  created_at: string
}

export interface VideoResponse {
  data: VideoEntity | VideoEntity[] | null
  error: string | null
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void

class VideosService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = env.apiBaseUrl
  }

  // Generic API call method with error handling
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authStorage.getAuthHeaders(),
          ...options.headers
        },
        ...options
      })

      // Handle different response status codes
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // If response is not JSON, use default message
        }

        const apiError: ApiError = {
          message: errorMessage,
          statusCode: response.status
        }

        throw apiError
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T
      }

      const data = await response.json()
      return data
    } catch (error) {
      // Network errors or other issues
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          statusCode: 0
        } as ApiError
      }

      // Re-throw API errors
      throw error
    }
  }

  // Step 1: Create upload URL
  async createUploadUrl(file: File): Promise<CreateSignedUploadUrlResponse> {
    try {
      console.log('🔄 Creating upload URL for file:', file.name)

      const createUploadUrlDto: CreateUploadUrlDto = {
        filename: file.name,
        contentType: file.type
      }

      const response = await this.apiCall<{
        data: CreateSignedUploadUrlResponse
        error: null
      }>('/v1/videos/upload-url', {
        method: 'POST',
        body: JSON.stringify(createUploadUrlDto)
      })

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data) {
        throw new Error('No upload URL data received')
      }

      console.log('✅ Upload URL created successfully:', response.data.videoId)
      return response.data
    } catch (error) {
      console.error('❌ Failed to create upload URL:', error)
      throw this.transformError(error, 'Failed to create upload URL')
    }
  }

  // Step 2: Upload file to signed URL
  async uploadFileToSignedUrl(
    file: File,
    uploadUrl: string,
    onProgress?: UploadProgressCallback
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Uploading file to signed URL...')

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ File uploaded successfully to storage')
          resolve()
        } else {
          console.error('❌ Upload failed with status:', xhr.status)
          reject(new Error(`Upload failed with status: ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ Upload failed due to network error')
        reject(new Error('Upload failed due to network error'))
      })

      // Handle abort
      xhr.addEventListener('abort', () => {
        console.warn('⚠️ Upload was aborted')
        reject(new Error('Upload was aborted'))
      })

      // Start upload
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  // Step 3: Extract video metadata
  private async extractVideoMetadata(file: File): Promise<{
    duration_ms: number
    has_audio: boolean
    resolution: string
  }> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Extracting video metadata...')

      const video = document.createElement('video')
      const url = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        try {
          const duration_ms = Math.round(video.duration * 1000)
          const resolution = `${video.videoWidth}x${video.videoHeight}`

          // For audio detection, we'll assume true for now
          // In a real implementation, you'd need to analyze the video tracks
          const has_audio = true

          console.log('✅ Video metadata extracted:', {
            duration_ms,
            resolution,
            has_audio
          })

          URL.revokeObjectURL(url)
          resolve({ duration_ms, has_audio, resolution })
        } catch {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to extract video metadata'))
        }
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load video for metadata extraction'))
      }

      video.src = url
    })
  }

  // Step 4: Mark video as complete
  async completeVideo(
    videoId: string,
    metadata: CompleteVideoDto
  ): Promise<void> {
    try {
      console.log('🔄 Marking video as complete:', videoId)

      await this.apiCall<void>(`/v1/videos/${videoId}/complete`, {
        method: 'POST',
        body: JSON.stringify(metadata)
      })

      console.log('✅ Video marked as complete successfully')
    } catch (error) {
      console.error('❌ Failed to mark video as complete:', error)
      throw this.transformError(error, 'Failed to mark video as complete')
    }
  }

  // Complete upload workflow
  async uploadVideo(
    file: File,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<VideoEntity> {
    try {
      console.log('🚀 Starting complete video upload workflow for:', file.name)

      // Stage 1: Create upload URL (5% progress)
      onProgress?.('Creating upload URL...', 5)
      const uploadData = await this.createUploadUrl(file)

      // Stage 2: Upload file (5% - 85% progress)
      onProgress?.('Uploading file...', 10)
      await this.uploadFileToSignedUrl(
        file,
        uploadData.uploadUrl,
        (uploadProgress) => {
          // Map upload progress to 10-85% range
          const mappedProgress = 10 + uploadProgress * 0.75
          onProgress?.('Uploading file...', mappedProgress)
        }
      )

      // Stage 3: Extract metadata (90% progress)
      onProgress?.('Analyzing video...', 90)
      const metadata = await this.extractVideoMetadata(file)

      // Stage 4: Mark as complete (95% progress)
      onProgress?.('Finalizing...', 95)
      const completeVideoDto: CompleteVideoDto = {
        status: 'READY',
        ...metadata
      }

      await this.completeVideo(uploadData.videoId, completeVideoDto)

      // Stage 5: Get final video data (100% progress)
      onProgress?.('Complete!', 100)
      const videoData = await this.getVideoById(uploadData.videoId)

      console.log(
        '🎉 Video upload workflow completed successfully!',
        videoData.id
      )
      return videoData
    } catch (error) {
      console.error('💥 Video upload workflow failed:', error)
      throw this.transformError(error, 'Video upload failed')
    }
  }

  // Get video by ID
  async getVideoById(videoId: string): Promise<VideoEntity> {
    try {
      console.log('🔍 Fetching video by ID:', videoId)

      const response = await this.apiCall<VideoResponse>(
        `/v1/videos/${videoId}`
      )

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data || Array.isArray(response.data)) {
        throw new Error('Invalid video data received')
      }

      console.log('✅ Video fetched successfully:', response.data.id)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch video:', error)
      throw this.transformError(error, 'Failed to fetch video')
    }
  }

  // Get user videos
  async getUserVideos(
    status?: 'UPLOADING' | 'READY' | 'FAILED'
  ): Promise<VideoEntity[]> {
    try {
      console.log(
        '🔍 Fetching user videos...',
        status ? `Status: ${status}` : ''
      )

      const queryParams = status ? `?status=${status}` : ''
      const response = await this.apiCall<VideoResponse>(
        `/v1/videos${queryParams}`
      )

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data) {
        return []
      }

      const videos = Array.isArray(response.data)
        ? response.data
        : [response.data]
      console.log('✅ User videos fetched successfully:', videos.length)
      return videos
    } catch (error) {
      console.error('❌ Failed to fetch user videos:', error)
      throw this.transformError(error, 'Failed to fetch videos')
    }
  }

  // Transform API errors for better UX
  private transformError(error: unknown, defaultMessage: string): Error {
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as ApiError

      if (apiError.statusCode === 401) {
        return new Error('Authentication required. Please log in again.')
      }

      if (apiError.statusCode === 400) {
        return new Error(apiError.message || 'Invalid request data.')
      }

      if (apiError.statusCode === 403) {
        return new Error('Access denied.')
      }

      if (apiError.statusCode === 404) {
        return new Error('Video not found.')
      }

      if (apiError.statusCode === 413) {
        return new Error('File too large. Maximum size is 2GB.')
      }

      return new Error(apiError.message || defaultMessage)
    }

    return new Error(defaultMessage)
  }
}

export const videosService = new VideosService()

import { env } from '@/lib/config/env'
import { authStorage } from './auth-storage.service'

export interface ClipEntity {
  id: string
  video_id: string
  user_id: string
  start_ms: number
  end_ms: number
  duration_ms: number
  score: number
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'BLOCKED'
  safety_status: 'SAFE' | 'NEEDS_REVIEW' | 'BLOCKED'
  schedule_at?: string
  created_at: string
  file_url: string
  thumb_url: string
}

export interface ClipResponse {
  data: ClipEntity[]
  error: string | null
}

class ClipsService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = env.apiBaseUrl
  }

  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = authStorage.getAccessToken()

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // If response is not JSON, use default message
      }
      throw new Error(errorMessage)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async getClipsByVideoId(
    videoId: string,
    status?: string
  ): Promise<ClipEntity[]> {
    const queryParams = status ? `?status=${status}` : ''
    const response = await this.apiCall<ClipResponse>(
      `/v1/videos/${videoId}/clips${queryParams}`
    )
    return response.data
  }

  async updateClip(
    clipId: string,
    updates: { start_ms?: number; end_ms?: number; quality_original?: boolean }
  ): Promise<ClipEntity> {
    const response = await this.apiCall<{ data: ClipEntity; error: null }>(
      `/v1/clips/${clipId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    )
    return response.data
  }

  async regenerateClip(clipId: string): Promise<{ jobId: string }> {
    const response = await this.apiCall<{
      data: { jobId: string }
      error: null
    }>(`/v1/clips/${clipId}/regenerate`, {
      method: 'POST'
    })
    return response.data
  }

  async createSafetyJob(clipId: string): Promise<{ jobId: string }> {
    const response = await this.apiCall<{
      data: { jobId: string }
      error: null
    }>(`/v1/clips/${clipId}/safety-jobs`, {
      method: 'POST'
    })
    return response.data
  }
}

export const clipsService = new ClipsService()

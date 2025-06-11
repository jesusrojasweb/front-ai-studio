import { env } from '@/lib/config/env'
import { authStorage } from './auth-storage.service'

export type JobType = 'CUT' | 'SAFETY'
export type JobState = 'WAITING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'

export interface JobEntity {
  id: string
  job_type: JobType
  video_id?: string
  clip_id?: string
  state: JobState
  attempts: number
  max_attempts: number
  payload?: Record<string, unknown>
  result_json?: Record<string, unknown>
  error_msg?: string
  created_at: string
  finished_at?: string
}

export interface JobResponse {
  data: JobEntity | JobEntity[]
  error: string | null
}

export interface CreateCutJobRequest {
  maxClips?: number
}

class JobsService {
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

  async createCutJob(
    videoId: string,
    options: CreateCutJobRequest = {}
  ): Promise<{ jobId: string }> {
    const response = await this.apiCall<{
      data: { jobId: string }
      error: null
    }>(`/v1/videos/${videoId}/cut-jobs`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
    return response.data
  }

  async getJobById(jobId: string): Promise<JobEntity> {
    const response = await this.apiCall<{ data: JobEntity; error: null }>(
      `/v1/jobs/${jobId}`
    )
    return response.data
  }

  async getJobsByVideoId(videoId: string): Promise<JobEntity[]> {
    const response = await this.apiCall<JobResponse>(
      `/v1/jobs?videoId=${videoId}`
    )
    return Array.isArray(response.data) ? response.data : []
  }

  async getJobsByClipId(clipId: string): Promise<JobEntity[]> {
    const response = await this.apiCall<JobResponse>(
      `/v1/jobs?clipId=${clipId}`
    )
    return Array.isArray(response.data) ? response.data : []
  }

  async getJobsByState(state: JobState): Promise<JobEntity[]> {
    const response = await this.apiCall<JobResponse>(`/v1/jobs?state=${state}`)
    return Array.isArray(response.data) ? response.data : []
  }
}

export const jobsService = new JobsService()

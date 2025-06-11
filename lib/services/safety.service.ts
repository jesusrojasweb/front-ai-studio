import { env } from '@/lib/config/env'
import { authStorage } from './auth-storage.service'

export interface SafetyReport {
  id: string
  clip_id: string
  verdict: 'SAFE' | 'NEEDS_REVIEW' | 'BLOCKED'
  confidence: number
  policy_category?: string
  details?: Record<string, unknown>
  created_at: string
}

export class SafetyService {
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

  /**
   * Get the latest safety report for a clip
   */
  async getSafetyReport(clipId: string): Promise<SafetyReport | null> {
    try {
      const response = await this.apiCall<{ data: SafetyReport; error: null }>(
        `/v1/clips/${clipId}/safety`
      )
      return response.data
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  /**
   * Request manual review for a clip
   */
  async requestReview(clipId: string, evidenceUrl?: string): Promise<void> {
    await this.apiCall(`/v1/clips/${clipId}/request-review`, {
      method: 'POST',
      body: JSON.stringify({ evidence_url: evidenceUrl })
    })
  }
}

export const safetyService = new SafetyService()

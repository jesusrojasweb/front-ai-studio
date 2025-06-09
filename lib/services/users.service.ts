// Users service for API calls
// This service handles all user-related API interactions

import { env } from '@/lib/config/env'
import { authStorage } from './auth-storage.service'

// User interface based on the backend response
export interface User {
  id: string
  email: string
  display_name: string
  plan_tier: string
  created_at: string
}

export interface UserResponse {
  data: User | null
  error: string | null
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

class UsersService {
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

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      console.log('🔍 Fetching user data for ID:', userId)

      const response = await this.apiCall<UserResponse>(`/v1/users/${userId}`)

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data) {
        throw new Error('No user data received')
      }

      console.log('✅ User data fetched successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error)

      // Transform common error messages for better UX
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError

        if (apiError.statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        }

        if (apiError.statusCode === 404) {
          throw new Error('User not found.')
        }

        if (apiError.statusCode === 403) {
          throw new Error('Access denied.')
        }

        throw new Error(apiError.message)
      }

      throw new Error('Failed to fetch user data. Please try again.')
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<User> {
    try {
      console.log('🔍 Fetching current user profile')

      const response = await this.apiCall<UserResponse>('/v1/users/profile')

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data) {
        throw new Error('No user data received')
      }

      console.log(
        '✅ Current user profile fetched successfully:',
        response.data
      )
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch current user profile:', error)

      // Transform common error messages for better UX
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError

        if (apiError.statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        }

        throw new Error(apiError.message)
      }

      throw new Error('Failed to fetch user profile. Please try again.')
    }
  }

  // Update current user profile
  async updateCurrentUserProfile(updateData: {
    display_name?: string
    plan_tier?: string
  }): Promise<User> {
    try {
      console.log('🔄 Updating current user profile:', updateData)

      const response = await this.apiCall<UserResponse>('/v1/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data) {
        throw new Error('No user data received')
      }

      console.log('✅ User profile updated successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to update user profile:', error)

      // Transform common error messages for better UX
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError

        if (apiError.statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        }

        if (apiError.statusCode === 400) {
          throw new Error('Invalid update data provided.')
        }

        throw new Error(apiError.message)
      }

      throw new Error('Failed to update user profile. Please try again.')
    }
  }
}

export const usersService = new UsersService()

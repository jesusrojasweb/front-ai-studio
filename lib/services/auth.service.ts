// Authentication service for API calls
// This service handles all authentication-related API interactions

import { env } from '@/lib/config/env'
import { authStorage, type UserData } from './auth-storage.service'

// Re-export UserData for external use
export type { UserData }

// Function to get user ID from stored session
export const getUserIdFromToken = (): string | null => {
  const userData = authStorage.getCurrentUser()
  return userData?.id || null
}

// Request/Response types based on the API documentation
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

export interface LoginResponse {
  access_token: string
  user?: UserData
}

export interface RegisterResponse {
  id: string
  email: string
  displayName: string
  planTier?: string
  createdAt: string
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

class AuthenticationService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = env.authApiUrl
  }

  // Generic API call method with error handling
  private async apiCall<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
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

  // Register a new user
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log('🔐 Attempting to register user:', {
        email: userData.email,
        displayName: userData.displayName
      })

      const response = await this.apiCall<RegisterResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      console.log('✅ Registration successful:', response)
      return response
    } catch (error) {
      console.error('❌ Registration failed:', error)

      // Transform common error messages for better UX
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError

        if (apiError.statusCode === 400) {
          if (apiError.message.toLowerCase().includes('email')) {
            throw new Error('An account with this email already exists')
          }
          if (apiError.message.toLowerCase().includes('password')) {
            throw new Error('Password does not meet requirements')
          }
          if (apiError.message.toLowerCase().includes('display')) {
            throw new Error('Display name is invalid or already taken')
          }
        }

        throw new Error(apiError.message)
      }

      throw new Error('Registration failed. Please try again.')
    }
  }

  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting to login user:', { email })

      const loginData: LoginRequest = { email, password }

      const response = await this.apiCall<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      })

      console.log('✅ Login successful')

      // Store the authentication data
      if (response.access_token) {
        authStorage.setAccessToken(response.access_token)

        if (response.user) {
          authStorage.setUserData(response.user)
        }
      }

      return response
    } catch (error) {
      console.error('❌ Login failed:', error)

      // Transform common error messages for better UX
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError

        if (apiError.statusCode === 401) {
          throw new Error('Invalid email or password')
        }

        if (apiError.statusCode === 403) {
          throw new Error('Account is disabled or requires email verification')
        }

        throw new Error(apiError.message)
      }

      throw new Error('Login failed. Please try again.')
    }
  }

  // Logout user
  logout(): void {
    console.log('🔐 Logging out user')
    authStorage.clearSession()
  }

  // Get current authentication status
  isAuthenticated(): boolean {
    return authStorage.isAuthenticated()
  }

  // Get current user data
  getCurrentUser(): UserData | null {
    return authStorage.getCurrentUser()
  }

  // Get auth headers for authenticated requests
  getAuthHeaders(): Record<string, string> {
    return authStorage.getAuthHeaders()
  }

  // Validate current session
  async validateSession(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      // TODO: Implement session validation endpoint if available
      // For now, just check if we have a valid token
      const token = authStorage.getAccessToken()
      return !!token
    } catch (error) {
      console.error('Session validation failed:', error)
      this.logout()
      return false
    }
  }

  // Refresh token if needed (for future implementation)
  async refreshToken(): Promise<boolean> {
    try {
      // TODO: Implement refresh token logic when endpoint is available
      console.log('Token refresh not implemented yet')
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.logout()
      return false
    }
  }
}

// Create and export singleton instance
export const authService = new AuthenticationService()

// Export the class for testing or multiple instances if needed
export { AuthenticationService }

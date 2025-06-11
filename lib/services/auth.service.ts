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
  refresh_token?: string
  expires_in?: number
  user?: UserData
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
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
  private refreshPromise: Promise<boolean> | null = null

  constructor() {
    this.baseUrl = env.authApiUrl
  }

  // Generic API call method with error handling and auto token refresh
  private async apiCall<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Check if we need to refresh token before making the call
    if (
      endpoint !== '/login' &&
      endpoint !== '/register' &&
      endpoint !== '/refresh'
    ) {
      await this.ensureValidToken()
    }

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

        // If 401 and not a login/register call, try to refresh token once
        if (
          response.status === 401 &&
          endpoint !== '/login' &&
          endpoint !== '/register' &&
          endpoint !== '/refresh'
        ) {
          console.log('🔐 Received 401, attempting token refresh')
          const refreshed = await this.refreshToken()
          if (refreshed) {
            // Retry the original request with new token
            return this.apiCall(endpoint, options)
          } else {
            // Refresh failed, logout user
            this.logout()
          }
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

  // Ensure we have a valid token, refresh if needed
  private async ensureValidToken(): Promise<void> {
    if (!authStorage.isAuthenticated()) {
      return
    }

    // Check if token will expire soon and refresh proactively
    if (authStorage.isTokenNearExpiration()) {
      console.log('🔐 Token will expire soon, refreshing proactively')
      await this.refreshToken()
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

      // Store the authentication data including refresh token
      if (response.access_token) {
        authStorage.setAccessToken(response.access_token, response.expires_in)

        if (response.refresh_token) {
          authStorage.setRefreshToken(response.refresh_token)
        }

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

    // Clear any pending refresh promise
    this.refreshPromise = null

    // Redirect to login page if in browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
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
      // Make sure we have a valid token
      await this.ensureValidToken()
      return this.isAuthenticated()
    } catch (error) {
      console.error('Session validation failed:', error)
      this.logout()
      return false
    }
  }

  // Refresh token implementation
  async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performTokenRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    return result
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = authStorage.getRefreshToken()

      if (!refreshToken) {
        console.log('🔐 No refresh token available')
        return false
      }

      console.log('🔐 Refreshing access token')

      const refreshData: RefreshTokenRequest = { refreshToken }

      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refreshData)
      })

      if (!response.ok) {
        console.error('🔐 Token refresh failed:', response.status)
        return false
      }

      const refreshResponse = (await response.json()) as RefreshTokenResponse

      console.log('✅ Token refresh successful')

      // Store the new tokens
      authStorage.setAccessToken(
        refreshResponse.access_token,
        refreshResponse.expires_in
      )
      authStorage.setRefreshToken(refreshResponse.refresh_token)

      if (refreshResponse.user) {
        authStorage.setUserData(refreshResponse.user)
      }

      return true
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      return false
    }
  }

  // Get token expiration info for debugging
  getTokenInfo() {
    return authStorage.getTokenExpirationInfo()
  }
}

// Create and export singleton instance
export const authService = new AuthenticationService()

// Export the class for testing or multiple instances if needed
export { AuthenticationService }

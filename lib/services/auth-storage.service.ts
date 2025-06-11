// Auth storage service for handling tokens and user session
// This service manages the persistence of authentication state

import { JWTDecoder } from '@/lib/utils/jwt-decoder'

export interface UserData {
  id: string
  email: string
  displayName: string
  planTier?: string
  createdAt?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  user: UserData
  expiresAt?: number
}

class AuthStorageService {
  private readonly ACCESS_TOKEN_KEY = 'ai_studio_access_token'
  private readonly REFRESH_TOKEN_KEY = 'ai_studio_refresh_token'
  private readonly USER_DATA_KEY = 'ai_studio_user_data'
  private readonly EXPIRY_KEY = 'ai_studio_token_expiry'

  // Token management
  setAccessToken(token: string, expiresIn?: number): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token)

      // Use JWT expiration if available, otherwise use provided expiresIn
      const jwtExpiration = JWTDecoder.getExpiration(token)
      let expiryTime: number

      if (jwtExpiration) {
        // JWT expiration is in seconds, convert to milliseconds
        expiryTime = jwtExpiration * 1000
      } else if (expiresIn) {
        // expiresIn is in seconds, convert to milliseconds
        expiryTime = Date.now() + expiresIn * 1000
      } else {
        // Default to 1 hour if no expiration info available
        expiryTime = Date.now() + 3600 * 1000
      }

      localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString())
    } catch (error) {
      console.error('Failed to store access token:', error)
    }
  }

  setRefreshToken(refreshToken: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
    } catch (error) {
      console.error('Failed to store refresh token:', error)
    }
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error)
      return null
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY)
      if (!token) return null

      // Check if token is expired using JWT decoder
      if (JWTDecoder.isExpired(token)) {
        console.log('🔐 Access token has expired')
        return null
      }

      return token
    } catch (error) {
      console.error('Failed to retrieve access token:', error)
      return null
    }
  }

  // Check if token will expire soon (within 5 minutes)
  isTokenNearExpiration(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY)
      if (!token) return true

      // Token will expire within 5 minutes (300 seconds)
      return JWTDecoder.willExpireWithin(token, 300)
    } catch (error) {
      console.error('Failed to check token expiration:', error)
      return true
    }
  }

  private isTokenExpired(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY)
      if (!token) return true

      return JWTDecoder.isExpired(token)
    } catch (error) {
      console.error('Failed to check token expiry:', error)
      return false
    }
  }

  // User data management
  setUserData(userData: UserData): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData))
    } catch (error) {
      console.error('Failed to store user data:', error)
    }
  }

  getUserData(): UserData | null {
    if (typeof window === 'undefined') return null

    try {
      const userDataStr = localStorage.getItem(this.USER_DATA_KEY)
      return userDataStr ? JSON.parse(userDataStr) : null
    } catch (error) {
      console.error('Failed to retrieve user data:', error)
      return null
    }
  }

  // Session management
  setSession(session: AuthSession): void {
    this.setAccessToken(session.accessToken, session.expiresAt)
    if (session.refreshToken) {
      this.setRefreshToken(session.refreshToken)
    }
    this.setUserData(session.user)
  }

  getSession(): AuthSession | null {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()
    const userData = this.getUserData()

    if (!accessToken || !userData) {
      return null
    }

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      user: userData
    }
  }

  clearSession(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      localStorage.removeItem(this.USER_DATA_KEY)
      localStorage.removeItem(this.EXPIRY_KEY)
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  // Authentication state checks
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY)
    if (!token) return false

    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('🔐 Token expired, clearing session')
      this.clearSession()
      return false
    }

    return true
  }

  // Get authorization header for API calls
  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken()

    if (!token) {
      return {}
    }

    return {
      Authorization: `Bearer ${token}`
    }
  }

  // Utility method to get current user info safely
  getCurrentUser(): UserData | null {
    if (!this.isAuthenticated()) {
      return null
    }

    return this.getUserData()
  }

  // Get token expiration info for debugging
  getTokenExpirationInfo(): {
    expiresAt: number | null
    timeUntilExpiration: number | null
    isExpired: boolean
    willExpireSoon: boolean
  } | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY)
    if (!token) return null

    const expiresAt = JWTDecoder.getExpiration(token)
    const timeUntilExpiration = JWTDecoder.getTimeUntilExpiration(token)
    const isExpired = JWTDecoder.isExpired(token)
    const willExpireSoon = JWTDecoder.willExpireWithin(token, 300) // 5 minutes

    return {
      expiresAt,
      timeUntilExpiration,
      isExpired,
      willExpireSoon
    }
  }
}

// Create and export singleton instance
export const authStorage = new AuthStorageService()

// Export the class for testing or multiple instances if needed
export { AuthStorageService }

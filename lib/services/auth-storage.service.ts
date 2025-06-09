// Auth storage service for handling tokens and user session
// This service manages the persistence of authentication state

export interface UserData {
  id: string
  email: string
  displayName: string
  planTier?: string
  createdAt?: string
}

export interface AuthSession {
  accessToken: string
  user: UserData
  expiresAt?: number
}

class AuthStorageService {
  private readonly ACCESS_TOKEN_KEY = 'ai_studio_access_token'
  private readonly USER_DATA_KEY = 'ai_studio_user_data'
  private readonly EXPIRY_KEY = 'ai_studio_token_expiry'

  // Token management
  setAccessToken(token: string, expiresIn?: number): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token)

      if (expiresIn) {
        const expiryTime = Date.now() + expiresIn * 1000
        localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString())
      }
    } catch (error) {
      console.error('Failed to store access token:', error)
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY)

      // Check if token is expired
      if (token && this.isTokenExpired()) {
        this.clearSession()
        return null
      }

      return token
    } catch (error) {
      console.error('Failed to retrieve access token:', error)
      return null
    }
  }

  private isTokenExpired(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const expiryTime = localStorage.getItem(this.EXPIRY_KEY)
      if (!expiryTime) return false

      return Date.now() > parseInt(expiryTime)
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
    this.setUserData(session.user)
  }

  getSession(): AuthSession | null {
    const accessToken = this.getAccessToken()
    const userData = this.getUserData()

    if (!accessToken || !userData) {
      return null
    }

    return {
      accessToken,
      user: userData
    }
  }

  clearSession(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.USER_DATA_KEY)
      localStorage.removeItem(this.EXPIRY_KEY)
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  // Authentication state checks
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null
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
}

// Create and export singleton instance
export const authStorage = new AuthStorageService()

// Export the class for testing or multiple instances if needed
export { AuthStorageService }

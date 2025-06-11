// JWT decoder utility for Supabase tokens
// This utility decodes JWT tokens to extract expiration and other claims

export interface JWTPayload {
  exp: number // Expiration timestamp (Unix timestamp)
  iat: number // Issued at timestamp
  sub: string // Subject (user ID)
  email?: string
  role?: string
  aud?: string
  [key: string]: unknown
}

export class JWTDecoder {
  /**
   * Decodes a JWT token without verification
   * Only extracts the payload for reading claims like expiration
   */
  static decode(token: string): JWTPayload | null {
    try {
      // JWT has 3 parts separated by dots: header.payload.signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.error('Invalid JWT format: expected 3 parts')
        return null
      }

      // Decode the payload (second part)
      const payload = parts[1]

      // Add padding if needed (base64url doesn't include padding)
      const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4)

      // Decode from base64url to regular base64, then to string
      const decodedPayload = atob(
        paddedPayload.replace(/-/g, '+').replace(/_/g, '/')
      )

      // Parse JSON
      return JSON.parse(decodedPayload) as JWTPayload
    } catch (error) {
      console.error('Failed to decode JWT token:', error)
      return null
    }
  }

  /**
   * Gets the expiration timestamp from a JWT token
   */
  static getExpiration(token: string): number | null {
    const payload = this.decode(token)
    return payload?.exp || null
  }

  /**
   * Checks if a JWT token is expired
   */
  static isExpired(token: string): boolean {
    const exp = this.getExpiration(token)
    if (!exp) return true

    // Convert exp from seconds to milliseconds and compare with current time
    return Date.now() >= exp * 1000
  }

  /**
   * Checks if a JWT token will expire within the specified time (in seconds)
   * Useful for proactive token refresh
   */
  static willExpireWithin(token: string, seconds: number): boolean {
    const exp = this.getExpiration(token)
    if (!exp) return true

    // Convert exp from seconds to milliseconds and compare with future time
    const futureTime = Date.now() + seconds * 1000
    return futureTime >= exp * 1000
  }

  /**
   * Gets the time remaining until token expiration (in seconds)
   */
  static getTimeUntilExpiration(token: string): number | null {
    const exp = this.getExpiration(token)
    if (!exp) return null

    const remainingMs = exp * 1000 - Date.now()
    return Math.max(0, Math.floor(remainingMs / 1000))
  }

  /**
   * Gets the user ID from a Supabase JWT token
   */
  static getUserId(token: string): string | null {
    const payload = this.decode(token)
    return payload?.sub || null
  }

  /**
   * Gets the email from a Supabase JWT token
   */
  static getEmail(token: string): string | null {
    const payload = this.decode(token)
    return payload?.email || null
  }
}

// Authentication guard hook
// This hook manages automatic token validation and refresh

import { useEffect, useRef } from 'react'
import { authService } from '@/lib/services/auth.service'

export interface UseAuthGuardOptions {
  // How often to check token status (in milliseconds)
  checkInterval?: number
  // Whether to redirect on logout
  redirectOnLogout?: boolean
  // Whether to enable automatic refresh
  enableAutoRefresh?: boolean
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const {
    checkInterval = 60000, // Check every minute
    redirectOnLogout = true,
    enableAutoRefresh = true
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingRef = useRef(false)

  const checkTokenStatus = async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) return
    isCheckingRef.current = true

    try {
      if (!authService.isAuthenticated()) {
        if (redirectOnLogout && typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return
      }

      const tokenInfo = authService.getTokenInfo()

      if (tokenInfo) {
        console.log('🔐 Token status:', {
          expiresAt: tokenInfo.expiresAt
            ? new Date(tokenInfo.expiresAt * 1000)
            : null,
          timeUntilExpiration: tokenInfo.timeUntilExpiration,
          isExpired: tokenInfo.isExpired,
          willExpireSoon: tokenInfo.willExpireSoon
        })

        // If token is expired, logout immediately
        if (tokenInfo.isExpired) {
          console.log('🔐 Token expired, logging out')
          authService.logout()
          return
        }

        // If token will expire soon and auto refresh is enabled, try to refresh
        if (tokenInfo.willExpireSoon && enableAutoRefresh) {
          console.log('🔐 Token will expire soon, attempting refresh')
          const refreshed = await authService.refreshToken()

          if (!refreshed) {
            console.log('🔐 Token refresh failed, logging out')
            authService.logout()
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking token status:', error)
    } finally {
      isCheckingRef.current = false
    }
  }

  useEffect(() => {
    // Initial check
    checkTokenStatus()

    // Set up interval for periodic checks
    if (checkInterval > 0) {
      intervalRef.current = setInterval(checkTokenStatus, checkInterval)
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkInterval, redirectOnLogout, enableAutoRefresh])

  return {
    checkTokenStatus,
    isAuthenticated: authService.isAuthenticated(),
    tokenInfo: authService.getTokenInfo()
  }
}

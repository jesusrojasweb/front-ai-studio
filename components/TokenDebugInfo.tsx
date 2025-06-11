// Token Debug Info Component
// Shows token status and expiration info for development purposes

'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/lib/services/auth.service'

interface TokenInfo {
  expiresAt: number | null
  timeUntilExpiration: number | null
  isExpired: boolean
  willExpireSoon: boolean
}

export default function TokenDebugInfo() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateTokenInfo = () => {
      const info = authService.getTokenInfo()
      setTokenInfo(info)
    }

    updateTokenInfo()
    const interval = setInterval(updateTokenInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-md text-xs hover:bg-blue-700 z-50"
      >
        Show Token Info
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-sm text-xs font-mono z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Token Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {tokenInfo ? (
        <div className="space-y-2">
          <div>
            <span className="text-gray-400">Expires at:</span>{' '}
            {tokenInfo.expiresAt
              ? new Date(tokenInfo.expiresAt * 1000).toLocaleString()
              : 'Unknown'}
          </div>
          <div>
            <span className="text-gray-400">Time until expiration:</span>{' '}
            {tokenInfo.timeUntilExpiration
              ? `${Math.floor(tokenInfo.timeUntilExpiration / 60)}m ${
                  tokenInfo.timeUntilExpiration % 60
                }s`
              : 'Unknown'}
          </div>
          <div>
            <span className="text-gray-400">Is expired:</span>{' '}
            <span
              className={
                tokenInfo.isExpired ? 'text-red-400' : 'text-green-400'
              }
            >
              {tokenInfo.isExpired ? 'YES' : 'NO'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Will expire soon:</span>{' '}
            <span
              className={
                tokenInfo.willExpireSoon ? 'text-yellow-400' : 'text-green-400'
              }
            >
              {tokenInfo.willExpireSoon ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-700">
            <button
              onClick={() => authService.refreshToken()}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs mr-2"
            >
              Refresh Token
            </button>
            <button
              onClick={() => authService.logout()}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">
          {authService.isAuthenticated()
            ? 'No token info available'
            : 'Not authenticated'}
        </div>
      )}
    </div>
  )
}

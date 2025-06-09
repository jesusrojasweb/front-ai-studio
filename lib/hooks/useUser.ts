// Custom hook for user state management with Jotai
// This hook integrates the global user state with API calls

'use client'

import { useAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import {
  userAtom,
  userIdAtom,
  userLoadingAtom,
  userErrorAtom,
  setUserAtom,
  clearUserAtom,
  initializeUserAtom,
  isAuthenticatedAtom,
  userDisplayNameAtom
} from '@/lib/store/user.store'
import { usersService, type User } from '@/lib/services/users.service'
import {
  authService,
  getUserIdFromToken,
  type UserData
} from '@/lib/services/auth.service'

// Transform backend User to frontend UserData
const transformUserData = (user: User): UserData => ({
  id: user.id,
  email: user.email,
  displayName: user.display_name,
  planTier: user.plan_tier
})

export const useUser = () => {
  const [user, setUser] = useAtom(userAtom)
  const [userId, setUserId] = useAtom(userIdAtom)
  const [loading, setLoading] = useAtom(userLoadingAtom)
  const [error, setError] = useAtom(userErrorAtom)
  const [isAuthenticated] = useAtom(isAuthenticatedAtom)
  const [displayName] = useAtom(userDisplayNameAtom)

  const [, setUserData] = useAtom(setUserAtom)
  const [, clearUser] = useAtom(clearUserAtom)
  const [, initializeUser] = useAtom(initializeUserAtom)

  // Fetch user data from API
  const fetchUserData = useCallback(
    async (userIdToFetch?: string) => {
      try {
        setLoading(true)
        setError(null)

        const targetUserId = userIdToFetch || userId || getUserIdFromToken()

        if (!targetUserId) {
          throw new Error('No user ID available to fetch data')
        }

        console.log('🔄 Fetching user data for ID:', targetUserId)

        // Try to get current user profile first (more efficient)
        let userData: User
        if (!userIdToFetch && authService.isAuthenticated()) {
          userData = await usersService.getCurrentUserProfile()
        } else {
          userData = await usersService.getUserById(targetUserId)
        }

        // Transform and set user data
        const transformedData = transformUserData(userData)
        setUserData(transformedData)

        console.log('✅ User data loaded successfully:', transformedData)
        return transformedData
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load user data'
        console.error('❌ Failed to fetch user data:', errorMessage)
        setError(errorMessage)

        // If unauthorized, clear user data
        if (errorMessage.includes('Authentication required')) {
          clearUser()
        }

        throw error
      } finally {
        setLoading(false)
      }
    },
    [userId, setLoading, setError, setUserData, clearUser]
  )

  // Update user profile
  const updateUserProfile = useCallback(
    async (updateData: { display_name?: string; plan_tier?: string }) => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔄 Updating user profile:', updateData)

        const updatedUser = await usersService.updateCurrentUserProfile(
          updateData
        )
        const transformedData = transformUserData(updatedUser)

        setUserData(transformedData)

        console.log('✅ User profile updated successfully:', transformedData)
        return transformedData
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update user profile'
        console.error('❌ Failed to update user profile:', errorMessage)
        setError(errorMessage)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, setUserData]
  )

  // Initialize user state from localStorage and fetch if needed
  const initializeUserState = useCallback(async () => {
    console.log('🔄 Initializing user state...')

    // Load saved user ID from localStorage
    initializeUser()

    // If authenticated but no user data, fetch it
    if (authService.isAuthenticated() && !user) {
      try {
        await fetchUserData()
      } catch (error) {
        console.warn('Failed to fetch user data during initialization:', error)
      }
    }
  }, [user, fetchUserData, initializeUser])

  // Clear all user data (logout)
  const logout = useCallback(() => {
    console.log('🔄 Logging out user...')
    authService.logout()
    clearUser()
  }, [clearUser])

  // Check if user data needs to be fetched
  const shouldFetchUserData = useCallback((): boolean => {
    return authService.isAuthenticated() && !user && !loading
  }, [user, loading])

  return {
    // State
    user,
    userId,
    loading,
    error,
    isAuthenticated,
    displayName,

    // Actions
    fetchUserData,
    updateUserProfile,
    initializeUserState,
    logout,
    clearError: () => setError(null),

    // Utils
    shouldFetchUserData
  }
}

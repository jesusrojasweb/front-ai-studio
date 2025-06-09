import { atom } from 'jotai'
import { type UserData } from '@/lib/services/auth.service'

// User data atom - stores the complete user information
export const userAtom = atom<UserData | null>(null)

// User ID atom - stores just the user ID for quick access
export const userIdAtom = atom<string | null>(null)

// Loading state atom - tracks if user data is being fetched
export const userLoadingAtom = atom<boolean>(false)

// Error state atom - tracks any errors during user data fetching
export const userErrorAtom = atom<string | null>(null)

// Computed atom - checks if user is authenticated
export const isAuthenticatedAtom = atom<boolean>((get) => {
  const user = get(userAtom)
  return user !== null
})

// Computed atom - gets user display name
export const userDisplayNameAtom = atom<string>((get) => {
  const user = get(userAtom)
  return user?.displayName || 'User'
})

// Write-only atom to set user data and persist user ID
export const setUserAtom = atom(null, (get, set, userData: UserData | null) => {
  set(userAtom, userData)

  if (userData) {
    // Save user ID to localStorage
    set(userIdAtom, userData.id)
    localStorage.setItem('userId', userData.id)
  } else {
    // Clear user ID from localStorage
    set(userIdAtom, null)
    localStorage.removeItem('userId')
  }
})

// Write-only atom to clear all user data
export const clearUserAtom = atom(null, (get, set) => {
  set(userAtom, null)
  set(userIdAtom, null)
  set(userLoadingAtom, false)
  set(userErrorAtom, null)
  localStorage.removeItem('userId')
})

// Write-only atom to initialize user from localStorage
export const initializeUserAtom = atom(null, (get, set) => {
  if (typeof window !== 'undefined') {
    const savedUserId = localStorage.getItem('userId')
    if (savedUserId) {
      set(userIdAtom, savedUserId)
    }
  }
})

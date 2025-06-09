'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { authService } from '@/lib/services/auth.service'

interface LayoutProviderProps {
  children: React.ReactNode
}

export default function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Define routes that don't require authentication
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()

      // Handle route protection
      if (!isPublicRoute && !authenticated) {
        // Protected route but not authenticated - redirect to login
        console.log(
          '🔒 Protected route accessed without authentication, redirecting to login'
        )
        router.push('/login')
        return
      }

      if (isPublicRoute && authenticated) {
        // Auth route but already authenticated - redirect to home
        console.log(
          '🔒 Auth route accessed while authenticated, redirecting to home'
        )
        router.push('/')
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, isPublicRoute, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't show sidebar on clip-cutter routes since they have their own layout
  // Also exclude auth routes (login/register) as they should be full-screen
  if (
    pathname.startsWith('/clip-cutter') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 overflow-auto custom-scrollbar">{children}</div>
    </div>
  )
}

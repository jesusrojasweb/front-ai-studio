'use client'

import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { usePathname } from 'next/navigation'
import TokenDebugInfo from '@/components/TokenDebugInfo'

interface ClientAuthProviderProps {
  children: React.ReactNode
}

export default function ClientAuthProvider({
  children
}: ClientAuthProviderProps) {
  const pathname = usePathname()

  // Don't run auth guard on login/register pages
  const isAuthPage = pathname === '/login' || pathname === '/register'

  useAuthGuard({
    checkInterval: 60000, // Check every minute
    redirectOnLogout: !isAuthPage,
    enableAutoRefresh: !isAuthPage
  })

  return (
    <>
      {children}
      <TokenDebugInfo />
    </>
  )
}

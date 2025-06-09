'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'

interface LayoutProviderProps {
  children: React.ReactNode
}

export default function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname()

  // Don't show sidebar on clip-cutter routes since they have their own layout
  if (pathname.startsWith('/clip-cutter')) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 overflow-auto custom-scrollbar">{children}</div>
    </div>
  )
}

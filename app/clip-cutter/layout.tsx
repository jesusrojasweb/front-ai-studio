'use client'

import Sidebar from '@/components/sidebar'

export default function ClipCutterLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 overflow-auto custom-scrollbar">{children}</div>
    </div>
  )
}

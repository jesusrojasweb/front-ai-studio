'use client'

import { useState } from 'react'
import Sidebar from '../../components/sidebar'

export default function ClipCutterLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [showCreatorToolsSubmenu, setShowCreatorToolsSubmenu] = useState(false)

  const handleCreatorToolsClick = () => {
    setShowCreatorToolsSubmenu(!showCreatorToolsSubmenu)
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar onCreatorToolsClick={handleCreatorToolsClick} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

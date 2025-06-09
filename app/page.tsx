'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import Dashboard from '@/components/dashboard'
import { authService, type UserData } from '@/lib/services/auth.service'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user data
    const user = authService.getCurrentUser()
    setCurrentUser(user)
  }, [])

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">HOME</h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User size={16} />
                <span>Welcome, {currentUser.displayName}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
            <button className="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-search"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="w-full">
          <div className="w-full flex justify-center mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 pb-4 text-lg ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-green-500 text-white'
                  : 'text-gray-400'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 pb-4 text-lg ${
                activeTab === 'feed'
                  ? 'border-b-2 border-green-500 text-white'
                  : 'text-gray-400'
              }`}
            >
              Feed
            </button>
          </div>

          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'feed' && (
            <div className="text-center py-10">Feed content would go here</div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { LogOut, User, AlertCircle } from 'lucide-react'
import Dashboard from '@/components/dashboard'
import { useUser } from '@/lib/hooks/useUser'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const {
    user,
    loading,
    error,
    displayName,
    fetchUserData,
    logout,
    shouldFetchUserData,
    clearError
  } = useUser()

  useEffect(() => {
    // If we should fetch user data, do it
    if (shouldFetchUserData()) {
      console.log('🔄 Home page detected need to fetch user data')
      fetchUserData().catch((error) => {
        console.error('Failed to fetch user data on home page:', error)
      })
    }
  }, [shouldFetchUserData, fetchUserData])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">HOME</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User size={16} />
                <span>Welcome, {displayName}</span>
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading profile...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle size={16} />
                <span>Failed to load profile</span>
                <button
                  onClick={clearError}
                  className="text-xs underline hover:no-underline"
                >
                  Dismiss
                </button>
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

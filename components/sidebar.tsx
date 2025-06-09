'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Bell,
  MessageSquare,
  BarChart2,
  DollarSign,
  Wallet,
  Plus,
  Settings,
  Star,
  LogOut,
  MoreHorizontal,
  Globe,
  Shield,
  Flag,
  User
} from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'

// Function to generate user initials from display name
const generateInitials = (displayName: string): string => {
  if (!displayName.trim()) return 'U' // Default to 'U' for User if no name

  const nameParts = displayName
    .trim()
    .split(' ')
    .filter((part) => part.length > 0)

  if (nameParts.length === 0) return 'U'
  if (nameParts.length === 1) {
    // Single name - use first two characters
    return nameParts[0].substring(0, 2).toUpperCase()
  }
  if (nameParts.length === 2) {
    // Two names - use first letter of each
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  // More than two names - use first letter of first and last name
  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, displayName, loading, logout } = useUser()

  // Generate initials from display name
  const userInitials = generateInitials(displayName || '')
  const userName = displayName || 'Loading...'

  // Handle logout
  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-60 bg-[#121212] border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">
          {loading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            userInitials
          ) : (
            <User size={20} />
          )}
        </div>
        <div>
          <div className="font-bold">
            {loading ? (
              <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
            ) : (
              userName
            )}
          </div>
        </div>
        <div className="ml-auto bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs">
          ?
        </div>
      </div>

      <div className="px-4 py-2 text-sm text-gray-400">1 fan</div>

      <nav className="flex-1">
        <ul>
          <li
            className={`hover:bg-gray-800 ${
              pathname === '/' ? 'bg-gray-800' : ''
            }`}
          >
            <Link
              href="/"
              className="px-4 py-3 flex items-center gap-3 cursor-pointer"
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Search size={20} />
            <span>Discover</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Bell size={20} />
            <span>Notifications</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <MessageSquare size={20} />
            <span>Messages</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <BarChart2 size={20} />
            <span>Creator Tools</span>
          </li>
          <li
            className={`hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-blue-900/30 rounded-lg mx-2 transition-all duration-300 ${
              pathname.startsWith('/clip-cutter')
                ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 shadow-lg shadow-purple-500/20'
                : ''
            }`}
          >
            <Link
              href="/clip-cutter"
              className="px-4 py-3 flex items-center gap-3 cursor-pointer relative"
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-scissors text-purple-400"
                >
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <path d="M8.12 8.12 18 18" />
                  <path d="M8.12 8.12 18 18" />
                  <path d="m6 14 8.12-8.12" />
                  <path d="m14 18-8.12-8.12" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-medium">
                Clip Cutter
              </span>
              <div className="ml-auto">
                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold shadow-lg">
                  AI
                </span>
              </div>
            </Link>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <DollarSign size={20} />
            <span>Earnings & payouts</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Wallet size={20} />
            <span>Wallet</span>
            <span className="ml-auto text-sm">0.00</span>
          </li>
        </ul>
      </nav>

      <div className="p-4">
        <button className="w-full bg-white text-black rounded-full py-2 flex items-center justify-center gap-2">
          <Plus size={18} />
          <span>New Post</span>
        </button>
      </div>

      <div className="mt-auto">
        <ul>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Settings size={20} />
            <span>Settings</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Star size={20} />
            <span>What&apos;s new</span>
          </li>
          <li
            className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Log out</span>
          </li>
        </ul>

        <div className="flex items-center justify-between p-4 border-t border-gray-800 mt-2">
          <MoreHorizontal size={20} />
          <Globe size={20} />
          <Shield size={20} />
          <div className="w-6 h-6 flex items-center justify-center">
            <Flag className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}

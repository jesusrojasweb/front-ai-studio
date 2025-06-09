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
  Flag
} from 'lucide-react'

interface SidebarProps {
  onCreatorToolsClick: () => void
}

export default function Sidebar({ onCreatorToolsClick }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="w-60 bg-[#121212] border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">
          JR
        </div>
        <div>
          <div className="font-bold">Jesus Rojas</div>
          <div className="text-gray-400 text-sm">@jesusrj</div>
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
          <li
            className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer"
            onClick={onCreatorToolsClick}
          >
            <BarChart2 size={20} />
            <span>Creator Tools</span>
            <span className="ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-right"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </li>
          <li
            className={`hover:bg-gray-800 ${
              pathname.startsWith('/clip-cutter') ? 'bg-gray-800' : ''
            }`}
          >
            <Link
              href="/clip-cutter"
              className="px-4 py-3 flex items-center gap-3 cursor-pointer"
            >
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
                className="lucide lucide-scissors"
              >
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M8.12 8.12 18 18" />
                <path d="M8.12 8.12 18 18" />
                <path d="m6 14 8.12-8.12" />
                <path d="m14 18-8.12-8.12" />
              </svg>
              <span>Clip Cutter</span>
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
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
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

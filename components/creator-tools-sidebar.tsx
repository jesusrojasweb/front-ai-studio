import {
  BarChart2,
  FileText,
  Clock,
  Link,
  LineChart,
  Tag,
  MessageCircle,
  List,
  Settings,
  Plus,
  Globe,
  Shield,
  Flag,
  MoreHorizontal,
} from "lucide-react"

export default function CreatorToolsSidebar() {
  return (
    <div className="w-60 bg-[#121212] border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">JR</div>
        <div className="font-bold">CREATOR TOOLS</div>
        <div className="ml-auto bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs">?</div>
      </div>

      <nav className="flex-1">
        <ul>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <BarChart2 size={20} />
            <span>Insights</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
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
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <FileText size={20} />
            <span>Vault</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Clock size={20} />
            <span>Queue</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Link size={20} />
            <span>Paid media links</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <LineChart size={20} />
            <span>Tracking links</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Tag size={20} />
            <span>Promotions</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <MessageCircle size={20} />
            <span>Automated messages</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <List size={20} />
            <span>Lists</span>
          </li>
          <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800 cursor-pointer">
            <Settings size={20} />
            <span>Management</span>
            <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">Beta</span>
          </li>
        </ul>
      </nav>

      <div className="p-4">
        <button className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-auto">
        <div className="flex flex-col items-center gap-4 p-4 border-t border-gray-800 mt-2">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <Settings size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <Star size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <LogOut size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <MoreHorizontal size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <Globe size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <Shield size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-full">
            <Flag size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

import { LogOut, Star } from "lucide-react"

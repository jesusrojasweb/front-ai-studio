import { ChevronDown, Target } from 'lucide-react'

export default function Dashboard() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold">
          JR
        </div>
        <h2 className="text-2xl font-bold">WELCOME, JESUS ROJAS</h2>
      </div>

      <div className="bg-[#4a2d5c] rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-3xl font-bold">PROGRESS TO YOUR</h3>
            <div className="text-3xl italic">first $1,000</div>
          </div>
          <div className="text-pink-400">
            <Target size={60} />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <div className="font-bold text-xl">$10</div>
            <div className="font-bold text-xl">$1K</div>
          </div>
          <div className="w-full bg-[#6a3d7c] rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: '1%' }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">START EARNING IN 5 STEPS</h3>
          <ChevronDown size={24} />
        </div>
        <p className="text-gray-400">You&apos;ve completed 0 out of 5 steps</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">
          WHAT&apos;S HAPPENING IN YOUR BUSINESS
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h4 className="text-gray-400 mb-2">Payouts</h4>
            <div className="text-4xl font-bold mb-2">$0</div>
            <div className="text-gray-400">Total Balance</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h4 className="text-gray-400 mb-2">Earnings</h4>
            <div className="text-4xl font-bold mb-2">$10</div>
            <div className="text-gray-400">Last 30 days</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h4 className="text-gray-400 mb-2">Subscribers</h4>
            <div className="text-4xl font-bold mb-2">1</div>
            <div className="text-gray-400">Total today</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h4 className="text-gray-400 mb-2">Followers</h4>
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-gray-400">Total today</div>
          </div>
        </div>
      </div>
    </div>
  )
}

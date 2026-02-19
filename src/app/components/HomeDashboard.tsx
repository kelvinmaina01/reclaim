import { Play, TrendingUp, Settings, Sparkles, Clock, Bell } from 'lucide-react';
import type { AppData, Screen } from '../App';
import { User } from '@supabase/supabase-js';

interface HomeDashboardProps {
  data: AppData;
  user: User | null;
  onNavigate: (screen: Screen) => void;
  onBlockTriggered: (app: string, minutes: number) => void;
}

export function HomeHeader({ data }: { data: AppData }) {
  const progressPercentage = Math.min((data.dailyReclaimedMinutes / 60) * 100, 100);

  return (
    <div className="flex flex-col items-center">
      {/* Main Progress Circle */}
      <div className="flex flex-col items-center py-4">
        <div className="relative">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/20" />
            <circle
              cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPercentage / 100)}`}
              className="text-white transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold">{data.dailyReclaimedMinutes}</div>
            <div className="text-sm text-blue-100">minutes reclaimed</div>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="text-xl">🔥</span>
          <span className="font-semibold">{data.focusStreak} day streak</span>
        </div>
      </div>
    </div>
  );
}

export function HomeDashboard({ data, user, onNavigate, onBlockTriggered }: HomeDashboardProps) {

  return (
    <div className="h-full flex flex-col">

      {/* Motivational Message */}
      <div className="px-6 py-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 mb-1">You're doing great!</p>
              <p className="text-sm text-gray-600">
                You've reclaimed {data.dailyReclaimedMinutes} minutes today. Keep it up!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 pb-6 space-y-3">
        <button
          onClick={() => onNavigate('focus')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-lg">Start Focus Mode</div>
            <div className="text-sm text-blue-100">Block distractions & focus</div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('insights')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-sm font-semibold text-gray-800">AI Insights</div>
            <div className="text-xs text-gray-500 mt-1">View patterns</div>
          </button>

          <button
            onClick={() => onNavigate('rewards')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl">🎁</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">Rewards</div>
            <div className="text-xs text-gray-500 mt-1">{data.totalPoints} points</div>
          </button>
        </div>
      </div>

      {/* Most Blocked App Today */}
      <div className="px-6 pb-24">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">Most blocked today</span>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center text-2xl">
              📸
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Instagram Reels</div>
              <div className="text-sm text-gray-500">8 blocks · 24 min saved</div>
            </div>
            <button
              onClick={() => onBlockTriggered('Instagram', 12)}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Test Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

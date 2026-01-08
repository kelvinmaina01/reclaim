import { User, Award, Clock, Shield, Bell, Palette, ChevronRight, LogOut, Download } from 'lucide-react';
import type { AppData } from '../App';

interface ProfileProps {
  data: AppData;
  onUpdateData: (updates: Partial<AppData>) => void;
}

export function Profile({ data, onUpdateData }: ProfileProps) {
  const totalHoursReclaimed = Math.floor(data.dailyReclaimedMinutes / 60) + 48; // Mock total
  const totalDays = 14; // Mock total days

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Profile */}
      <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-b-[2rem]">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        {/* Avatar & Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Focus Master</h2>
            <p className="text-blue-100 text-sm">Member since {totalDays} days</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold mb-1">{data.focusStreak}</div>
            <div className="text-xs text-blue-100">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold mb-1">{totalHoursReclaimed}h</div>
            <div className="text-xs text-blue-100">Reclaimed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
            <div className="text-2xl font-bold mb-1">{data.totalPoints}</div>
            <div className="text-xs text-blue-100">Points</div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Achievements</h3>
          <span className="text-sm text-gray-500">3 unlocked</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {['🌱', '⭐', '🔥', '🏆'].map((emoji, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                index < 3
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                  : 'bg-gray-100 opacity-50'
              }`}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <h3 className="font-semibold text-gray-800 mb-3">Settings</h3>

        <div className="space-y-2">
          {/* AI Controls */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">AI Insights</div>
                  <div className="text-xs text-gray-500">Personalized recommendations</div>
                </div>
              </div>
              <button
                onClick={() => onUpdateData({ aiEnabled: !data.aiEnabled })}
                className={`w-12 h-7 rounded-full transition-all duration-200 relative ${
                  data.aiEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                    data.aiEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Notifications</div>
                  <div className="text-xs text-gray-500">Manage alerts & reminders</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Theme */}
          <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Palette className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Appearance</div>
                  <div className="text-xs text-gray-500">Theme & display</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Privacy & Data */}
          <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Privacy & Data</div>
                  <div className="text-xs text-gray-500">Your data is safe</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Export Data */}
          <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Export Data</div>
                  <div className="text-xs text-gray-500">Download your information</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Privacy Statement */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Your Privacy Matters</h3>
              <p className="text-sm text-gray-600">
                All data processing happens on your device. We never sell your data or share it with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button className="w-full mt-6 bg-white rounded-2xl p-4 shadow-sm border border-red-100 hover:bg-red-50 transition-colors">
          <div className="flex items-center justify-center gap-3 text-red-600">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sign Out</span>
          </div>
        </button>

        {/* Version */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Reclaim v1.0.0
        </div>
      </div>
    </div>
  );
}

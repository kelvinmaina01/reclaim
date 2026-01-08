import { Gift, Award, Heart, Book, Sparkles, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface RewardsProps {
  points: number;
}

const milestones = [
  { points: 500, label: 'Focus Beginner', icon: '🌱', unlocked: true },
  { points: 1000, label: 'Attention Master', icon: '⭐', unlocked: true },
  { points: 2500, label: 'Time Warrior', icon: '🏆', unlocked: false },
  { points: 5000, label: 'Productivity Legend', icon: '👑', unlocked: false },
];

const inAppRewards = [
  { id: 'theme-ocean', name: 'Ocean Theme', cost: 200, icon: '🌊', category: 'theme' },
  { id: 'theme-forest', name: 'Forest Theme', cost: 200, icon: '🌲', category: 'theme' },
  { id: 'sound-rain', name: 'Rain Sounds', cost: 150, icon: '🌧️', category: 'sound' },
  { id: 'sound-cafe', name: 'Café Ambience', cost: 150, icon: '☕', category: 'sound' },
  { id: 'report-monthly', name: 'Monthly AI Report', cost: 300, icon: '📊', category: 'report' },
];

const partnerRewards = [
  { id: 'coursera', name: 'Coursera Course', cost: 800, icon: '🎓', partner: 'Coursera' },
  { id: 'notion', name: 'Notion Pro (1 Month)', cost: 600, icon: '📝', partner: 'Notion' },
  { id: 'audible', name: 'Audible Credit', cost: 700, icon: '🎧', partner: 'Audible' },
  { id: 'headspace', name: 'Headspace Premium', cost: 500, icon: '🧘', partner: 'Headspace' },
];

const purposeRewards = [
  { id: 'education', name: 'Support Education', cost: 500, icon: '📚', cause: 'Khan Academy' },
  { id: 'opensource', name: 'Sponsor Open Source', cost: 400, icon: '💻', cause: 'Various Projects' },
  { id: 'environment', name: 'Plant Trees', cost: 300, icon: '🌳', cause: 'One Tree Planted' },
];

type Tab = 'unlock' | 'partner' | 'purpose';

export function Rewards({ points }: RewardsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('unlock');

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Gift className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">Rewards</h1>
        </div>

        {/* Points Balance */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
          <div className="text-sm text-amber-100 mb-1">Your Balance</div>
          <div className="text-4xl font-bold mb-3">{points} points</div>
          <div className="text-sm text-amber-100">
            Earn points by staying focused and avoiding distractions
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('unlock')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'unlock'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Unlockables
          </button>
          <button
            onClick={() => setActiveTab('partner')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'partner'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Partners
          </button>
          <button
            onClick={() => setActiveTab('purpose')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'purpose'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Purpose
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        {activeTab === 'unlock' && (
          <div className="space-y-6">
            {/* Milestones */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-gray-700" />
                <h2 className="font-semibold text-gray-800">Milestones</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.points}
                    className={`rounded-2xl p-4 text-center ${
                      milestone.unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">{milestone.icon}</div>
                    <div className="text-xs font-semibold mb-1">{milestone.label}</div>
                    <div className="text-xs opacity-80">{milestone.points} pts</div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-App Rewards */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gray-700" />
                <h2 className="font-semibold text-gray-800">Unlock Features</h2>
              </div>
              <div className="space-y-3">
                {inAppRewards.map((reward) => (
                  <button
                    key={reward.id}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
                      {reward.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-800">{reward.name}</div>
                      <div className="text-sm text-gray-500">{reward.cost} points</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      points >= reward.cost
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {points >= reward.cost ? 'Unlock' : 'Locked'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'partner' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Partner Rewards:</span> Redeem your points for premium services and tools from our partners
              </p>
            </div>
            {partnerRewards.map((reward) => (
              <button
                key={reward.id}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl">
                  {reward.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-800">{reward.name}</div>
                  <div className="text-xs text-gray-500 mb-1">{reward.partner}</div>
                  <div className="text-sm font-semibold text-blue-600">{reward.cost} points</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {activeTab === 'purpose' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">Give Back</span>
              </div>
              <p className="text-sm text-gray-700">
                Turn your focus into impact. Donate your points to support meaningful causes.
              </p>
            </div>
            {purposeRewards.map((reward) => (
              <button
                key={reward.id}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95 text-left"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">{reward.name}</div>
                    <div className="text-xs text-gray-500">{reward.cause}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-green-600">{reward.cost} points</div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    points >= reward.cost
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {points >= reward.cost ? 'Donate' : 'Locked'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { ChevronLeft, Clock, Brain, AlertCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface AppLimitsProps {
  data: {
    blockedApps: string[];
  };
  onBack: () => void;
}

interface AppLimit {
  id: string;
  name: string;
  icon: string;
  category: string;
  currentLimit: number;
  todayUsage: number;
  enabled: boolean;
  aiSuggested?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

const apps: AppLimit[] = [
  {
    id: 'instagram',
    name: 'Instagram Reels',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
    category: 'Short-form',
    currentLimit: 15,
    todayUsage: 24,
    enabled: true,
    aiSuggested: 10,
    riskLevel: 'high',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg',
    category: 'Short-form',
    currentLimit: 20,
    todayUsage: 8,
    enabled: true,
    aiSuggested: 15,
    riskLevel: 'medium',
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    category: 'Short-form',
    currentLimit: 30,
    todayUsage: 12,
    enabled: true,
    riskLevel: 'medium',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: 'https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg',
    category: 'Social',
    currentLimit: 25,
    todayUsage: 18,
    enabled: false,
    riskLevel: 'medium',
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Threads_%28app%29_logo.svg',
    category: 'Social',
    currentLimit: 30,
    todayUsage: 5,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
    category: 'Social',
    currentLimit: 45,
    todayUsage: 30,
    enabled: true,
    riskLevel: 'high',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
    category: 'Social',
    currentLimit: 30,
    todayUsage: 10,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg',
    category: 'Communication',
    currentLimit: 60,
    todayUsage: 15,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    category: 'Communication',
    currentLimit: 60,
    todayUsage: 45,
    enabled: true,
    riskLevel: 'medium',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
    category: 'Communication',
    currentLimit: 30,
    todayUsage: 0,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo.svg',
    category: 'Social',
    currentLimit: 120,
    todayUsage: 60,
    enabled: true,
    riskLevel: 'medium',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'https://upload.wikimedia.org/wikipedia/en/b/bd/Reddit_Logo_Icon.svg',
    category: 'Social',
    currentLimit: 45,
    todayUsage: 20,
    enabled: true,
    riskLevel: 'medium',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
    category: 'Social',
    currentLimit: 15,
    todayUsage: 5,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png',
    category: 'Social',
    currentLimit: 30,
    todayUsage: 0,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'bereal',
    name: 'BeReal',
    icon: 'https://upload.wikimedia.org/wikipedia/en/4/40/BeReal_logo.png',
    category: 'Social',
    currentLimit: 10,
    todayUsage: 2,
    enabled: false,
    riskLevel: 'low',
  },
  {
    id: 'tumblr',
    name: 'Tumblr',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Tumblr_logotype_2018.svg',
    category: 'Social',
    currentLimit: 30,
    todayUsage: 0,
    enabled: false,
    riskLevel: 'low',
  }
];

export function AppLimits({ data, onBack }: AppLimitsProps) {
  const [appLimits, setAppLimits] = useState(apps);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const toggleApp = (id: string) => {
    setAppLimits((prev) =>
      prev.map((app) => (app.id === id ? { ...app, enabled: !app.enabled } : app))
    );
  };

  const updateLimit = (id: string, newLimit: number) => {
    setAppLimits((prev) =>
      prev.map((app) => (app.id === id ? { ...app, currentLimit: newLimit } : app))
    );
  };

  const applyAISuggestion = (id: string) => {
    const app = appLimits.find((a) => a.id === id);
    if (app?.aiSuggested) {
      updateLimit(id, app.aiSuggested);
    }
  };

  const getRiskColor = (riskLevel?: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const selectedAppData = appLimits.find((app) => app.id === selectedApp);

  if (selectedApp && selectedAppData) {
    const usagePercentage = (selectedAppData.todayUsage / selectedAppData.currentLimit) * 100;
    const isOverLimit = selectedAppData.todayUsage > selectedAppData.currentLimit;

    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <button
            onClick={() => setSelectedApp(null)}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-white/20 p-3 overflow-hidden">
              {selectedAppData.icon.startsWith('http') ? (
                <img src={selectedAppData.icon} alt={selectedAppData.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-4xl">{selectedAppData.icon}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedAppData.name}</h1>
              <p className="text-blue-100">{selectedAppData.category}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Today's Usage */}
          <div className={`rounded-2xl p-5 shadow-sm border mb-4 ${isOverLimit
            ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
            : 'bg-white border-gray-100'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Today's Usage</div>
              {isOverLimit && (
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                  Over limit
                </div>
              )}
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-5xl font-bold text-gray-800">{selectedAppData.todayUsage}</span>
              <span className="text-xl text-gray-500 mb-2">/ {selectedAppData.currentLimit} min</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverLimit
                  ? 'bg-gradient-to-r from-red-500 to-pink-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                style={{
                  width: `${Math.min(usagePercentage, 100)}%`,
                }}
              />
            </div>
            {isOverLimit && (
              <p className="text-sm text-red-600 mt-3">
                You've exceeded your limit by {selectedAppData.todayUsage - selectedAppData.currentLimit} minutes
              </p>
            )}
          </div>

          {/* Slider Control */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-700">Daily Limit</div>
              <div className="text-3xl font-bold text-blue-600">{selectedAppData.currentLimit} min</div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={selectedAppData.currentLimit}
              onChange={(e) => updateLimit(selectedAppData.id, parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5 min</span>
              <span>30 min</span>
              <span>60 min</span>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2 mt-4">
              {[5, 10, 15, 30, 60].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => updateLimit(selectedAppData.id, minutes)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${selectedAppData.currentLimit === minutes
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestion */}
          {selectedAppData.aiSuggested && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">AI Recommendation</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Based on your usage patterns, we suggest limiting this app to{' '}
                    <span className="font-semibold text-purple-700">{selectedAppData.aiSuggested} minutes</span> daily.
                    This matches your most productive days.
                  </p>
                  <button
                    onClick={() => applyAISuggestion(selectedAppData.id)}
                    className="text-sm text-purple-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    Apply suggestion <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Override Info */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">Flexible Override</h3>
                <p className="text-sm text-gray-600">
                  You can always unlock with an 8-second breathing pause. This helps you make intentional choices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalDailyLimit = appLimits.filter(app => app.enabled).reduce((sum, app) => sum + app.currentLimit, 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold mb-2">App Limits</h1>
        <p className="text-blue-100">Choose how you spend your time</p>
      </div>

      {/* Category Summary */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm text-gray-600">Total Daily Limit</div>
              <div className="text-lg font-bold text-gray-800">{totalDailyLimit} minutes</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{appLimits.filter(app => app.enabled).length} apps active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Apps List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="space-y-3">
          {appLimits.map((app) => {
            const usagePercentage = (app.todayUsage / app.currentLimit) * 100;
            const isOverLimit = app.todayUsage > app.currentLimit;
            const isNearLimit = usagePercentage >= 80 && !isOverLimit;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 p-2 overflow-hidden">
                    {app.icon.startsWith('http') ? (
                      <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-3xl">{app.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      {app.name}
                      {app.riskLevel === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                          High risk
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{app.category}</div>
                  </div>
                  <button
                    onClick={() => toggleApp(app.id)}
                    className={`w-12 h-7 rounded-full transition-all duration-200 relative ${app.enabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-200 ${app.enabled ? 'right-1' : 'left-1'
                        }`}
                    />
                  </button>
                </div>

                {app.enabled && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {app.todayUsage} / {app.currentLimit} min today
                      </span>
                      <button
                        onClick={() => setSelectedApp(app.id)}
                        className="text-sm text-blue-600 font-semibold hover:underline"
                      >
                        Adjust
                      </button>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOverLimit
                          ? 'bg-gradient-to-r from-red-500 to-pink-500'
                          : isNearLimit
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                        style={{
                          width: `${Math.min(usagePercentage, 100)}%`,
                        }}
                      />
                    </div>
                    {app.aiSuggested && (
                      <div className="flex items-center gap-2 text-xs text-purple-600">
                        <Brain className="w-3 h-3" />
                        <span>AI suggests {app.aiSuggested} min</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
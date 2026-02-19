import { Brain, TrendingUp, AlertTriangle, Coffee, Sun, Moon, HelpCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface AIInsightsProps {
  data: {
    aiEnabled: boolean;
  };
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  explanation: string;
  dataUsed: string;
}

const insights: InsightCard[] = [
  {
    id: 'productivity-window',
    title: 'Peak Productivity',
    description: 'You focus best between 6–9am',
    icon: Sun,
    color: 'from-amber-400 to-orange-500',
    explanation: 'Based on your focus session completion rates and app usage patterns during different times of day.',
    dataUsed: 'Focus session data, app usage timestamps',
  },
  {
    id: 'scroll-risk',
    title: 'Scroll Risk Alert',
    description: 'High risk detected around 10pm',
    icon: AlertTriangle,
    color: 'from-red-400 to-pink-500',
    explanation: 'Your usage patterns show increased social media activity during this time, often exceeding your limits.',
    dataUsed: 'Historical app usage patterns, limit breach data',
  },
  {
    id: 'burnout',
    title: 'Burnout Prevention',
    description: 'Consider taking a break today',
    icon: Coffee,
    color: 'from-green-400 to-emerald-500',
    explanation: 'Your focus sessions have been longer than usual. Rest helps maintain long-term productivity.',
    dataUsed: 'Focus session duration, frequency patterns',
  },
  {
    id: 'night-owl',
    title: 'Evening Pattern',
    description: 'You tend to scroll late at night',
    icon: Moon,
    color: 'from-indigo-400 to-purple-500',
    explanation: 'Late-night usage can affect sleep quality. We suggest enabling auto-limits after 9pm.',
    dataUsed: 'Usage timing data, sleep schedule correlation',
  },
];

export function AIInsights({ data }: AIInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const selectedCard = insights.find((i) => i.id === selectedInsight);

  if (selectedInsight && selectedCard) {
    return (
      <div className="flex flex-col">
        {/* Insight Detail */}
        <div className="space-y-6">
          <button
            onClick={() => setSelectedInsight(null)}
            className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider mb-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Overview
          </button>
          <div className={`bg-gradient-to-br ${selectedCard.color} rounded-3xl p-6 text-white mb-6`}>
            <selectedCard.icon className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{selectedCard.title}</h2>
            <p className="text-lg opacity-90">{selectedCard.description}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Why this insight?</h3>
                  <p className="text-sm text-gray-600">{selectedCard.explanation}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Data used</h3>
                  <p className="text-sm text-gray-600">{selectedCard.dataUsed}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Privacy first:</span> All insights are generated on your device. Your data never leaves your phone.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3 pb-24">
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 active:scale-95">
              Apply Suggestion
            </button>
            <button className="w-full bg-white text-gray-700 py-4 rounded-2xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all duration-200 active:scale-95">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">

      {!data.aiEnabled ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">AI Insights Disabled</h2>
            <p className="text-gray-600 mb-6">
              Enable AI insights in settings to get personalized recommendations and predictions.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200">
              Enable AI Insights
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          {/* Weekly Summary */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white mb-6 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">This Week's Reflection</span>
            </div>
            <p className="text-blue-50 leading-relaxed">
              You've shown strong focus during morning hours and successfully reduced evening scrolling by 34%. Your productivity is trending upward—keep building on this momentum!
            </p>
          </div>

          {/* Insights Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 px-1">Personalized Insights</h2>
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <button
                  key={insight.id}
                  onClick={() => setSelectedInsight(insight.id)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${insight.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 mb-1">{insight.title}</div>
                      <div className="text-sm text-gray-600">{insight.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Controls */}
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">AI Transparency</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              All AI processing happens on your device. Your data is private and never shared.
            </p>
            <button className="text-sm text-purple-600 font-semibold hover:underline">
              Manage AI Settings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
